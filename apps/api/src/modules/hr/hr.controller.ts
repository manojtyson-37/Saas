import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { HrService } from './hr.service';
import {
  AttendanceQueryDto,
  BulkRosterDto,
  ClockInDto,
  ClockOutDto,
  CreateEmployeeDto,
  CreateLeaveRequestDto,
  CreateLeaveTypeDto,
  CreatePayrollRunDto,
  CreateShiftDto,
  EmployeeQueryDto,
  PayrollQueryDto,
  ReviewLeaveDto,
  UpdateEmployeeDto,
} from './dto/hr.dto';

@ApiTags('hr')
@ApiBearerAuth()
@Controller('hr')
export class HrController {
  constructor(private readonly service: HrService) {}

  // ─── Employees ─────────────────────────────────────────────────────────────

  @Post('employees')
  @RequirePermission('hr.employee:create')
  @ApiOperation({ summary: 'Create employee' })
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.service.createEmployee(dto);
  }

  @Get('employees')
  @RequirePermission('hr.employee:read')
  @ApiOperation({ summary: 'List employees' })
  listEmployees(@Query() dto: EmployeeQueryDto) {
    return this.service.listEmployees(dto);
  }

  @Get('employees/:id')
  @RequirePermission('hr.employee:read')
  @ApiOperation({ summary: 'Get employee detail' })
  getEmployee(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getEmployee(id);
  }

  @Patch('employees/:id')
  @RequirePermission('hr.employee:update')
  @ApiOperation({ summary: 'Update employee' })
  updateEmployee(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.updateEmployee(id, dto);
  }

  // ─── Shifts ────────────────────────────────────────────────────────────────

  @Post('shifts')
  @RequirePermission('hr.shift:manage')
  @ApiOperation({ summary: 'Create shift' })
  createShift(@Body() dto: CreateShiftDto) {
    return this.service.createShift(dto);
  }

  @Get('shifts')
  @RequirePermission('hr.shift:read')
  @ApiOperation({ summary: 'List shifts' })
  listShifts(@Query('locationId') locationId?: string) {
    return this.service.listShifts(locationId);
  }

  // ─── Roster ────────────────────────────────────────────────────────────────

  @Post('roster')
  @RequirePermission('hr.shift:manage')
  @ApiOperation({ summary: 'Bulk upsert roster entries' })
  upsertRoster(@Body() dto: BulkRosterDto) {
    return this.service.upsertRoster(dto);
  }

  @Get('roster')
  @RequirePermission('hr.shift:read')
  @ApiOperation({ summary: 'Get roster for a location and date' })
  getRoster(@Query('locationId') locationId: string, @Query('date') date: string) {
    return this.service.getRoster(locationId, date);
  }

  // ─── Attendance ────────────────────────────────────────────────────────────

  @Post('attendance/clock-in')
  @RequirePermission('hr.attendance:punch')
  @ApiOperation({ summary: 'Clock in an employee' })
  clockIn(@Body() dto: ClockInDto) {
    return this.service.clockIn(dto);
  }

  @Post('attendance/:employeeId/:date/clock-out')
  @RequirePermission('hr.attendance:punch')
  @HttpCode(200)
  @ApiOperation({ summary: 'Clock out an employee' })
  clockOut(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Param('date') date: string,
    @Body() dto: ClockOutDto,
  ) {
    return this.service.clockOut(employeeId, date, dto);
  }

  @Get('attendance')
  @RequirePermission('hr.attendance:read')
  @ApiOperation({ summary: 'List attendance records' })
  listAttendance(@Query() dto: AttendanceQueryDto) {
    return this.service.listAttendance(dto);
  }

  // ─── Leave Types ───────────────────────────────────────────────────────────

  @Post('leave-types')
  @RequirePermission('hr.leave:approve')
  @ApiOperation({ summary: 'Create leave type' })
  createLeaveType(@Body() dto: CreateLeaveTypeDto) {
    return this.service.createLeaveType(dto);
  }

  @Get('leave-types')
  @RequirePermission('hr.leave:read')
  @ApiOperation({ summary: 'List leave types' })
  listLeaveTypes() {
    return this.service.listLeaveTypes();
  }

  // ─── Leave Requests ────────────────────────────────────────────────────────

  @Post('leave')
  @RequirePermission('hr.leave:request')
  @ApiOperation({ summary: 'Submit a leave request' })
  createLeaveRequest(@Body() dto: CreateLeaveRequestDto) {
    return this.service.createLeaveRequest(dto);
  }

  @Get('leave')
  @RequirePermission('hr.leave:read')
  @ApiOperation({ summary: 'List leave requests' })
  listLeaveRequests(@Query('employeeId') employeeId?: string) {
    return this.service.listLeaveRequests(employeeId);
  }

  @Post('leave/:id/review')
  @RequirePermission('hr.leave:approve')
  @HttpCode(200)
  @ApiOperation({ summary: 'Approve or reject a leave request' })
  reviewLeave(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: ReviewLeaveDto) {
    return this.service.reviewLeave(id, dto);
  }

  // ─── Payroll ───────────────────────────────────────────────────────────────

  @Post('payroll')
  @RequirePermission('hr.payroll:run')
  @ApiOperation({ summary: 'Create a payroll run for a period' })
  createPayrollRun(@Body() dto: CreatePayrollRunDto) {
    return this.service.createPayrollRun(dto);
  }

  @Post('payroll/:id/process')
  @RequirePermission('hr.payroll:run')
  @HttpCode(200)
  @ApiOperation({ summary: 'Process payroll — compute gross, deductions, net for all active employees' })
  processPayrollRun(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.processPayrollRun(id);
  }

  @Get('payroll')
  @RequirePermission('hr.payroll:read')
  @ApiOperation({ summary: 'List payroll runs' })
  listPayrollRuns(@Query() dto: PayrollQueryDto) {
    return this.service.listPayrollRuns(dto);
  }

  @Get('payroll/:id')
  @RequirePermission('hr.payroll:read')
  @ApiOperation({ summary: 'Get payroll run with payslips' })
  getPayrollRun(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getPayrollRun(id);
  }
}
