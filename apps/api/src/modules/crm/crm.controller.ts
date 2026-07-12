import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CrmService } from './crm.service';
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

@ApiTags('crm')
@ApiBearerAuth()
@Controller('crm')
export class CrmController {
  constructor(private readonly service: CrmService) {}

  // ─── Customers ──────────────────────────────────────────────────────────────

  @Post('customers')
  @RequirePermission('crm.customer:create')
  @ApiOperation({ summary: 'Create a customer profile' })
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.service.createCustomer(dto);
  }

  @Get('customers')
  @RequirePermission('crm.customer:read')
  @ApiOperation({ summary: 'List customers with search and cursor pagination' })
  listCustomers(@Query() dto: CustomerQueryDto) {
    return this.service.listCustomers(dto);
  }

  @Get('customers/:id')
  @RequirePermission('crm.customer:read')
  @ApiOperation({ summary: 'Get customer by ID' })
  getCustomer(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getCustomer(id);
  }

  @Patch('customers/:id')
  @RequirePermission('crm.customer:update')
  @ApiOperation({ summary: 'Update customer profile' })
  updateCustomer(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.updateCustomer(id, dto);
  }

  // ─── Wallet ─────────────────────────────────────────────────────────────────

  @Post('wallet')
  @RequirePermission('crm.wallet:operate')
  @ApiOperation({ summary: 'Load, redeem, refund or adjust wallet balance' })
  walletOperation(@Body() dto: WalletOperationDto) {
    return this.service.walletOperation(dto);
  }

  @Get('customers/:customerId/wallet')
  @RequirePermission('crm.customer:read')
  @ApiOperation({ summary: 'Get wallet ledger for a customer' })
  getWalletLedger(@Param('customerId', new ParseUUIDPipe()) customerId: string) {
    return this.service.getWalletLedger(customerId);
  }

  // ─── Loyalty ────────────────────────────────────────────────────────────────

  @Post('loyalty/program')
  @RequirePermission('crm.loyalty:manage')
  @ApiOperation({ summary: 'Create or update the loyalty program for this tenant' })
  upsertLoyaltyProgram(@Body() dto: UpsertLoyaltyProgramDto) {
    return this.service.upsertLoyaltyProgram(dto);
  }

  @Get('loyalty/program')
  @RequirePermission('crm.loyalty:read')
  @ApiOperation({ summary: 'Get the loyalty program configuration' })
  getLoyaltyProgram() {
    return this.service.getLoyaltyProgram();
  }

  @Post('loyalty/operation')
  @RequirePermission('crm.loyalty:manage')
  @ApiOperation({ summary: 'Earn or redeem loyalty points for a customer' })
  loyaltyOperation(@Body() dto: LoyaltyOperationDto) {
    return this.service.loyaltyOperation(dto);
  }

  // ─── Gift Cards ──────────────────────────────────────────────────────────────

  @Post('gift-cards')
  @RequirePermission('crm.gift-card:manage')
  @ApiOperation({ summary: 'Issue a new gift card' })
  issueGiftCard(@Body() dto: IssueGiftCardDto) {
    return this.service.issueGiftCard(dto);
  }

  @Post('gift-cards/redeem')
  @RequirePermission('crm.gift-card:manage')
  @ApiOperation({ summary: 'Redeem amount from a gift card' })
  redeemGiftCard(@Body() dto: RedeemGiftCardDto) {
    return this.service.redeemGiftCard(dto);
  }

  @Get('gift-cards/:code')
  @RequirePermission('crm.gift-card:manage')
  @ApiOperation({ summary: 'Get gift card by code' })
  getGiftCard(@Param('code') code: string) {
    return this.service.getGiftCard(code);
  }

  // ─── Coupons ────────────────────────────────────────────────────────────────

  @Post('coupons')
  @RequirePermission('crm.coupon:manage')
  @ApiOperation({ summary: 'Create a coupon' })
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.service.createCoupon(dto);
  }

  @Post('coupons/validate')
  @RequirePermission('crm.coupon:manage')
  @ApiOperation({ summary: 'Validate a coupon and compute the discount' })
  validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.service.validateCoupon(dto);
  }

  @Get('coupons')
  @RequirePermission('crm.coupon:manage')
  @ApiOperation({ summary: 'List active coupons' })
  listCoupons() {
    return this.service.listCoupons();
  }

  // ─── Campaigns ───────────────────────────────────────────────────────────────

  @Post('campaigns')
  @RequirePermission('crm.campaign:manage')
  @ApiOperation({ summary: 'Create a marketing campaign' })
  createCampaign(@Body() dto: CreateCampaignDto) {
    return this.service.createCampaign(dto);
  }

  @Get('campaigns')
  @RequirePermission('crm.campaign:read')
  @ApiOperation({ summary: 'List campaigns' })
  listCampaigns() {
    return this.service.listCampaigns();
  }

  @Get('campaigns/:id')
  @RequirePermission('crm.campaign:read')
  @ApiOperation({ summary: 'Get campaign by ID' })
  getCampaign(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getCampaign(id);
  }

  @Patch('campaigns/:id/cancel')
  @RequirePermission('crm.campaign:manage')
  @ApiOperation({ summary: 'Cancel a campaign' })
  cancelCampaign(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.cancelCampaign(id);
  }
}
