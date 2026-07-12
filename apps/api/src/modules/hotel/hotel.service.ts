import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@aureus/database';
type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;
import { PrismaService } from '../../common/prisma.service';
import { SequenceService } from '../../common/sequence.service';
import { TenantContext } from '../../common/tenant-context';
import { AuditService } from '../identity/audit/audit.service';
import type {
  CheckInDto,
  CheckOutDto,
  CreateGuestProfileDto,
  CreateHousekeepingTaskDto,
  CreateRatePlanDto,
  CreateRateOverrideDto,
  CreateReservationDto,
  CreateRoomDto,
  CreateRoomTypeDto,
  GuestQueryDto,
  HousekeepingQueryDto,
  NightAuditDto,
  PostFolioChargeDto,
  ReservationQueryDto,
  RoomQueryDto,
  SettleFolioDto,
  UpdateGuestProfileDto,
  UpdateHousekeepingTaskDto,
  UpdateRatePlanDto,
  UpdateRoomDto,
  UpdateRoomStatusDto,
  UpdateRoomTypeDto,
  UpdateReservationDto,
} from './dto/hotel.dto';

@Injectable()
export class HotelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SequenceService,
    private readonly audit: AuditService,
  ) {}

  private ctx(): { tenantId: string; userId: string | undefined } {
    const c = TenantContext.get();
    if (!c?.tenantId) throw new BadRequestException('No tenant context');
    return { tenantId: c.tenantId, userId: c.userId };
  }

  // ─── Room Types ────────────────────────────────────────────────────────────

  async createRoomType(dto: CreateRoomTypeDto) {
    const { tenantId, userId } = this.ctx();

    const existing = await this.prisma.roomType.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) throw new BadRequestException(`Room type code '${dto.code}' already exists`);

    const roomType = await this.prisma.roomType.create({
      data: {
        tenantId,
        locationId: dto.locationId,
        name: dto.name,
        code: dto.code,
        baseOccupancy: dto.baseOccupancy ?? 2,
        maxOccupancy: dto.maxOccupancy ?? 3,
        baseRate: new Decimal(dto.baseRate),
        extraBedRate: dto.extraBedRate !== undefined ? new Decimal(dto.extraBedRate) : new Decimal(0),
        amenities: dto.amenities ?? [],
      },
    });

    await this.audit.log({
      action: 'hotel.room_type:create',
      entityType: 'room_type',
      entityId: roomType.id,
      after: { code: roomType.code, name: roomType.name },
    });
    void userId;
    return roomType;
  }

  async listRoomTypes(locationId?: string) {
    const { tenantId } = this.ctx();
    return this.prisma.roomType.findMany({
      where: {
        tenantId,
        ...(locationId ? { locationId } : {}),
        deletedAt: null,
      },
      include: { ratePlans: { where: { isActive: true } } },
      orderBy: { code: 'asc' },
    });
  }

  async updateRoomType(id: string, dto: UpdateRoomTypeDto) {
    const { tenantId } = this.ctx();
    const rt = await this.prisma.roomType.findFirst({ where: { id, tenantId } });
    if (!rt) throw new NotFoundException('Room type not found');

    return this.prisma.roomType.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.baseRate !== undefined ? { baseRate: new Decimal(dto.baseRate) } : {}),
        ...(dto.extraBedRate !== undefined ? { extraBedRate: new Decimal(dto.extraBedRate) } : {}),
        ...(dto.amenities !== undefined ? { amenities: dto.amenities } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  // ─── Rooms ─────────────────────────────────────────────────────────────────

  async createRoom(dto: CreateRoomDto) {
    const { tenantId } = this.ctx();

    const existing = await this.prisma.room.findUnique({
      where: { tenantId_locationId_number: { tenantId, locationId: dto.locationId, number: dto.number } },
    });
    if (existing) throw new BadRequestException(`Room number '${dto.number}' already exists`);

    const roomType = await this.prisma.roomType.findFirst({
      where: { id: dto.roomTypeId, tenantId, locationId: dto.locationId },
    });
    if (!roomType) throw new NotFoundException('Room type not found');

    return this.prisma.room.create({
      data: {
        tenantId,
        locationId: dto.locationId,
        roomTypeId: dto.roomTypeId,
        number: dto.number,
        floor: dto.floor,
      },
    });
  }

  async listRooms(dto: RoomQueryDto) {
    const { tenantId } = this.ctx();
    return this.prisma.room.findMany({
      where: {
        tenantId,
        locationId: dto.locationId,
        ...(dto.status ? { status: dto.status as any } : {}),
        ...(dto.roomTypeId ? { roomTypeId: dto.roomTypeId } : {}),
        isActive: true,
      },
      include: { roomType: true },
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
    });
  }

  async updateRoom(id: string, dto: UpdateRoomDto) {
    const { tenantId } = this.ctx();
    const room = await this.prisma.room.findFirst({ where: { id, tenantId } });
    if (!room) throw new NotFoundException('Room not found');
    return this.prisma.room.update({
      where: { id },
      data: {
        ...(dto.floor !== undefined ? { floor: dto.floor } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async updateRoomStatus(id: string, dto: UpdateRoomStatusDto) {
    const { tenantId } = this.ctx();
    const room = await this.prisma.room.findFirst({ where: { id, tenantId } });
    if (!room) throw new NotFoundException('Room not found');
    return this.prisma.room.update({ where: { id }, data: { status: dto.status as any } });
  }

  // ─── Rate Plans ────────────────────────────────────────────────────────────

  async createRatePlan(dto: CreateRatePlanDto) {
    const { tenantId } = this.ctx();

    const existing = await this.prisma.ratePlan.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) throw new BadRequestException(`Rate plan code '${dto.code}' already exists`);

    const roomType = await this.prisma.roomType.findFirst({ where: { id: dto.roomTypeId, tenantId } });
    if (!roomType) throw new NotFoundException('Room type not found');

    return this.prisma.ratePlan.create({
      data: {
        tenantId,
        roomTypeId: dto.roomTypeId,
        name: dto.name,
        code: dto.code,
        rate: new Decimal(dto.rate),
        mealPlan: dto.mealPlan ?? 'EP',
        taxGroupId: dto.taxGroupId,
        cancellationPolicy: dto.cancellationPolicy,
      },
    });
  }

  async listRatePlans(roomTypeId?: string) {
    const { tenantId } = this.ctx();
    return this.prisma.ratePlan.findMany({
      where: {
        tenantId,
        ...(roomTypeId ? { roomTypeId } : {}),
        isActive: true,
      },
      include: { overrides: true },
      orderBy: { code: 'asc' },
    });
  }

  async updateRatePlan(id: string, dto: UpdateRatePlanDto) {
    const { tenantId } = this.ctx();
    const plan = await this.prisma.ratePlan.findFirst({ where: { id, tenantId } });
    if (!plan) throw new NotFoundException('Rate plan not found');

    return this.prisma.ratePlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.rate !== undefined ? { rate: new Decimal(dto.rate) } : {}),
        ...(dto.mealPlan !== undefined ? { mealPlan: dto.mealPlan } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async upsertRateOverride(dto: CreateRateOverrideDto) {
    const { tenantId } = this.ctx();
    const plan = await this.prisma.ratePlan.findFirst({ where: { id: dto.ratePlanId, tenantId } });
    if (!plan) throw new NotFoundException('Rate plan not found');

    const date = new Date(dto.date);
    return this.prisma.rateOverride.upsert({
      where: { ratePlanId_date: { ratePlanId: dto.ratePlanId, date } },
      create: {
        tenantId,
        ratePlanId: dto.ratePlanId,
        date,
        rate: new Decimal(dto.rate),
        minStay: dto.minStay,
        closed: dto.closed ?? false,
      },
      update: {
        rate: new Decimal(dto.rate),
        minStay: dto.minStay,
        closed: dto.closed ?? false,
      },
    });
  }

  // ─── Guest Profiles ────────────────────────────────────────────────────────

  async createGuest(dto: CreateGuestProfileDto) {
    const { tenantId } = this.ctx();
    const guest = await this.prisma.guestProfile.create({
      data: {
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        nationality: dto.nationality,
        idType: dto.idType,
        idNumber: dto.idNumber,
        company: dto.company,
        vip: dto.vip ?? false,
        notes: dto.notes,
      },
    });
    await this.audit.log({
      action: 'hotel.guest:create',
      entityType: 'guest_profile',
      entityId: guest.id,
      after: { firstName: guest.firstName, lastName: guest.lastName, phone: guest.phone },
    });
    return guest;
  }

  async listGuests(dto: GuestQueryDto) {
    const { tenantId } = this.ctx();
    const limit = dto.limit ?? 30;
    return this.prisma.guestProfile.findMany({
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
        ...(dto.cursor ? { id: { lt: dto.cursor } } : {}),
      },
      orderBy: { id: 'desc' },
      take: limit,
    });
  }

  async getGuest(id: string) {
    const { tenantId } = this.ctx();
    const guest = await this.prisma.guestProfile.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!guest) throw new NotFoundException('Guest profile not found');
    return guest;
  }

  async updateGuest(id: string, dto: UpdateGuestProfileDto) {
    const { tenantId } = this.ctx();
    const guest = await this.prisma.guestProfile.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!guest) throw new NotFoundException('Guest profile not found');

    return this.prisma.guestProfile.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.nationality !== undefined ? { nationality: dto.nationality } : {}),
        ...(dto.idType !== undefined ? { idType: dto.idType } : {}),
        ...(dto.idNumber !== undefined ? { idNumber: dto.idNumber } : {}),
        ...(dto.company !== undefined ? { company: dto.company } : {}),
        ...(dto.vip !== undefined ? { vip: dto.vip } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }

  // ─── Reservations ──────────────────────────────────────────────────────────

  async createReservation(dto: CreateReservationDto) {
    const { tenantId, userId } = this.ctx();

    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.checkOutDate);
    if (checkOut <= checkIn) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    const guest = await this.prisma.guestProfile.findFirst({
      where: { id: dto.guestId, tenantId, deletedAt: null },
    });
    if (!guest) throw new NotFoundException('Guest profile not found');

    for (const r of dto.rooms) {
      const rt = await this.prisma.roomType.findFirst({ where: { id: r.roomTypeId, tenantId } });
      if (!rt) throw new NotFoundException(`Room type ${r.roomTypeId} not found`);
      const plan = await this.prisma.ratePlan.findFirst({ where: { id: r.ratePlanId, tenantId } });
      if (!plan) throw new NotFoundException(`Rate plan ${r.ratePlanId} not found`);
    }

    const number = await this.sequence.next(tenantId, tenantId, 'RESERVATION', 'RES', 6);

    const reservation = await this.prisma.reservation.create({
      data: {
        tenantId,
        locationId: dto.locationId,
        number,
        guestId: dto.guestId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: dto.adults ?? 1,
        children: dto.children ?? 0,
        depositAmount: dto.depositAmount ? new Decimal(dto.depositAmount) : new Decimal(0),
        source: dto.source as any ?? 'DIRECT',
        note: dto.note,
        createdBy: userId,
        rooms: {
          create: dto.rooms.map((r) => ({
            tenantId,
            roomTypeId: r.roomTypeId,
            ratePlanId: r.ratePlanId,
            nightlyRate: new Decimal(r.nightlyRate),
          })),
        },
      },
      include: { rooms: true },
    });

    await this.audit.log({
      action: 'hotel.reservation:create',
      entityType: 'reservation',
      entityId: reservation.id,
      after: { number, guestId: dto.guestId, checkInDate: dto.checkInDate, checkOutDate: dto.checkOutDate },
    });
    return reservation;
  }

  async listReservations(dto: ReservationQueryDto) {
    const { tenantId } = this.ctx();
    const limit = dto.limit ?? 30;
    return this.prisma.reservation.findMany({
      where: {
        tenantId,
        ...(dto.locationId ? { locationId: dto.locationId } : {}),
        ...(dto.status ? { status: dto.status as any } : {}),
        ...(dto.checkInDate ? { checkInDate: new Date(dto.checkInDate) } : {}),
        ...(dto.cursor ? { id: { lt: dto.cursor } } : {}),
      },
      include: { rooms: true },
      orderBy: { id: 'desc' },
      take: limit,
    });
  }

  async getReservation(id: string) {
    const { tenantId } = this.ctx();
    const res = await this.prisma.reservation.findFirst({
      where: { id, tenantId },
      include: { rooms: { include: { reservation: false } }, stays: true },
    });
    if (!res) throw new NotFoundException('Reservation not found');
    return res;
  }

  async updateReservation(id: string, dto: UpdateReservationDto) {
    const { tenantId } = this.ctx();
    const res = await this.prisma.reservation.findFirst({ where: { id, tenantId } });
    if (!res) throw new NotFoundException('Reservation not found');
    if (res.status === 'CHECKED_IN' || res.status === 'CHECKED_OUT') {
      throw new BadRequestException('Cannot update a checked-in or checked-out reservation');
    }

    return this.prisma.reservation.update({
      where: { id },
      data: {
        ...(dto.adults !== undefined ? { adults: dto.adults } : {}),
        ...(dto.children !== undefined ? { children: dto.children } : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
        ...(dto.source !== undefined ? { source: dto.source as any } : {}),
        ...(dto.depositAmount !== undefined ? { depositAmount: new Decimal(dto.depositAmount) } : {}),
      },
    });
  }

  async confirmReservation(id: string) {
    const { tenantId } = this.ctx();
    const res = await this.prisma.reservation.findFirst({ where: { id, tenantId } });
    if (!res) throw new NotFoundException('Reservation not found');
    if (res.status !== 'TENTATIVE') throw new BadRequestException('Only tentative reservations can be confirmed');
    return this.prisma.reservation.update({ where: { id }, data: { status: 'CONFIRMED' } });
  }

  async cancelReservation(id: string) {
    const { tenantId } = this.ctx();
    const res = await this.prisma.reservation.findFirst({ where: { id, tenantId } });
    if (!res) throw new NotFoundException('Reservation not found');
    if (res.status === 'CHECKED_IN') throw new BadRequestException('Cannot cancel a checked-in reservation');
    if (res.status === 'CHECKED_OUT') throw new BadRequestException('Cannot cancel a checked-out reservation');
    if (res.status === 'CANCELLED') throw new BadRequestException('Reservation already cancelled');
    return this.prisma.reservation.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async markNoShow(id: string) {
    const { tenantId } = this.ctx();
    const res = await this.prisma.reservation.findFirst({ where: { id, tenantId } });
    if (!res) throw new NotFoundException('Reservation not found');
    if (res.status !== 'CONFIRMED') throw new BadRequestException('Only confirmed reservations can be marked no-show');
    return this.prisma.reservation.update({ where: { id }, data: { status: 'NO_SHOW' } });
  }

  // ─── Check-in ──────────────────────────────────────────────────────────────

  async checkIn(dto: CheckInDto) {
    const { tenantId, userId } = this.ctx();

    const reservation = await this.prisma.reservation.findFirst({
      where: { id: dto.reservationId, tenantId },
      include: { rooms: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status !== 'CONFIRMED' && reservation.status !== 'TENTATIVE') {
      throw new BadRequestException(`Cannot check in a reservation with status ${reservation.status}`);
    }

    if (dto.roomAssignments.length !== reservation.rooms.length) {
      throw new BadRequestException(
        `Expected ${reservation.rooms.length} room assignment(s), got ${dto.roomAssignments.length}`,
      );
    }

    const reservationRoomIds = new Set(reservation.rooms.map((r) => r.id));
    for (const a of dto.roomAssignments) {
      if (!reservationRoomIds.has(a.reservationRoomId)) {
        throw new BadRequestException(`Reservation room ${a.reservationRoomId} not found`);
      }
    }

    const assignedRoomIds = dto.roomAssignments.map((a) => a.roomId);
    const rooms = await this.prisma.room.findMany({
      where: { id: { in: assignedRoomIds }, tenantId, locationId: reservation.locationId },
    });
    if (rooms.length !== assignedRoomIds.length) {
      throw new BadRequestException('One or more rooms not found or belong to a different location');
    }
    for (const r of rooms) {
      if (r.status === 'OCCUPIED' || r.status === 'OUT_OF_ORDER' || r.status === 'OUT_OF_SERVICE') {
        throw new BadRequestException(`Room ${r.number} is not available (status: ${r.status})`);
      }
    }

    const stays = await this.prisma.$transaction(async (tx) => {
      const createdStays = [];
      for (const assignment of dto.roomAssignments) {
        const resRoom = reservation.rooms.find((r) => r.id === assignment.reservationRoomId)!;

        await tx.reservationRoom.update({
          where: { id: assignment.reservationRoomId },
          data: { roomId: assignment.roomId },
        });

        await tx.room.update({
          where: { id: assignment.roomId },
          data: { status: 'OCCUPIED' },
        });

        const stay = await tx.stay.create({
          data: {
            tenantId,
            locationId: reservation.locationId,
            reservationId: reservation.id,
            guestId: reservation.guestId,
            roomId: assignment.roomId,
          },
        });

        const folioNumber = await this.sequence.next(tenantId, dto.companyId, 'FOLIO', 'FOL', 6);
        await tx.hotelFolio.create({
          data: {
            tenantId,
            companyId: dto.companyId,
            number: folioNumber,
            stayId: stay.id,
          },
        });

        void resRoom;
        createdStays.push(stay);
      }

      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: 'CHECKED_IN' },
      });

      return createdStays;
    });

    await this.audit.log({
      action: 'hotel.checkin:create',
      entityType: 'reservation',
      entityId: reservation.id,
      after: { checkedInAt: new Date(), stayCount: stays.length, checkedInBy: userId },
    });
    return { reservation: { ...reservation, status: 'CHECKED_IN' }, stays };
  }

  // ─── Check-out ─────────────────────────────────────────────────────────────

  async checkOut(stayId: string, _dto: CheckOutDto) {
    const { tenantId, userId } = this.ctx();

    const stay = await this.prisma.stay.findFirst({
      where: { id: stayId, tenantId },
      include: { folio: true },
    });
    if (!stay) throw new NotFoundException('Stay not found');
    if (stay.status !== 'IN_HOUSE') throw new BadRequestException('Stay is not IN_HOUSE');

    const folio = stay.folio;
    if (!folio) throw new BadRequestException('No folio found for this stay');
    if (folio.status !== 'OPEN') throw new BadRequestException('Folio is already settled');

    const balance = new Decimal(folio.totalCharges).minus(new Decimal(folio.totalPayments));
    if (balance.greaterThan(0)) {
      throw new BadRequestException(
        `Outstanding balance of ${balance.toFixed(2)} must be settled before check-out`,
      );
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.stay.update({
        where: { id: stayId },
        data: { status: 'CHECKED_OUT', checkedOutAt: now },
      });

      await tx.hotelFolio.update({
        where: { id: folio.id },
        data: { status: 'SETTLED', settledAt: now },
      });

      await tx.room.update({
        where: { id: stay.roomId },
        data: { status: 'VACANT_DIRTY' },
      });
    });

    // Check if all stays for the reservation are checked out
    const allStays = await this.prisma.stay.findMany({
      where: { reservationId: stay.reservationId, tenantId },
    });
    const allOut = allStays.every((s) => s.id === stayId || s.status === 'CHECKED_OUT');
    if (allOut) {
      await this.prisma.reservation.update({
        where: { id: stay.reservationId },
        data: { status: 'CHECKED_OUT' },
      });
    }

    await this.audit.log({
      action: 'hotel.checkout:create',
      entityType: 'stay',
      entityId: stayId,
      after: { checkedOutAt: now, checkedOutBy: userId },
    });
    return { stayId, checkedOutAt: now };
  }

  // ─── Folio ─────────────────────────────────────────────────────────────────

  async getFolio(stayId: string) {
    const { tenantId } = this.ctx();
    const folio = await this.prisma.hotelFolio.findFirst({
      where: { stayId, tenantId },
      include: { charges: { orderBy: { createdAt: 'asc' } }, payments: { orderBy: { createdAt: 'asc' } } },
    });
    if (!folio) throw new NotFoundException('Folio not found');
    return folio;
  }

  async postFolioCharge(stayId: string, dto: PostFolioChargeDto) {
    const { tenantId, userId } = this.ctx();
    const folio = await this.prisma.hotelFolio.findFirst({ where: { stayId, tenantId } });
    if (!folio) throw new NotFoundException('Folio not found');
    if (folio.status !== 'OPEN') throw new BadRequestException('Folio is not open');

    const amount = new Decimal(dto.amount);
    const taxAmount = dto.taxAmount ? new Decimal(dto.taxAmount) : new Decimal(0);
    const total = amount.plus(taxAmount);

    await this.prisma.$transaction(async (tx) => {
      await tx.folioCharge.create({
        data: {
          tenantId,
          folioId: folio.id,
          type: dto.type as any,
          description: dto.description,
          amount,
          taxAmount,
          sourceType: dto.sourceType,
          sourceId: dto.sourceId,
          businessDate: new Date(dto.businessDate),
          postedBy: userId,
        },
      });

      await tx.hotelFolio.update({
        where: { id: folio.id },
        data: { totalCharges: { increment: total } },
      });
    });

    return this.getFolio(stayId);
  }

  async addFolioPayments(stayId: string, dto: SettleFolioDto) {
    const { tenantId, userId } = this.ctx();
    const folio = await this.prisma.hotelFolio.findFirst({ where: { stayId, tenantId } });
    if (!folio) throw new NotFoundException('Folio not found');
    if (folio.status !== 'OPEN') throw new BadRequestException('Folio is not open');

    const totalPayment = dto.payments.reduce((sum, p) => sum.plus(new Decimal(p.amount)), new Decimal(0));

    await this.prisma.$transaction(async (tx) => {
      for (const p of dto.payments) {
        await tx.folioPayment.create({
          data: {
            tenantId,
            folioId: folio.id,
            method: p.method as any,
            amount: new Decimal(p.amount),
            reference: p.reference,
            createdBy: userId,
          },
        });
      }

      await tx.hotelFolio.update({
        where: { id: folio.id },
        data: { totalPayments: { increment: totalPayment } },
      });
    });

    return this.getFolio(stayId);
  }

  // ─── Night Audit ───────────────────────────────────────────────────────────

  async runNightAudit(dto: NightAuditDto) {
    const { tenantId, userId } = this.ctx();
    const businessDate = new Date(dto.businessDate);

    const stays = await this.prisma.stay.findMany({
      where: { tenantId, locationId: dto.locationId, status: 'IN_HOUSE' },
      include: {
        folio: true,
        reservation: { include: { rooms: true } },
      },
    });

    let posted = 0;
    let skipped = 0;

    for (const stay of stays) {
      const folio = stay.folio;
      if (!folio || folio.status !== 'OPEN') {
        skipped++;
        continue;
      }

      // Skip if ROOM_NIGHT already posted for this date
      const existingCharge = await this.prisma.folioCharge.findFirst({
        where: {
          folioId: folio.id,
          type: 'ROOM_NIGHT',
          businessDate,
        },
      });
      if (existingCharge) {
        skipped++;
        continue;
      }

      // Find nightly rate from the matching ReservationRoom
      const resRoom = stay.reservation.rooms.find((r) => r.roomId === stay.roomId);
      const nightlyRate = resRoom ? new Decimal(resRoom.nightlyRate) : new Decimal(0);

      await this.prisma.$transaction(async (tx) => {
        await tx.folioCharge.create({
          data: {
            tenantId,
            folioId: folio.id,
            type: 'ROOM_NIGHT',
            description: `Room charge — ${businessDate.toISOString().slice(0, 10)}`,
            amount: nightlyRate,
            taxAmount: new Decimal(0),
            businessDate,
            sourceType: 'night_audit',
            postedBy: userId,
          },
        });

        await tx.hotelFolio.update({
          where: { id: folio.id },
          data: { totalCharges: { increment: nightlyRate } },
        });
      });

      posted++;
    }

    await this.audit.log({
      action: 'hotel.nightaudit:run',
      entityType: 'night_audit',
      after: { locationId: dto.locationId, businessDate: dto.businessDate, posted, skipped, runBy: userId },
    });

    return { businessDate: dto.businessDate, posted, skipped, total: stays.length };
  }

  // ─── Housekeeping ──────────────────────────────────────────────────────────

  async createHousekeepingTask(dto: CreateHousekeepingTaskDto) {
    const { tenantId, userId } = this.ctx();

    const room = await this.prisma.room.findFirst({
      where: { id: dto.roomId, tenantId, locationId: dto.locationId },
    });
    if (!room) throw new NotFoundException('Room not found');

    return this.prisma.housekeepingTask.create({
      data: {
        tenantId,
        locationId: dto.locationId,
        roomId: dto.roomId,
        type: dto.type as any,
        assignedTo: dto.assignedTo,
        priority: dto.priority ?? 0,
        note: dto.note,
      },
    });
  }

  async listHousekeepingTasks(dto: HousekeepingQueryDto) {
    const { tenantId } = this.ctx();
    return this.prisma.housekeepingTask.findMany({
      where: {
        tenantId,
        ...(dto.locationId ? { locationId: dto.locationId } : {}),
        ...(dto.status ? { status: dto.status as any } : {}),
        ...(dto.assignedTo ? { assignedTo: dto.assignedTo } : {}),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async updateHousekeepingTask(id: string, dto: UpdateHousekeepingTaskDto) {
    const { tenantId } = this.ctx();
    const task = await this.prisma.housekeepingTask.findFirst({ where: { id, tenantId } });
    if (!task) throw new NotFoundException('Housekeeping task not found');

    return this.prisma.housekeepingTask.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status as any } : {}),
        ...(dto.assignedTo !== undefined ? { assignedTo: dto.assignedTo } : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
        ...(dto.startedAt !== undefined ? { startedAt: new Date(dto.startedAt) } : {}),
        ...(dto.completedAt !== undefined ? { completedAt: new Date(dto.completedAt) } : {}),
      },
    });
  }

  async listStays(locationId: string) {
    const { tenantId } = this.ctx();
    return this.prisma.stay.findMany({
      where: { tenantId, locationId, status: 'IN_HOUSE' },
      include: { folio: true },
      orderBy: { checkedInAt: 'desc' },
    });
  }
}
