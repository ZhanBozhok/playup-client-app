import { useEffect, useState } from "react";
import {
  getEvents,
  getEvent,
  type ClientUser,
  type EventListItem,
  type EventDetail,
} from "./api";
import { fmtDate, fmtTime, activityLabel, spotsLabel } from "./format";

const s: Record<string, React.CSSProperties> = {
  screen: { padding: "var(--space-6) var(--space-5) 96px", display: "flex", flexDirection: "column", gap: "var(--space-4)" },
  brand: { fontFamily: "var(--font-heading)", fontSize: 20, color: "var(--color-green-800)", fontWeight: 600 },
  h1: { fontSize: "var(--font-size-h1)", margin: 0, lineHeight: 1.15 },
  muted: { color: "var(--color-graphite-600)", lineHeight: 1.6, margin: 0 },
  card: {
    background: "#fff",
    borderRadius: "var(--radius-xl)",
    boxShadow: "0 8px 24px rgba(31,35,32,0.06)",
    padding: "var(--space-5)",
    cursor: "pointer",
  },
  chip: {
    display: "inline-block",
    background: "var(--color-cream-100)",
    color: "var(--color-graphite-700, #3b403a)",
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 13,
  },
  primaryBtn: {
    width: "100%",
    padding: "15px 16px",
    border: "none",
    borderRadius: "var(--radius-lg)",
    background: "var(--color-green-800)",
    color: "var(--color-cream-50)",
    fontSize: 16,
    cursor: "pointer",
  },
};

export function HomeScreen({ user, onOpenSchedule }: { user: ClientUser; onOpenSchedule: () => void }) {
  return (
    <div style={s.screen}>
      <div style={s.brand}>PlayUp</div>
      <h1 style={s.h1}>Привет{user.telegram_username ? `, ${user.telegram_username}` : ""}</h1>
      <p style={s.muted}>Ты в клубе. Ближайшие игры и твои записи появятся здесь.</p>
      <div style={{ ...s.card, cursor: "default" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, marginBottom: 8 }}>Расписание открыто</div>
        <p style={{ ...s.muted, marginBottom: 16 }}>Посмотри, какие игры есть на ближайшие дни.</p>
        <button style={s.primaryBtn} onClick={onOpenSchedule}>Открыть расписание</button>
      </div>
    </div>
  );
}

const FILTERS = ["all", "football", "padel", "run", "yoga", "social"];

export function ScheduleScreen({ onOpenEvent }: { onOpenEvent: (id: string) => void }) {
  const [events, setEvents] = useState<EventListItem[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEvents(null);
    setError(null);
    getEvents(filter)
      .then(setEvents)
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, [filter]);

  return (
    <div style={s.screen}>
      <h1 style={s.h1}>Расписание</h1>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...s.chip,
              border: "none",
              cursor: "pointer",
              background: filter === f ? "var(--color-green-800)" : "var(--color-cream-100)",
              color: filter === f ? "var(--color-cream-50)" : "var(--color-graphite-700, #3b403a)",
              whiteSpace: "nowrap",
            }}
          >
            {f === "all" ? "Все" : activityLabel(f)}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      {!events && !error && <p style={s.muted}>Загрузка…</p>}
      {events && events.length === 0 && <p style={s.muted}>Пока нет открытых игр. Загляни позже.</p>}

      {events?.map((e) => (
        <div key={e.id} style={s.card} onClick={() => onOpenEvent(e.id)}>
          <span style={s.chip}>{activityLabel(e.activity_type)}</span>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: "10px 0 4px" }}>{e.title}</div>
          <p style={{ ...s.muted, textTransform: "capitalize" }}>
            {fmtDate.format(new Date(e.starts_at))}, {fmtTime.format(new Date(e.starts_at))}
          </p>
          {e.venue && <p style={s.muted}>{e.venue.name}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 14 }}>
            <span>{e.price > 0 ? `${e.price} ${e.currency}` : "Бесплатно"}</span>
            <span style={{ color: e.spots_left === 0 ? "var(--color-danger)" : "var(--color-graphite-600)" }}>
              {spotsLabel(e.spots_left)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EventDetailScreen({ id, onBack }: { id: string; onBack: () => void }) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEvent(id)
      .then(setEvent)
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, [id]);

  return (
    <div style={s.screen}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--color-green-800)", fontSize: 15, cursor: "pointer", padding: 0, textAlign: "left" }}>
        ← Назад
      </button>
      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      {!event && !error && <p style={s.muted}>Загрузка…</p>}
      {event && (
        <>
          <span style={s.chip}>{activityLabel(event.activity_type)}</span>
          <h1 style={s.h1}>{event.title}</h1>
          <p style={{ ...s.muted, textTransform: "capitalize" }}>
            {fmtDate.format(new Date(event.starts_at))}
          </p>
          <p style={s.muted}>
            {fmtTime.format(new Date(event.starts_at))} — {fmtTime.format(new Date(event.ends_at))}
          </p>

          <div style={{ ...s.card, cursor: "default", display: "grid", gap: 8 }}>
            {event.venue && <Row label="Место" value={`${event.venue.name}${event.venue.address ? `, ${event.venue.address}` : ""}`} />}
            {event.host && <Row label="Хост" value={event.host.name} />}
            {event.level && <Row label="Уровень" value={event.level} />}
            <Row label="Цена" value={event.price > 0 ? `${event.price} ${event.currency}` : "Бесплатно"} />
            <Row label="Места" value={spotsLabel(event.spots_left)} />
          </div>

          {event.description && <p style={{ ...s.muted, lineHeight: 1.7 }}>{event.description}</p>}

          {/* Запись появится в Итерации 2 */}
          <button style={{ ...s.primaryBtn, opacity: 0.5, cursor: "not-allowed" }} disabled>
            Запись — скоро
          </button>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "var(--color-muted)", fontSize: 14 }}>{label}</span>
      <span style={{ fontSize: 14, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export function ProfileScreen({ user }: { user: ClientUser }) {
  return (
    <div style={s.screen}>
      <h1 style={s.h1}>Профиль</h1>
      <div style={{ ...s.card, cursor: "default" }}>
        <Row label="Telegram" value={user.telegram_username ? `@${user.telegram_username}` : "—"} />
        <Row label="Профиль" value={user.profile_completed ? "заполнен" : "заполним при первой записи"} />
      </div>
      <p style={s.muted}>Редактирование профиля и статистика появятся в Итерации 3.</p>
    </div>
  );
}
