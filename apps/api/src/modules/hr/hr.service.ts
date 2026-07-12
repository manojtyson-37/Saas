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

@Injectable()
export class HrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private ctx(): { tenantId: string; userId: string | undefined } {
    const c = TenantContext.get();
    if (!c?.tenantId) throw new BadRequestException('No tenant context');
    return { tenantId: c.tenantId, userId: c.userId };
  }

  // ─── Employees ──────────────────────────────────────────────────────────────

  async createEmployee(dto: CreateEmployeeDto) {
    const { tenantId, userId } = this.ctx();

    const existing = await this.prisma.employee.findUnique({
      where: { tenantId_employeeCode: { tenantId, employeeCode: dto.employeeCode } },
    });
    if (existing) throw new ConflictException(`Employee code '${dto.employeeCode}' already exists`);

    const employee = await this.prisma.employee.create({
      data: {
        tenantId,
        companyId: dto.companyId,
        locationId: dto.locationId,
        userId: dto.userId,
        employeeCode: dto.employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        designation: dto.designation,
        department: dto.department,
        employmentType: dto.employmentType as any ?? 'FULL_TIME',
        joinedAt: new Date(dto.joinedAt),
        monthlySalary: dto.monthlySalary !== undefined ? new Decimal(dto.monthlySalary) : undefined,
        hourlyRate: dto.hourlyRate !== undefined ? new Decimal(dto.hourlyRate) : undefined,
        bankAccountNumber: dto.bankAccountNumber,
        bankIfsc: dto.bankIfsc,
        pfNumber: dto.pfNumber,
        esiNumber: dto.esiNumber,
      },
    });

    await this.audit.log({
      action: 'hr.employee:create',
      entityType: 'employee',
      entityId: employee.id,
      after: { employeeCode: dto.employeeCode, firstName: dto.firstName, createdBy: userId },
    });
    return employee;
  }

  async listEmployees(dto: EmployeeQueryDto) {
    const { tenantId } = this.ctx();
    const limit = dto.limit ?? 50;
    return this.prisma.employee.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(dto.companyId ? { companyId: dto.companyId } : {}),
        ...(dto.locationId ? { locationId: dto.locationId } : {}),
        ...(dto.department ? { department: dto.department } : {}),
        ...(dto.status ? { status: dto.status as any } : {}),
        ...(dto.cursor ? { id: { lt: dto.cursor } } : {}),
      },
      orderBy: { id: 'desc' },
      take: limit,
    });
  }

  async getEmployee(id: string) {
    const { tenantId } = this.ctx();
    const emp = await this.prisma.employee.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { documents: true },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    const { tenantId } = this.ctx();
    const emp = await this.prisma.employee.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!emp) throw new NotFoundException('Employee not found');

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...(dto.designation !== undefined ? { designation: dto.designation } : {}),
        ...(dto.department !== undefined ? { department: dto.department } : {}),
        ...(dto.employmentType !== undefined ? { employmentType: dto.employmentType as any } : {}),
        ...(dto.monthlySalary !== undefined ? { monthlySalary: new Decimal(dto.monthlySalary) } : {}),
        ...(dto.hourlyRate !== undefined ? { hourlyRate: new Decimal(dto.hourlyRate) } : {}),
        ...(dto.bankAccountNumber !== undefined ? { bankAccountNumber: dto.bankAccountNumber } : {}),
        ...(dto.bankIfsc !== undefined ? { bankIfsc: dto.bankIfsc } : {}),
        ...(dto.status !== undefined ? { status: dto.status as any } : {}),
        ...(dto.exitedAt !== undefined ? { exitedAt: new Date(dto.exitedAt) } : {}),
      },
    });
  }

  // ─── Shifts ─────────────────────────────────────────────────────────────────

  async createShift(dto: CreateShiftDto) {
    const { tenantId } = this.ctx();
    return this.prisma.shift.create({
      data: {
        tenantId,
        locationId: dto.locationId,
        name: dto.name,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    });
  }

  async listShifts(locationId?: string) {
    const { tenantId } = this.ctx();
    return this.prisma.shift.findMany({
      where: { tenantId, ...(locationId ? { locationId } : {}), isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  // ─── Roster ─────────────────────────────────────────────────────────────────

  async upsertRoster(dto: BulkRosterDto) {
    const { tenantId } = this.ctx();
    const results = [];
    for (const e of dto.entries) {
      const date = new Date(e.date);
      const entry = await this.prisma.rosterEntry.upsert({
        where: { employeeId_date_shiftId: { employeeId: e.employeeId, date, shiftId: e.shiftId } },
        create: { tenantId, employeeId: e.employeeId, shiftId: e.shiftId, date },
        update: {},
      });
      results.push(entry);
    }
    return results;
  }

  async getRoster(locationId: string, date: string) {
    const { tenantId } = this.ctx();
    return this.prisma.rosterEntry.findMany({
      where: { tenantId, date: new Date(date), shift: { locationId } },
      include: { shift: true },
      orderBy: { shift: { startTime: 'asc' } },
    });
  }

  // ─── Attendance ─────────────────────────────────────────────────────────────

  async clockIn(dto: ClockInDto) {
    const { tenantId } = this.ctx();
    const date = new Date(dto.date);
    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId: dto.employeeId, date } },
    });
    if (existing?.clockIn) throw new ConflictException('Already clocked in for this date');

    const now = dto.clockIn ? new Date(dto.clockIn) : new Date();
    if (existing) {
      return this.prisma.attendanceRecord.update({
        where: { employeeId_date: { employeeId: dto.employeeId, date } },
        data: { clockIn: now, source: dto.source as any ?? 'MANUAL' },
      });
    }
    return this.prisma.attendanceRecord.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        date,
        clockIn: now,
        source: dto.source as any ?? 'MANUAL',
      },
    });
  }

  async clockOut(employeeId: string, date: string, dto: ClockOutDto) {
    const { tenantId: _tid } = this.ctx();
    const d = new Date(date);
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date: d } },
    });
    if (!record) throw new NotFoundException('No clock-in record for this date');
    if (record.clockOut) throw new ConflictException('Already clocked out');

    const now = dto.clockOut ? new Date(dto.clockOut) : new Date();
    const workedMinutes = record.clockIn
      ? Math.max(0, Math.floor((now.getTime() - record.clockIn.getTime()) / 60000))
      : 0;
    const overtimeMinutes = Math.max(0, workedMinutes - 480); // 8 hrs = 480 min standard

    return this.prisma.attendanceRecord.update({
      where: { employeeId_date: { employeeId, date: d } },
      data: { clockOut: now, workedMinutes, overtimeMinutes, note: dto.note },
    });
  }

  async listAttendance(dto: AttendanceQueryDto) {
    const { tenantId } = this.ctx();
    return this.prisma.attendanceRecord.findMany({
      where: {
        tenantId,
        ...(dto.employeeId ? { employeeId: dto.employeeId } : {}),
        ...(dto.fromDate || dto.toDate
          ? {
              date: {
                ...(dto.fromDate ? { gte: new Date(dto.fromDate) } : {}),
                ...(dto.toDate ? { lte: new Date(dto.toDate) } : {}),
              },
            }
          : {}),
      },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
      orderBy: [{ date: 'desc' }, { employeeId: 'asc' }],
    });
  }

  // ─── Leave Types ────────────────────────────────────────────────────────────

  async createLeaveType(dto: CreateLeaveTypeDto) {
    const { tenantId } = this.ctx();
    const existing = await this.prisma.leaveType.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) throw new ConflictException(`Leave type code '${dto.code}' already exists`);

    return this.prisma.leaveType.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        annualQuota: new Decimal(dto.annualQuota),
        isPaid: dto.isPaid ?? true,
      },
    });
  }

  async listLeaveTypes() {
    const { tenantId } = this.ctx();
    return this.prisma.leaveType.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  // ─── Leave Requests ─────────────────────────────────────────────────────────

  async createLeaveRequest(dto: CreateLeaveRequestDto) {
    const { tenantId, userId } = this.ctx();
    const emp = await this.prisma.employee.findFirst({ where: { id: dto.employeeId, tenantId } });
    if (!emp) throw new NotFoundException('Employee not found');
    const lt = await this.prisma.leaveType.findFirst({ where: { id: dto.leaveTypeId, tenantId } });
    if (!lt) throw new NotFoundException('Leave type not found');

    return this.prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        days: new Decimal(dto.days),
        reason: dto.reason,
      },
    });
  }

  async reviewLeave(id: string, dto: ReviewLeaveDto) {
    const { tenantId, userId } = this.ctx();
    const req = await this.prisma.leaveRequest.findFirst({ where: { id, tenantId } });
    if (!req) throw new NotFoundException('Leave request not found');
    if (req.status !== 'PENDING') throw new BadRequestException('Leave request is not PENDING');

    const status = dto.action === 'approve' ? 'APPROVED' : 'REJECTED';
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status, approvedBy: userId, approvedAt: new Date() },
    });
  }

  async listLeaveRequests(employeeId?: string) {
    const { tenantId } = this.ctx();
    return this.prisma.leaveRequest.findMany({
      where: {
        tenantId,
        ...(employeeId ? { employeeId } : {}),
      },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
        leaveType: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Payroll ─────────────────────────────────────────────────────────────────

  async createPayrollRun(dto: CreatePayrollRunDto) {
    const { tenantId, userId } = this.ctx();

    const existing = await this.prisma.payrollRun.findUnique({
      where: { tenantId_companyId_period: { tenantId, companyId: dto.companyId, period: dto.period } },
    });
    if (existing) throw new ConflictException(`Payroll run for period '${dto.period}' already exists`);

    return this.prisma.payrollRun.create({
      data: {
        tenantId,
        companyId: dto.companyId,
        period: dto.period,
        createdBy: userId,
      },
    });
  }

  async processPayrollRun(id: string) {
    const { tenantId } = this.ctx();
    const run = await this.prisma.payrollRun.findFirst({ where: { id, tenantId } });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (run.status !== 'DRAFT') throw new BadRequestException('Payroll run is not in DRAFT status');

    const employees = await this.prisma.employee.findMany({
      where: { tenantId, companyId: run.companyId, status: 'ACTIVE', deletedAt: null },
    });

    let totalGross = new Decimal(0);
    let totalDeductions = new Decimal(0);
    let totalNet = new Decimal(0);

    await this.prisma.$transaction(async (tx) => {
      for (const emp of employees) {
        if (!emp.monthlySalary) continue;

        const gross = new Decimal(emp.monthlySalary);

        // PF: 12% of basic (capped at ₹1800)
        const pf = Decimal.min(gross.times('0.12'), new Decimal(1800));

        // ESI: 0.75% if gross ≤ 21000
        const esi = gross.lessThanOrEqualTo(21000) ? gross.times('0.0075') : new Decimal(0);

        const totalDed = pf.plus(esi);
        const net = gross.minus(totalDed);

        const components = [
          { code: 'BASIC', name: 'Basic Salary', kind: 'earning', amount: gross.toFixed(2) },
          { code: 'PF', name: 'Provident Fund', kind: 'deduction', amount: pf.toFixed(2) },
          ...(esi.greaterThan(0)
            ? [{ code: 'ESI', name: 'ESI', kind: 'deduction', amount: esi.toFixed(2) }]
            : []),
        ];

        await tx.payslip.upsert({
          where: { payrollRunId_employeeId: { payrollRunId: id, employeeId: emp.id } },
          create: {
            tenantId,
            payrollRunId: id,
            employeeId: emp.id,
            gross,
            deductions: totalDed,
            net,
            components,
          },
          update: { gross, deductions: totalDed, net, components },
        });

        totalGross = totalGross.plus(gross);
        totalDeductions = totalDeductions.plus(totalDed);
        totalNet = totalNet.plus(net);
      }

      await tx.payrollRun.update({
        where: { id },
        data: {
          status: 'PROCESSED',
          totalGross,
          totalDeductions,
          totalNet,
          processedAt: new Date(),
        },
      });
    });

    return this.prisma.payrollRun.findUnique({ where: { id }, include: { payslips: true } });
  }

  async listPayrollRuns(dto: PayrollQueryDto) {
    const { tenantId } = this.ctx();
    const limit = dto.limit ?? 20;
    return this.prisma.payrollRun.findMany({
      where: {
        tenantId,
        ...(dto.companyId ? { companyId: dto.companyId } : {}),
        ...(dto.period ? { period: dto.period } : {}),
        ...(dto.cursor ? { id: { lt: dto.cursor } } : {}),
      },
      orderBy: { id: 'desc' },
      take: limit,
    });
  }

  async getPayrollRun(id: string) {
    const { tenantId } = this.ctx();
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, tenantId },
      include: {
        payslips: {
          include: {
            employee: { select: { firstName: true, lastName: true, employeeCode: true } },
          },
        },
      },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }
}
