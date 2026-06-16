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
