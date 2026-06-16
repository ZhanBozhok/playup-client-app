const BASE = import.meta.env.VITE_API_BASE_URL || "";

export type ClientUser = {
  id: string;
  telegram_username: string | null;
  profile_completed: boolean;
};

export type EventListItem = {
  id: string;
  title: string;
  activity_type: string;
  starts_at: string;
  ends_at: string;
  venue: { id: string; name: string; address: string | null } | null;
  price: number;
  currency: string;
  capacity: number;
  booked_count: number;
  spots_left: number;
  level: string | null;
  status: string;
  user_booking_status: string | null;
};

export type EventDetail = EventListItem & {
  description: string | null;
  host: { name: string } | null;
  min_quorum: number | null;
  requires_profile_completion: boolean;
  venue: { id: string; name: string; address: string | null; map_url: string | null } | null;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("playup_client_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function authTelegram(initData: string): Promise<{ token: string; user: ClientUser }> {
  const res = await fetch(`${BASE}/api/client/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ init_data: initData }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error?.message ?? "Не получилось открыть приложение");
  }
  return res.json();
}

export async function getEvents(activityType?: string): Promise<EventListItem[]> {
  const qs = activityType && activityType !== "all" ? `?activity_type=${activityType}` : "";
  const res = await fetch(`${BASE}/api/client/events${qs}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("Не получилось загрузить расписание");
  const data = await res.json();
  return data.events;
}

export async function getEvent(id: string): Promise<EventDetail> {
  const res = await fetch(`${BASE}/api/client/events/${id}`, { headers: { ...authHeaders() } });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Событие не найдено или недоступно");
    throw new Error("Не получилось загрузить событие");
  }
  return res.json();
}

export type ProfileInput = {
  display_name?: string;
  level?: string;
  preferred_sports?: string[];
  preferred_area?: string;
  traffic_source?: string;
  phone?: string;
};

const ERROR_RU: Record<string, string> = {
  EVENT_FULL: "Мест уже нет",
  EVENT_CANCELLED: "Событие отменено",
  EVENT_ALREADY_STARTED: "Событие уже началось",
  EVENT_NOT_PUBLISHED: "Событие недоступно",
  ALREADY_BOOKED: "Ты уже записан",
  PROFILE_REQUIRED: "Заполни профиль",
  BOOKING_NOT_FOUND: "Запись не найдена",
};

export async function bookEvent(eventId: string, profile?: ProfileInput) {
  const res = await fetch(`${BASE}/api/client/events/${eventId}/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(profile ? { profile } : {}),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const code = data?.error?.code;
    throw new Error(ERROR_RU[code] ?? data?.error?.message ?? "Не получилось записаться");
  }
  return data as { booking: { id: string; status: string }; event: { spots_left: number; user_booking_status: string } };
}

export async function cancelBooking(bookingId: string) {
  const res = await fetch(`${BASE}/api/client/bookings/${bookingId}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ reason: "client_cancel" }),
  });
  if (!res.ok) throw new Error("Не получилось отменить запись");
  return res.json();
}

export type HomeData = {
  user: { id: string; display_name: string | null; profile_completed: boolean };
  upcoming_bookings: {
    booking_id: string;
    booking_status: string;
    event: {
      id: string;
      title: string;
      activity_type: string;
      starts_at: string;
      ends_at: string;
      venue_name: string | null;
      status: string;
    };
  }[];
  suggested_events: { id: string; title: string; activity_type: string; starts_at: string; venue_name: string | null }[];
};

export async function getHome(): Promise<HomeData> {
  const res = await fetch(`${BASE}/api/client/home`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("Не получилось загрузить главную");
  return res.json();
}

export type Profile = {
  display_name: string | null;
  telegram_username: string | null;
  level: string | null;
  preferred_sports: string[];
  preferred_area: string | null;
  available_times: string[];
  traffic_source: string | null;
  phone: string | null;
  profile_completed: boolean;
};

export async function getProfile(): Promise<Profile> {
  const res = await fetch(`${BASE}/api/client/profile`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("Не получилось загрузить профиль");
  return (await res.json()).profile;
}

export async function updateProfile(patch: ProfileInput): Promise<Profile> {
  const res = await fetch(`${BASE}/api/client/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Не получилось сохранить профиль");
  return (await res.json()).profile;
}
