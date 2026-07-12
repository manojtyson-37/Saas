'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { BedDouble, Plus, Users, CalendarCheck, Home, ClipboardCheck } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { Button, Card, Input, cx } from '@/components/ui/primitives';

interface RoomType {
  id: string;
  locationId: string;
  name: string;
  code: string;
  baseOccupancy: number;
  maxOccupancy: number;
  baseRate: string;
  extraBedRate: string;
  amenities: string[];
  isActive: boolean;
}

interface Room {
  id: string;
  number: string;
  floor: string | null;
  status: string;
  isActive: boolean;
  roomType: { name: string; code: string };
}

interface GuestProfile {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  vip: boolean;
  nationality: string | null;
  company: string | null;
}

interface Reservation {
  id: string;
  number: string;
  status: string;
  source: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  note: string | null;
  rooms: ReservationRoom[];
}

interface ReservationRoom {
  id: string;
  roomTypeId: string;
  ratePlanId: string;
  roomId: string | null;
  nightlyRate: string;
}

interface HousekeepingTask {
  id: string;
  roomId: string;
  type: string;
  status: string;
  assignedTo: string | null;
  priority: number;
  note: string | null;
  createdAt: string;
}

const ROOM_STATUS_COLORS: Record<string, string> = {
  VACANT_CLEAN: 'bg-success/10 text-success',
  VACANT_DIRTY: 'bg-warning/10 text-warning',
  OCCUPIED: 'bg-primary/10 text-primary',
  INSPECTED: 'bg-blue-500/10 text-blue-600',
  OUT_OF_ORDER: 'bg-destructive/10 text-destructive',
  OUT_OF_SERVICE: 'bg-destructive/10 text-destructive',
};

const RESERVATION_STATUS_COLORS: Record<string, string> = {
  TENTATIVE: 'bg-warning/10 text-warning',
  CONFIRMED: 'bg-blue-500/10 text-blue-600',
  CHECKED_IN: 'bg-success/10 text-success',
  CHECKED_OUT: 'bg-accent text-muted',
  CANCELLED: 'bg-destructive/10 text-destructive',
  NO_SHOW: 'bg-destructive/10 text-destructive',
};

const HK_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-warning/10 text-warning',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-600',
  DONE: 'bg-success/10 text-success',
  VERIFIED: 'bg-success/10 text-success',
  CANCELLED: 'bg-accent text-muted',
};

type Tab = 'rooms' | 'reservations' | 'guests' | 'housekeeping';

function StatusBadge({ value, colors }: { value: string; colors: Record<string, string> }) {
  const cls = colors[value] ?? 'bg-accent text-muted';
  return (
    <span className={cx('inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium', cls)}>
      {value.replace(/_/g, ' ')}
    </span>
  );
}

export default function HotelPage() {
  const [tab, setTab] = useState<Tab>('rooms');
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<GuestProfile[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [hkTasks, setHkTasks] = useState<HousekeepingTask[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Room type form
  const [showRtForm, setShowRtForm] = useState(false);
  const [rtForm, setRtForm] = useState({ locationId: '', name: '', code: '', baseRate: '' });

  // Guest form
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestForm, setGuestForm] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const [guestSearch, setGuestSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rt, ro, g, res, hk] = await Promise.all([
        api<RoomType[]>('/hotel/room-types'),
        api<Room[]>('/hotel/rooms?locationId=').catch(() => [] as Room[]),
        api<GuestProfile[]>('/hotel/guests'),
        api<Reservation[]>('/hotel/reservations'),
        api<HousekeepingTask[]>('/hotel/housekeeping'),
      ]);
      setRoomTypes(rt);
      setRooms(ro);
      setGuests(g);
      setReservations(res);
      setHkTasks(hk);
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to load hotel data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadGuests = useCallback(async (search?: string) => {
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const data = await api<GuestProfile[]>(`/hotel/guests${q}`);
      setGuests(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadGuests(guestSearch), 300);
    return () => clearTimeout(t);
  }, [guestSearch, loadGuests]);

  async function submitRoomType(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/hotel/room-types', {
        method: 'POST',
        body: JSON.stringify({
          locationId: rtForm.locationId,
          name: rtForm.name,
          code: rtForm.code.toUpperCase(),
          baseRate: parseFloat(rtForm.baseRate),
        }),
      });
      setRtForm({ locationId: '', name: '', code: '', baseRate: '' });
      setShowRtForm(false);
      void load();
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to create room type');
    }
  }

  async function submitGuest(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/hotel/guests', {
        method: 'POST',
        body: JSON.stringify({
          firstName: guestForm.firstName,
          lastName: guestForm.lastName || undefined,
          phone: guestForm.phone || undefined,
          email: guestForm.email || undefined,
        }),
      });
      setGuestForm({ firstName: '', lastName: '', phone: '', email: '' });
      setShowGuestForm(false);
      void loadGuests();
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to create guest');
    }
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'rooms', label: 'Rooms', icon: <Home className="h-4 w-4" /> },
    { id: 'reservations', label: 'Reservations', icon: <CalendarCheck className="h-4 w-4" /> },
    { id: 'guests', label: 'Guests', icon: <Users className="h-4 w-4" /> },
    { id: 'housekeeping', label: 'Housekeeping', icon: <ClipboardCheck className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BedDouble className="h-6 w-6 text-muted" />
        <div>
          <h1 className="text-xl font-semibold">Hotel PMS</h1>
          <p className="text-[13px] text-muted">Rooms, reservations, front desk and housekeeping</p>
        </div>
      </div>

      {error && (
        <div className="rounded-control border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors',
              tab === t.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted hover:text-foreground',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      )}

      {/* ── Rooms Tab ─────────────────────────────────────────────────────── */}
      {tab === 'rooms' && !loading && (
        <div className="space-y-6">
          {/* Room Type summary cards */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">Room Types</h2>
              <Button size="sm" onClick={() => setShowRtForm(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Room Type
              </Button>
            </div>
            {showRtForm && (
              <Card className="mb-4 p-4">
                <form onSubmit={(e) => void submitRoomType(e)} className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Input
                    placeholder="Location ID (UUID)"
                    value={rtForm.locationId}
                    onChange={(e) => setRtForm((f) => ({ ...f, locationId: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Name (e.g. Deluxe Double)"
                    value={rtForm.name}
                    onChange={(e) => setRtForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Code (e.g. DLX)"
                    value={rtForm.code}
                    onChange={(e) => setRtForm((f) => ({ ...f, code: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Base rate ₹"
                    type="number"
                    min="0"
                    step="0.01"
                    value={rtForm.baseRate}
                    onChange={(e) => setRtForm((f) => ({ ...f, baseRate: e.target.value }))}
                    required
                  />
                  <div className="col-span-2 flex gap-2 md:col-span-4">
                    <Button type="submit" size="sm">Create</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowRtForm(false)}>Cancel</Button>
                  </div>
                </form>
              </Card>
            )}
            {roomTypes.length === 0 ? (
              <p className="text-[13px] text-muted">No room types configured.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {roomTypes.map((rt) => (
                  <Card key={rt.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{rt.name}</p>
                        <p className="text-[12px] text-muted">Code: {rt.code}</p>
                      </div>
                      <span className={cx(
                        'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium',
                        rt.isActive ? 'bg-success/10 text-success' : 'bg-accent text-muted'
                      )}>
                        {rt.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                      <div>
                        <span className="text-muted">Base Rate</span>
                        <p className="font-medium">₹{Number(rt.baseRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <span className="text-muted">Occupancy</span>
                        <p className="font-medium">{rt.baseOccupancy} / {rt.maxOccupancy}</p>
                      </div>
                    </div>
                    {rt.amenities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {rt.amenities.map((a) => (
                          <span key={a} className="rounded bg-accent px-1.5 py-0.5 text-[11px] text-muted">{a}</span>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Room list */}
          <div>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted">Rooms</h2>
            {rooms.length === 0 ? (
              <p className="text-[13px] text-muted">No rooms found. Select a location to view rooms.</p>
            ) : (
              <Card>
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border text-left text-[12px] text-muted">
                      <th className="px-4 py-2.5 font-medium">Room</th>
                      <th className="px-4 py-2.5 font-medium">Floor</th>
                      <th className="px-4 py-2.5 font-medium">Type</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-mono font-medium">{r.number}</td>
                        <td className="px-4 py-3 text-muted">{r.floor ?? '—'}</td>
                        <td className="px-4 py-3">{r.roomType.name}</td>
                        <td className="px-4 py-3">
                          <StatusBadge value={r.status} colors={ROOM_STATUS_COLORS} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── Reservations Tab ──────────────────────────────────────────────── */}
      {tab === 'reservations' && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
              Reservations ({reservations.length})
            </h2>
          </div>
          {reservations.length === 0 ? (
            <p className="text-[13px] text-muted">No reservations found.</p>
          ) : (
            <Card>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[12px] text-muted">
                    <th className="px-4 py-2.5 font-medium">Number</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Source</th>
                    <th className="px-4 py-2.5 font-medium">Check-in</th>
                    <th className="px-4 py-2.5 font-medium">Check-out</th>
                    <th className="px-4 py-2.5 font-medium">Guests</th>
                    <th className="px-4 py-2.5 font-medium">Rooms</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-mono text-[12px] font-semibold">{r.number}</td>
                      <td className="px-4 py-3">
                        <StatusBadge value={r.status} colors={RESERVATION_STATUS_COLORS} />
                      </td>
                      <td className="px-4 py-3 text-muted">{r.source}</td>
                      <td className="px-4 py-3">{r.checkInDate.slice(0, 10)}</td>
                      <td className="px-4 py-3">{r.checkOutDate.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-muted">{r.adults}A {r.children > 0 ? `+ ${r.children}C` : ''}</td>
                      <td className="px-4 py-3 text-muted">{r.rooms.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* ── Guests Tab ────────────────────────────────────────────────────── */}
      {tab === 'guests' && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">Guest Profiles</h2>
            <Button size="sm" onClick={() => setShowGuestForm(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Guest
            </Button>
          </div>

          <Input
            placeholder="Search by name, phone or email…"
            value={guestSearch}
            onChange={(e) => setGuestSearch(e.target.value)}
            className="max-w-xs"
          />

          {showGuestForm && (
            <Card className="p-4">
              <form onSubmit={(e) => void submitGuest(e)} className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Input
                  placeholder="First name *"
                  value={guestForm.firstName}
                  onChange={(e) => setGuestForm((f) => ({ ...f, firstName: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Last name"
                  value={guestForm.lastName}
                  onChange={(e) => setGuestForm((f) => ({ ...f, lastName: e.target.value }))}
                />
                <Input
                  placeholder="Phone"
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm((f) => ({ ...f, phone: e.target.value }))}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={guestForm.email}
                  onChange={(e) => setGuestForm((f) => ({ ...f, email: e.target.value }))}
                />
                <div className="col-span-2 flex gap-2 md:col-span-4">
                  <Button type="submit" size="sm">Create</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowGuestForm(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}

          {guests.length === 0 ? (
            <p className="text-[13px] text-muted">No guest profiles found.</p>
          ) : (
            <Card>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[12px] text-muted">
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Phone</th>
                    <th className="px-4 py-2.5 font-medium">Email</th>
                    <th className="px-4 py-2.5 font-medium">Company</th>
                    <th className="px-4 py-2.5 font-medium">VIP</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g) => (
                    <tr key={g.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">
                        {g.firstName} {g.lastName ?? ''}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-muted">{g.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-muted">{g.email ?? '—'}</td>
                      <td className="px-4 py-3 text-muted">{g.company ?? '—'}</td>
                      <td className="px-4 py-3">
                        {g.vip && (
                          <span className="rounded bg-warning/10 px-1.5 py-0.5 text-[11px] font-medium text-warning">VIP</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* ── Housekeeping Tab ──────────────────────────────────────────────── */}
      {tab === 'housekeeping' && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
              Housekeeping Tasks ({hkTasks.length})
            </h2>
          </div>
          {hkTasks.length === 0 ? (
            <p className="text-[13px] text-muted">No housekeeping tasks.</p>
          ) : (
            <Card>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[12px] text-muted">
                    <th className="px-4 py-2.5 font-medium">Type</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Priority</th>
                    <th className="px-4 py-2.5 font-medium">Assigned To</th>
                    <th className="px-4 py-2.5 font-medium">Note</th>
                    <th className="px-4 py-2.5 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {hkTasks.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{t.type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">
                        <StatusBadge value={t.status} colors={HK_STATUS_COLORS} />
                      </td>
                      <td className="px-4 py-3 text-muted">{t.priority}</td>
                      <td className="px-4 py-3 text-muted">{t.assignedTo ?? '—'}</td>
                      <td className="px-4 py-3 text-muted">{t.note ?? '—'}</td>
                      <td className="px-4 py-3 text-muted">{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
