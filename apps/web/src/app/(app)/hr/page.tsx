'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserCheck, Users, Clock, Calendar, CreditCard } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { Button, Card, Input, cx } from '@/components/ui/primitives';

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string | null;
  designation: string | null;
  department: string | null;
  employmentType: string;
  status: string;
  joinDate: string;
  grossSalary: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  workedMinutes: number | null;
  overtimeMinutes: number;
  status: string;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string | null;
  status: string;
  employee?: { firstName: string; lastName: string | null };
}

interface PayrollRun {
  id: string;
  period: string;
  companyId: string;
  status: string;
  totalGross: string;
  totalNet: string;
  employeeCount: number;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  INACTIVE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  TERMINATED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PRESENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ABSENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LEAVE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  HALF_DAY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  APPROVED_PR: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PAID: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

type Tab = 'employees' | 'attendance' | 'leave' | 'payroll';

export default function HrPage() {
  const [tab, setTab] = useState<Tab>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadEmployees = useCallback(async (q?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      const data = await api<Employee[]>(`/hr/employees?${params}`);
      setEmployees(data);
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const data = await api<AttendanceRecord[]>(`/hr/attendance?date=${today}`);
      setAttendance(data);
    } catch {
      setError('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<LeaveRequest[]>('/hr/leave-requests');
      setLeaves(data);
    } catch {
      setError('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<PayrollRun[]>('/hr/payroll');
      setPayrollRuns(data);
    } catch {
      setError('Failed to load payroll runs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'employees') loadEmployees();
    else if (tab === 'attendance') loadAttendance();
    else if (tab === 'leave') loadLeaves();
    else if (tab === 'payroll') loadPayroll();
  }, [tab, loadEmployees, loadAttendance, loadLeaves, loadPayroll]);

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leave', icon: Calendar },
    { id: 'payroll', label: 'Payroll', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">HR Management</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cx(
              'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              tab === id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Employees tab */}
      {tab === 'employees' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Search employees…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadEmployees(search)}
              className="max-w-xs"
            />
            <Button onClick={() => loadEmployees(search)} disabled={loading}>
              Search
            </Button>
          </div>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-4 py-3 text-left font-medium">Code</th>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Designation</th>
                    <th className="px-4 py-3 text-left font-medium">Department</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Gross Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                      <td className="px-4 py-3 font-mono text-xs">{emp.employeeCode}</td>
                      <td className="px-4 py-3 font-medium">
                        {emp.firstName} {emp.lastName ?? ''}
                      </td>
                      <td className="px-4 py-3 text-muted">{emp.designation ?? '-'}</td>
                      <td className="px-4 py-3 text-muted">{emp.department ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span className="rounded px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {emp.employmentType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cx('rounded px-2 py-0.5 text-xs font-medium', STATUS_COLORS[emp.status] ?? '')}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₹{Number(emp.grossSalary).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {!loading && employees.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted">
                        No employees found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Attendance tab */}
      {tab === 'attendance' && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Clock In</th>
                  <th className="px-4 py-3 text-left font-medium">Clock Out</th>
                  <th className="px-4 py-3 text-right font-medium">Worked (min)</th>
                  <th className="px-4 py-3 text-right font-medium">Overtime (min)</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((rec) => (
                  <tr key={rec.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="px-4 py-3">{rec.date}</td>
                    <td className="px-4 py-3">{rec.clockIn ? new Date(rec.clockIn).toLocaleTimeString() : '-'}</td>
                    <td className="px-4 py-3">{rec.clockOut ? new Date(rec.clockOut).toLocaleTimeString() : '-'}</td>
                    <td className="px-4 py-3 text-right">{rec.workedMinutes ?? '-'}</td>
                    <td className="px-4 py-3 text-right">{rec.overtimeMinutes}</td>
                    <td className="px-4 py-3">
                      <span className={cx('rounded px-2 py-0.5 text-xs font-medium', STATUS_COLORS[rec.status] ?? '')}>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && attendance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      No attendance records for today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Leave tab */}
      {tab === 'leave' && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-medium">Employee</th>
                  <th className="px-4 py-3 text-left font-medium">Leave Type</th>
                  <th className="px-4 py-3 text-left font-medium">From</th>
                  <th className="px-4 py-3 text-left font-medium">To</th>
                  <th className="px-4 py-3 text-right font-medium">Days</th>
                  <th className="px-4 py-3 text-left font-medium">Reason</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((req) => (
                  <tr key={req.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="px-4 py-3 text-xs font-mono">{req.employeeId.slice(-8)}</td>
                    <td className="px-4 py-3">{req.leaveTypeName}</td>
                    <td className="px-4 py-3">{req.fromDate}</td>
                    <td className="px-4 py-3">{req.toDate}</td>
                    <td className="px-4 py-3 text-right">{req.days}</td>
                    <td className="px-4 py-3 text-muted truncate max-w-[200px]">{req.reason ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={cx('rounded px-2 py-0.5 text-xs font-medium', STATUS_COLORS[req.status] ?? '')}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && leaves.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted">
                      No leave requests
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Payroll tab */}
      {tab === 'payroll' && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-medium">Period</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Employees</th>
                  <th className="px-4 py-3 text-right font-medium">Total Gross</th>
                  <th className="px-4 py-3 text-right font-medium">Total Net</th>
                </tr>
              </thead>
              <tbody>
                {payrollRuns.map((run) => (
                  <tr key={run.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium">{run.period}</td>
                    <td className="px-4 py-3">
                      <span className={cx('rounded px-2 py-0.5 text-xs font-medium', STATUS_COLORS[run.status] ?? STATUS_COLORS['DRAFT'])}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{run.employeeCount}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      ₹{Number(run.totalGross).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ₹{Number(run.totalNet).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
                {!loading && payrollRuns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
                      No payroll runs
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
