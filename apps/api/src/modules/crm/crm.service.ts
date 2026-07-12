import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@aureus/database';
type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;
import { PrismaService } from '../../common/prisma.service';
import { TenantContext } from '../../common/tenant-context';
import { AuditService } from '../identity/audit/audit.service';
import type {
  CreateCampaignDto,
  CreateCouponDto,
  CreateCustomerDto,
  CustomerQueryDto,
  IssueGiftCardDto,
  LoyaltyOperationDto,
  RedeemGiftCardDto,
  UpdateCustomerDto,
  UpsertLoyaltyProgramDto,
  ValidateCouponDto,
  WalletOperationDto,
} from './dto/crm.dto';

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private ctx(): { tenantId: string; userId: string | undefined } {
    const c = TenantContext.get();
    if (!c?.tenantId) throw new BadRequestException('No tenant context');
    return { tenantId: c.tenantId, userId: c.userId };
  }

  // ─── Customers ──────────────────────────────────────────────────────────────

  async createCustomer(dto: CreateCustomerDto) {
    const { tenantId, userId } = this.ctx();

    if (dto.phone) {
      const existing = await this.prisma.customer.findUnique({
        where: { tenantId_phone: { tenantId, phone: dto.phone } },
      });
      if (existing) throw new ConflictException(`Customer with phone '${dto.phone}' already exists`);
    }

    const customer = await this.prisma.customer.create({
      data: {
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
        anniversary: dto.anniversary ? new Date(dto.anniversary) : undefined,
        addressLine1: dto.addressLine1,
        city: dto.city,
        tags: dto.tags ?? [],
        marketingOptIn: dto.marketingOptIn ?? true,
        notes: dto.notes,
      },
    });

    await this.audit.log({
      action: 'crm.customer:create',
      entityType: 'customer',
      entityId: customer.id,
      after: { firstName: dto.firstName, phone: dto.phone, createdBy: userId },
    });
    return customer;
  }

  async listCustomers(dto: CustomerQueryDto) {
    const { tenantId } = this.ctx();
    const limit = dto.limit ?? 30;
    return this.prisma.customer.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(dto.search
          ? {
              OR: [
                { firstName: { contains: dto.search, mode: 'insensitive' } },
                { lastName: { contains: dto.search, mode: 'insensitive' } },
                { phone: { contains: dto.search } },
                { email: { contains: dto.search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(dto.tag ? { tags: { has: dto.tag } } : {}),
        ...(dto.cursor ? { id: { lt: dto.cursor } } : {}),
      },
      orderBy: { id: 'desc' },
      take: limit,
    });
  }

  async getCustomer(id: string) {
    const { tenantId } = this.ctx();
    const c = await this.prisma.customer.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto) {
    const { tenantId } = this.ctx();
    const c = await this.prisma.customer.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!c) throw new NotFoundException('Customer not found');

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.birthday !== undefined ? { birthday: new Date(dto.birthday) } : {}),
        ...(dto.anniversary !== undefined ? { anniversary: new Date(dto.anniversary) } : {}),
        ...(dto.addressLine1 !== undefined ? { addressLine1: dto.addressLine1 } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
        ...(dto.marketingOptIn !== undefined ? { marketingOptIn: dto.marketingOptIn } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }

  // ─── Wallet ─────────────────────────────────────────────────────────────────

  async walletOperation(dto: WalletOperationDto) {
    const { tenantId, userId } = this.ctx();
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const amount = new Decimal(dto.amount);

    if ((dto.type === 'REDEEM' || dto.type === 'ADJUSTMENT') && amount.isNegative() === false) {
      // For REDEEM, amount must be positive but balance check needed
      if (dto.type === 'REDEEM') {
        if (new Decimal(customer.walletBalance).lessThan(amount)) {
          throw new BadRequestException('Insufficient wallet balance');
        }
      }
    }

    const delta = dto.type === 'LOAD' || dto.type === 'REFUND' ? amount : amount.negated();

    await this.prisma.$transaction(async (tx) => {
      await tx.walletLedger.create({
        data: {
          tenantId,
          customerId: dto.customerId,
          type: dto.type as any,
          amount: delta,
          sourceType: dto.sourceType,
          sourceId: dto.sourceId,
          note: dto.note,
          createdBy: userId,
        },
      });

      await tx.customer.update({
        where: { id: dto.customerId },
        data: { walletBalance: { increment: delta } },
      });
    });

    return this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      select: { id: true, walletBalance: true },
    });
  }

  async getWalletLedger(customerId: string) {
    const { tenantId } = this.ctx();
    return this.prisma.walletLedger.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // ─── Loyalty Program ────────────────────────────────────────────────────────

  async upsertLoyaltyProgram(dto: UpsertLoyaltyProgramDto) {
    const { tenantId } = this.ctx();
    return this.prisma.loyaltyProgram.upsert({
      where: { tenantId },
      create: {
        tenantId,
        name: dto.name,
        earnRate: new Decimal(dto.earnRate),
        redeemValue: new Decimal(dto.redeemValue),
        pointExpiryDays: dto.pointExpiryDays,
        isActive: dto.isActive ?? true,
      },
      update: {
        name: dto.name,
        earnRate: new Decimal(dto.earnRate),
        redeemValue: new Decimal(dto.redeemValue),
        ...(dto.pointExpiryDays !== undefined ? { pointExpiryDays: dto.pointExpiryDays } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async getLoyaltyProgram() {
    const { tenantId } = this.ctx();
    return this.prisma.loyaltyProgram.findUnique({ where: { tenantId } });
  }

  async loyaltyOperation(dto: LoyaltyOperationDto) {
    const { tenantId } = this.ctx();
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    if (dto.type === 'REDEEM') {
      if (new Decimal(customer.loyaltyPoints).lessThan(dto.points)) {
        throw new BadRequestException('Insufficient loyalty points');
      }
    }

    const delta = dto.type === 'EARN' ? new Decimal(dto.points) : new Decimal(dto.points).negated();

    await this.prisma.$transaction(async (tx) => {
      await tx.loyaltyLedger.create({
        data: {
          tenantId,
          customerId: dto.customerId,
          type: dto.type as any,
          points: delta,
          sourceType: dto.sourceType,
          sourceId: dto.sourceId,
        },
      });

      await tx.customer.update({
        where: { id: dto.customerId },
        data: { loyaltyPoints: { increment: delta } },
      });
    });

    return this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      select: { id: true, loyaltyPoints: true, loyaltyTier: true },
    });
  }

  // ─── Gift Cards ──────────────────────────────────────────────────────────────

  async issueGiftCard(dto: IssueGiftCardDto) {
    const { tenantId, userId } = this.ctx();
    const existing = await this.prisma.giftCard.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) throw new ConflictException(`Gift card code '${dto.code}' already exists`);

    return this.prisma.giftCard.create({
      data: {
        tenantId,
        code: dto.code,
        initialValue: new Decimal(dto.initialValue),
        balance: new Decimal(dto.initialValue),
        customerId: dto.customerId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        issuedBy: userId,
      },
    });
  }

  async redeemGiftCard(dto: RedeemGiftCardDto) {
    const { tenantId } = this.ctx();
    const card = await this.prisma.giftCard.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (!card) throw new NotFoundException('Gift card not found');
    if (card.status !== 'ACTIVE') throw new BadRequestException(`Gift card is ${card.status}`);
    if (card.expiresAt && card.expiresAt < new Date()) {
      throw new BadRequestException('Gift card has expired');
    }

    const amount = new Decimal(dto.amount);
    if (new Decimal(card.balance).lessThan(amount)) {
      throw new BadRequestException('Insufficient gift card balance');
    }

    const newBalance = new Decimal(card.balance).minus(amount);
    return this.prisma.giftCard.update({
      where: { id: card.id },
      data: {
        balance: newBalance,
        status: newBalance.isZero() ? 'REDEEMED' : 'ACTIVE',
      },
    });
  }

  async getGiftCard(code: string) {
    const { tenantId } = this.ctx();
    const card = await this.prisma.giftCard.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
    if (!card) throw new NotFoundException('Gift card not found');
    return card;
  }

  // ─── Coupons ────────────────────────────────────────────────────────────────

  async createCoupon(dto: CreateCouponDto) {
    const { tenantId } = this.ctx();
    const existing = await this.prisma.coupon.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) throw new ConflictException(`Coupon code '${dto.code}' already exists`);

    return this.prisma.coupon.create({
      data: {
        tenantId,
        code: dto.code.toUpperCase(),
        type: dto.type as any,
        value: new Decimal(dto.value),
        minOrderAmount: dto.minOrderAmount !== undefined ? new Decimal(dto.minOrderAmount) : undefined,
        maxDiscountAmount: dto.maxDiscountAmount !== undefined ? new Decimal(dto.maxDiscountAmount) : undefined,
        usageLimit: dto.usageLimit,
        perCustomerLimit: dto.perCustomerLimit,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        channels: (dto.channels as any) ?? [],
      },
    });
  }

  async validateCoupon(dto: ValidateCouponDto) {
    const { tenantId } = this.ctx();
    const coupon = await this.prisma.coupon.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code.toUpperCase() } },
    });
    if (!coupon || !coupon.isActive) throw new NotFoundException('Coupon not found or inactive');

    const now = new Date();
    if (coupon.validFrom && coupon.validFrom > now) throw new BadRequestException('Coupon not yet valid');
    if (coupon.validTo && coupon.validTo < now) throw new BadRequestException('Coupon has expired');
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    if (coupon.minOrderAmount !== null && new Decimal(dto.orderAmount).lessThan(coupon.minOrderAmount)) {
      throw new BadRequestException(`Minimum order amount is ₹${coupon.minOrderAmount}`);
    }

    let discount = new Decimal(0);
    if (coupon.type === 'PERCENTAGE') {
      discount = new Decimal(dto.orderAmount).times(new Decimal(coupon.value).dividedBy(100));
      if (coupon.maxDiscountAmount !== null) {
        discount = Decimal.min(discount, new Decimal(coupon.maxDiscountAmount));
      }
    } else if (coupon.type === 'AMOUNT') {
      discount = Decimal.min(new Decimal(coupon.value), new Decimal(dto.orderAmount));
    } else {
      discount = new Decimal(0); // BOGO handled at order level
    }

    return { valid: true, discount: discount.toFixed(2), coupon };
  }

  async listCoupons() {
    const { tenantId } = this.ctx();
    return this.prisma.coupon.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Campaigns ───────────────────────────────────────────────────────────────

  async createCampaign(dto: CreateCampaignDto) {
    const { tenantId, userId } = this.ctx();
    return this.prisma.campaign.create({
      data: {
        tenantId,
        name: dto.name,
        channel: dto.channel as any,
        template: dto.template,
        segment: (dto.segment ?? {}) as any,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        trigger: dto.trigger,
        isRecurring: dto.isRecurring ?? false,
        createdBy: userId,
      },
    });
  }

  async listCampaigns() {
    const { tenantId } = this.ctx();
    return this.prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaign(id: string) {
    const { tenantId } = this.ctx();
    const c = await this.prisma.campaign.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Campaign not found');
    return c;
  }

  async cancelCampaign(id: string) {
    const { tenantId } = this.ctx();
    const c = await this.prisma.campaign.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Campaign not found');
    if (c.status === 'SENT' || c.status === 'CANCELLED') {
      throw new BadRequestException(`Campaign is already ${c.status}`);
    }
    return this.prisma.campaign.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
}
