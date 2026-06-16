import { useEffect, useState } from "react";
import {
  getEvents,
  getEvent,
  getHome,
  getProfile,
  updateProfile,
  bookEvent,
  cancelBooking,
  type EventListItem,
  type EventDetail,
  type HomeData,
  type Profile,
  type ProfileInput,
} from "./api";
import { fmtDate, fmtTime, activityLabel, spotsLabel } from "./format";

const LEVELS: [string, string][] = [
  ["beginner", "Новичок"],
  ["amateur", "Любитель"],
  ["confident", "Уверенный"],
  ["advanced", "Продвинутый"],
];
const SOURCES: [string, string][] = [
  ["instagram", "Instagram"],
  ["threads", "Threads"],
  ["telegram_chat", "Telegram-чат"],
  ["friend", "Друг"],
  ["host_invite", "Пригласил хост"],
  ["ads", "Реклама"],
  ["offline", "Оффлайн"],
  ["other", "Другое"],
];

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
  },
  chip: { display: "inline-block", background: "var(--color-cream-100)", color: "#3b403a", borderRadius: 999, padding: "4px 12px", fontSize: 13 },
  primaryBtn: { width: "100%", padding: "15px 16px", border: "none", borderRadius: "var(--radius-lg)", background: "var(--color-green-800)", color: "var(--color-cream-50)", fontSize: 16, cursor: "pointer" },
  secondaryBtn: { width: "100%", padding: "14px 16px", border: "1px solid var(--color-line)", borderRadius: "var(--radius-lg)", background: "transparent", color: "var(--color-green-800)", fontSize: 15, cursor: "pointer" },
  input: { padding: "12px 14px", border: "1px solid var(--color-line)", borderRadius: "var(--radius-md)", fontSize: 16, background: "var(--color-cream-50)", width: "100%" },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--color-graphite-600)" },
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "var(--color-muted)", fontSize: 14 }}>{label}</span>
      <span style={{ fontSize: 14, textAlign: "right" }}>{value}</span>
    </div>
  );
}

// ---------- Home ----------
export function HomeScreen({ onOpenSchedule, onOpenEvent }: { onOpenSchedule: () => void; onOpenEvent: (id: string) => void }) {
  const [home, setHome] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHome().then(setHome).catch((e) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, []);

  const name = home?.user.display_name;
  return (
    <div style={s.screen}>
      <div style={s.brand}>PlayUp</div>
      <h1 style={s.h1}>Привет{name ? `, ${name}` : ""}</h1>
      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      {!home && !error && <p style={s.muted}>Загрузка…</p>}

      {home && home.upcoming_bookings.length === 0 && (
        <>
          <p style={s.muted}>Ты пока не записан на события.</p>
          <div style={s.card}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, marginBottom: 8 }}>Найди свою игру</div>
            <p style={{ ...s.muted, marginBottom: 16 }}>Посмотри расписание ближайших встреч.</p>
            <button style={s.primaryBtn} onClick={onOpenSchedule}>Посмотреть расписание</button>
          </div>
        </>
      )}

      {home && home.upcoming_bookings.length > 0 && (
        <>
          <p style={s.muted}>Твои ближайшие игры</p>
          {home.upcoming_bookings.map((b) => (
            <div key={b.booking_id} style={{ ...s.card, cursor: "pointer" }} onClick={() => onOpenEvent(b.event.id)}>
              <span style={s.chip}>{activityLabel(b.event.activity_type)}</span>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: "10px 0 4px" }}>{b.event.title}</div>
              <p style={{ ...s.muted, textTransform: "capitalize" }}>
                {fmtDate.format(new Date(b.event.starts_at))}, {fmtTime.format(new Date(b.event.starts_at))}
              </p>
              {b.event.venue_name && <p style={s.muted}>{b.event.venue_name}</p>}
              {b.event.status === "cancelled" ? (
                <p style={{ color: "var(--color-danger)", fontSize: 14, marginTop: 8 }}>Событие отменено</p>
              ) : (
                <p style={{ color: "var(--color-success)", fontSize: 14, marginTop: 8 }}>Ты записан · напомним перед игрой</p>
              )}
            </div>
          ))}
          <button style={s.secondaryBtn} onClick={onOpenSchedule}>Открыть расписание</button>
        </>
      )}
    </div>
  );
}

// ---------- Schedule ----------
const FILTERS = ["all", "football", "padel", "run", "yoga", "social"];

export function ScheduleScreen({ onOpenEvent }: { onOpenEvent: (id: string) => void }) {
  const [events, setEvents] = useState<EventListItem[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEvents(null);
    setError(null);
    getEvents(filter).then(setEvents).catch((e) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, [filter]);

  return (
    <div style={s.screen}>
      <h1 style={s.h1}>Расписание</h1>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ ...s.chip, border: "none", cursor: "pointer", whiteSpace: "nowrap", background: filter === f ? "var(--color-green-800)" : "var(--color-cream-100)", color: filter === f ? "var(--color-cream-50)" : "#3b403a" }}
          >
            {f === "all" ? "Все" : activityLabel(f)}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      {!events && !error && <p style={s.muted}>Загрузка…</p>}
      {events && events.length === 0 && <p style={s.muted}>Пока нет открытых игр. Загляни позже.</p>}

      {events?.map((e) => (
        <div key={e.id} style={{ ...s.card, cursor: "pointer" }} onClick={() => onOpenEvent(e.id)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={s.chip}>{activityLabel(e.activity_type)}</span>
            {e.user_booking_status === "booked" && <span style={{ ...s.chip, background: "#dceee2", color: "var(--color-success)" }}>Вы записаны</span>}
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: "10px 0 4px" }}>{e.title}</div>
          <p style={{ ...s.muted, textTransform: "capitalize" }}>
            {fmtDate.format(new Date(e.starts_at))}, {fmtTime.format(new Date(e.starts_at))}
          </p>
          {e.venue && <p style={s.muted}>{e.venue.name}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 14 }}>
            <span>{e.price > 0 ? `${e.price} ${e.currency}` : "Бесплатно"}</span>
            <span style={{ color: e.spots_left === 0 ? "var(--color-danger)" : "var(--color-graphite-600)" }}>{spotsLabel(e.spots_left)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Event detail + booking ----------
type BookingPhase = "idle" | "profileForm" | "submitting" | "done";

export function EventDetailScreen({ id, onBack }: { id: string; onBack: () => void }) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<BookingPhase>("idle");
  const [actionError, setActionError] = useState<string | null>(null);

  // профиль-форма
  const [pName, setPName] = useState("");
  const [pLevel, setPLevel] = useState("amateur");
  const [pArea, setPArea] = useState("");
  const [pSource, setPSource] = useState("instagram");

  function load() {
    getEvent(id).then(setEvent).catch((e) => setError(e instanceof Error ? e.message : "Ошибка"));
  }
  useEffect(load, [id]);

  async function doBook(profile?: ProfileInput) {
    setActionError(null);
    setPhase("submitting");
    try {
      await bookEvent(id, profile);
      setPhase("done");
      load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Ошибка");
      setPhase("idle");
    }
  }

  function onBookClick() {
    if (!event) return;
    if (event.requires_profile_completion) {
      // предзаполним спорт активностью события
      setPName("");
      setPhase("profileForm");
    } else {
      doBook();
    }
  }

  async function onProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    await doBook({
      display_name: pName,
      level: pLevel,
      preferred_area: pArea || undefined,
      traffic_source: pSource,
      preferred_sports: event ? [event.activity_type] : undefined,
    });
  }

  async function onCancel() {
    if (!event) return;
    // booking_id неизвестен на карточке; берём из home? Проще: повторно запросить home не нужно —
    // отменяем через поиск активной записи на сервере не предусмотрен, поэтому грузим home.
    setActionError(null);
    try {
      const home = await getHome();
      const b = home.upcoming_bookings.find((x) => x.event.id === id);
      if (!b) throw new Error("Запись не найдена");
      await cancelBooking(b.booking_id);
      load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Ошибка");
    }
  }

  if (error) return <div style={s.screen}><BackBtn onBack={onBack} /><p style={{ color: "var(--color-danger)" }}>{error}</p></div>;
  if (!event) return <div style={s.screen}><BackBtn onBack={onBack} /><p style={s.muted}>Загрузка…</p></div>;

  const started = new Date(event.starts_at) <= new Date();
  const isBooked = event.user_booking_status === "booked";

  return (
    <div style={s.screen}>
      <BackBtn onBack={onBack} />

      {phase === "done" && (
        <div style={{ ...s.card, background: "var(--color-green-900)", color: "var(--color-cream-50)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 24 }}>Ты записан</div>
          <p style={{ opacity: 0.85, marginTop: 6 }}>Мы напомним перед событием.</p>
        </div>
      )}

      <span style={s.chip}>{activityLabel(event.activity_type)}</span>
      <h1 style={s.h1}>{event.title}</h1>
      <p style={{ ...s.muted, textTransform: "capitalize" }}>{fmtDate.format(new Date(event.starts_at))}</p>
      <p style={s.muted}>{fmtTime.format(new Date(event.starts_at))} — {fmtTime.format(new Date(event.ends_at))}</p>

      <div style={{ ...s.card, display: "grid", gap: 8 }}>
        {event.venue && <Row label="Место" value={`${event.venue.name}${event.venue.address ? `, ${event.venue.address}` : ""}`} />}
        {event.host && <Row label="Хост" value={event.host.name} />}
        {event.level && <Row label="Уровень" value={event.level} />}
        <Row label="Цена" value={event.price > 0 ? `${event.price} ${event.currency}` : "Бесплатно"} />
        <Row label="Места" value={spotsLabel(event.spots_left)} />
      </div>

      {event.description && <p style={{ ...s.muted, lineHeight: 1.7 }}>{event.description}</p>}

      {actionError && <p style={{ color: "var(--color-danger)" }}>{actionError}</p>}

      {/* Профиль-форма первой записи */}
      {phase === "profileForm" && (
        <form onSubmit={onProfileSubmit} style={{ ...s.card, display: "grid", gap: 14 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 20 }}>Пара деталей, чтобы подобрать тебе нормальную игру</div>
          <label style={s.label}>Имя
            <input style={s.input} value={pName} onChange={(e) => setPName(e.target.value)} required />
          </label>
          <label style={s.label}>Уровень
            <select style={s.input} value={pLevel} onChange={(e) => setPLevel(e.target.value)}>
              {LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label style={s.label}>Район / удобная локация
            <input style={s.input} value={pArea} onChange={(e) => setPArea(e.target.value)} />
          </label>
          <label style={s.label}>Откуда узнал о PlayUp
            <select style={s.input} value={pSource} onChange={(e) => setPSource(e.target.value)}>
              {SOURCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <button type="submit" style={s.primaryBtn} disabled={phase !== "profileForm" ? true : false}>
            Сохранить и записаться
          </button>
        </form>
      )}

      {/* Главная кнопка */}
      {phase !== "profileForm" && (
        <>
          {event.status === "cancelled" ? (
            <button style={{ ...s.primaryBtn, opacity: 0.5, cursor: "not-allowed" }} disabled>Событие отменено</button>
          ) : started ? (
            <button style={{ ...s.primaryBtn, opacity: 0.5, cursor: "not-allowed" }} disabled>Событие прошло</button>
          ) : isBooked ? (
            <button style={s.secondaryBtn} onClick={onCancel}>Отменить запись</button>
          ) : event.spots_left === 0 ? (
            <button style={{ ...s.primaryBtn, opacity: 0.5, cursor: "not-allowed" }} disabled>Мест нет</button>
          ) : (
            <button style={s.primaryBtn} onClick={onBookClick} disabled={phase === "submitting"}>
              {phase === "submitting" ? "Записываем…" : "Записаться"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function BackBtn({ onBack }: { onBack: () => void }) {
  return (
    <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--color-green-800)", fontSize: 15, cursor: "pointer", padding: 0, textAlign: "left" }}>
      ← Назад
    </button>
  );
}

// ---------- Profile ----------
export function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileInput>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p);
        setForm({ display_name: p.display_name ?? "", level: p.level ?? "", preferred_area: p.preferred_area ?? "", phone: p.phone ?? "" });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const p = await updateProfile(form);
      setProfile(p);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={s.screen}>
      <h1 style={s.h1}>Профиль</h1>
      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      {!profile && !error && <p style={s.muted}>Загрузка…</p>}

      {profile && !editing && (
        <>
          <div style={{ ...s.card, display: "grid", gap: 8 }}>
            <Row label="Имя" value={profile.display_name ?? "—"} />
            <Row label="Telegram" value={profile.telegram_username ? `@${profile.telegram_username}` : "—"} />
            <Row label="Уровень" value={profile.level ?? "—"} />
            <Row label="Район" value={profile.preferred_area ?? "—"} />
            <Row label="Телефон" value={profile.phone ?? "—"} />
          </div>
          <button style={s.secondaryBtn} onClick={() => setEditing(true)}>Редактировать</button>
        </>
      )}

      {profile && editing && (
        <form onSubmit={save} style={{ ...s.card, display: "grid", gap: 14 }}>
          <label style={s.label}>Имя
            <input style={s.input} value={form.display_name ?? ""} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          </label>
          <label style={s.label}>Уровень
            <select style={s.input} value={form.level ?? ""} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option value="">—</option>
              {LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label style={s.label}>Район
            <input style={s.input} value={form.preferred_area ?? ""} onChange={(e) => setForm({ ...form, preferred_area: e.target.value })} />
          </label>
          <label style={s.label}>Телефон
            <input style={s.input} value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <button type="submit" style={s.primaryBtn} disabled={saving}>{saving ? "Сохраняем…" : "Сохранить"}</button>
          <button type="button" style={s.secondaryBtn} onClick={() => setEditing(false)}>Отмена</button>
        </form>
      )}
    </div>
  );
}
