import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { HotelService } from './hotel.service';
import {
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

@ApiTags('hotel')
@ApiBearerAuth()
@Controller('hotel')
export class HotelController {
  constructor(private readonly service: HotelService) {}

  // ─── Room Types ────────────────────────────────────────────────────────────

  @Post('room-types')
  @RequirePermission('hotel.room:manage')
  @ApiOperation({ summary: 'Create room type' })
  createRoomType(@Body() dto: CreateRoomTypeDto) {
    return this.service.createRoomType(dto);
  }

  @Get('room-types')
  @RequirePermission('hotel.room:read')
  @ApiOperation({ summary: 'List room types' })
  listRoomTypes(@Query('locationId') locationId?: string) {
    return this.service.listRoomTypes(locationId);
  }

  @Patch('room-types/:id')
  @RequirePermission('hotel.room:manage')
  @ApiOperation({ summary: 'Update room type' })
  updateRoomType(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoomTypeDto) {
    return this.service.updateRoomType(id, dto);
  }

  // ─── Rooms ─────────────────────────────────────────────────────────────────

  @Post('rooms')
  @RequirePermission('hotel.room:manage')
  @ApiOperation({ summary: 'Create room' })
  createRoom(@Body() dto: CreateRoomDto) {
    return this.service.createRoom(dto);
  }

  @Get('rooms')
  @RequirePermission('hotel.room:read')
  @ApiOperation({ summary: 'List rooms' })
  listRooms(@Query() dto: RoomQueryDto) {
    return this.service.listRooms(dto);
  }

  @Patch('rooms/:id')
  @RequirePermission('hotel.room:manage')
  @ApiOperation({ summary: 'Update room details' })
  updateRoom(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoomDto) {
    return this.service.updateRoom(id, dto);
  }

  @Patch('rooms/:id/status')
  @RequirePermission('hotel.room:manage')
  @ApiOperation({ summary: 'Update room status' })
  updateRoomStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoomStatusDto) {
    return this.service.updateRoomStatus(id, dto);
  }

  // ─── Rate Plans ────────────────────────────────────────────────────────────

  @Post('rate-plans')
  @RequirePermission('hotel.rate:manage')
  @ApiOperation({ summary: 'Create rate plan' })
  createRatePlan(@Body() dto: CreateRatePlanDto) {
    return this.service.createRatePlan(dto);
  }

  @Get('rate-plans')
  @RequirePermission('hotel.rate:read')
  @ApiOperation({ summary: 'List rate plans' })
  listRatePlans(@Query('roomTypeId') roomTypeId?: string) {
    return this.service.listRatePlans(roomTypeId);
  }

  @Patch('rate-plans/:id')
  @RequirePermission('hotel.rate:manage')
  @ApiOperation({ summary: 'Update rate plan' })
  updateRatePlan(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRatePlanDto) {
    return this.service.updateRatePlan(id, dto);
  }

  @Put('rate-plans/overrides')
  @RequirePermission('hotel.rate:manage')
  @ApiOperation({ summary: 'Upsert rate override for a date' })
  upsertRateOverride(@Body() dto: CreateRateOverrideDto) {
    return this.service.upsertRateOverride(dto);
  }

  // ─── Guest Profiles ────────────────────────────────────────────────────────

  @Post('guests')
  @RequirePermission('hotel.guest:manage')
  @ApiOperation({ summary: 'Create guest profile' })
  createGuest(@Body() dto: CreateGuestProfileDto) {
    return this.service.createGuest(dto);
  }

  @Get('guests')
  @RequirePermission('hotel.guest:read')
  @ApiOperation({ summary: 'List/search guest profiles' })
  listGuests(@Query() dto: GuestQueryDto) {
    return this.service.listGuests(dto);
  }

  @Get('guests/:id')
  @RequirePermission('hotel.guest:read')
  @ApiOperation({ summary: 'Get guest profile' })
  getGuest(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getGuest(id);
  }

  @Patch('guests/:id')
  @RequirePermission('hotel.guest:manage')
  @ApiOperation({ summary: 'Update guest profile' })
  updateGuest(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateGuestProfileDto) {
    return this.service.updateGuest(id, dto);
  }

  // ─── Reservations ──────────────────────────────────────────────────────────

  @Post('reservations')
  @RequirePermission('hotel.reservation:manage')
  @ApiOperation({ summary: 'Create reservation' })
  createReservation(@Body() dto: CreateReservationDto) {
    return this.service.createReservation(dto);
  }

  @Get('reservations')
  @RequirePermission('hotel.reservation:read')
  @ApiOperation({ summary: 'List reservations' })
  listReservations(@Query() dto: ReservationQueryDto) {
    return this.service.listReservations(dto);
  }

  @Get('reservations/:id')
  @RequirePermission('hotel.reservation:read')
  @ApiOperation({ summary: 'Get reservation detail' })
  getReservation(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getReservation(id);
  }

  @Patch('reservations/:id')
  @RequirePermission('hotel.reservation:manage')
  @ApiOperation({ summary: 'Update reservation' })
  updateReservation(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateReservationDto) {
    return this.service.updateReservation(id, dto);
  }

  @Post('reservations/:id/confirm')
  @RequirePermission('hotel.reservation:manage')
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirm tentative reservation' })
  confirmReservation(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.confirmReservation(id);
  }

  @Post('reservations/:id/cancel')
  @RequirePermission('hotel.reservation:manage')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel reservation' })
  cancelReservation(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.cancelReservation(id);
  }

  @Post('reservations/:id/no-show')
  @RequirePermission('hotel.reservation:manage')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark reservation as no-show' })
  markNoShow(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.markNoShow(id);
  }

  // ─── Check-in / Check-out ──────────────────────────────────────────────────

  @Post('check-in')
  @RequirePermission('hotel.stay:check-in')
  @ApiOperation({ summary: 'Check in a reservation — creates stay(s) and folio(s)' })
  checkIn(@Body() dto: CheckInDto) {
    return this.service.checkIn(dto);
  }

  @Post('stays/:stayId/check-out')
  @RequirePermission('hotel.stay:check-out')
  @HttpCode(200)
  @ApiOperation({ summary: 'Check out a stay' })
  checkOut(@Param('stayId', new ParseUUIDPipe()) stayId: string, @Body() dto: CheckOutDto) {
    return this.service.checkOut(stayId, dto);
  }

  @Get('stays')
  @RequirePermission('hotel.folio:read')
  @ApiOperation({ summary: 'List in-house stays for a location' })
  listStays(@Query('locationId') locationId: string) {
    return this.service.listStays(locationId);
  }

  // ─── Folio ─────────────────────────────────────────────────────────────────

  @Get('stays/:stayId/folio')
  @RequirePermission('hotel.folio:read')
  @ApiOperation({ summary: 'Get folio for a stay' })
  getFolio(@Param('stayId', new ParseUUIDPipe()) stayId: string) {
    return this.service.getFolio(stayId);
  }

  @Post('stays/:stayId/folio/charges')
  @RequirePermission('hotel.folio:charge')
  @ApiOperation({ summary: 'Post a charge to the folio' })
  postFolioCharge(@Param('stayId', new ParseUUIDPipe()) stayId: string, @Body() dto: PostFolioChargeDto) {
    return this.service.postFolioCharge(stayId, dto);
  }

  @Post('stays/:stayId/folio/payments')
  @RequirePermission('hotel.folio:settle')
  @ApiOperation({ summary: 'Add payment(s) to the folio' })
  addFolioPayments(@Param('stayId', new ParseUUIDPipe()) stayId: string, @Body() dto: SettleFolioDto) {
    return this.service.addFolioPayments(stayId, dto);
  }

  // ─── Night Audit ───────────────────────────────────────────────────────────

  @Post('night-audit')
  @RequirePermission('hotel.night-audit:run')
  @ApiOperation({ summary: 'Run night audit — posts ROOM_NIGHT charges for all in-house stays' })
  runNightAudit(@Body() dto: NightAuditDto) {
    return this.service.runNightAudit(dto);
  }

  // ─── Housekeeping ──────────────────────────────────────────────────────────

  @Post('housekeeping')
  @RequirePermission('hotel.housekeeping:operate')
  @ApiOperation({ summary: 'Create housekeeping task' })
  createTask(@Body() dto: CreateHousekeepingTaskDto) {
    return this.service.createHousekeepingTask(dto);
  }

  @Get('housekeeping')
  @RequirePermission('hotel.housekeeping:read')
  @ApiOperation({ summary: 'List housekeeping tasks' })
  listTasks(@Query() dto: HousekeepingQueryDto) {
    return this.service.listHousekeepingTasks(dto);
  }

  @Patch('housekeeping/:id')
  @RequirePermission('hotel.housekeeping:operate')
  @ApiOperation({ summary: 'Update housekeeping task' })
  updateTask(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateHousekeepingTaskDto) {
    return this.service.updateHousekeepingTask(id, dto);
  }
}
