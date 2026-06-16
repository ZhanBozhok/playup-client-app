import { useEffect, useState } from "react";
import { getInitData } from "./telegram";
import { authTelegram, type ClientUser } from "./api";
import { HomeScreen, ScheduleScreen, EventDetailScreen, ProfileScreen } from "./screens";

type AuthState =
  | { phase: "loading" }
  | { phase: "ready"; user: ClientUser }
  | { phase: "error"; message: string };

type Tab = "home" | "schedule" | "profile";

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ phase: "loading" });
  const [tab, setTab] = useState<Tab>("home");
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const initData = getInitData();
        const { token, user } = await authTelegram(initData);
        localStorage.setItem("playup_client_token", token);
        if (alive) setAuth({ phase: "ready", user });
      } catch (e) {
        if (alive) setAuth({ phase: "error", message: e instanceof Error ? e.message : "Ошибка" });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (auth.phase === "loading") {
    return (
      <Centered>
        <div style={brand}>PlayUp</div>
        <p style={muted}>Открываем приложение…</p>
      </Centered>
    );
  }
  if (auth.phase === "error") {
    return (
      <Centered>
        <div style={brand}>PlayUp</div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28 }}>Не получилось открыть приложение</h1>
        <p style={muted}>{auth.message}. Попробуй зайти заново из Telegram.</p>
      </Centered>
    );
  }

  // event detail перекрывает таб
  let content: React.ReactNode;
  if (eventId) {
    content = <EventDetailScreen id={eventId} onBack={() => setEventId(null)} />;
  } else if (tab === "home") {
    content = <HomeScreen user={auth.user} onOpenSchedule={() => setTab("schedule")} />;
  } else if (tab === "schedule") {
    content = <ScheduleScreen onOpenEvent={(id) => setEventId(id)} />;
  } else {
    content = <ProfileScreen user={auth.user} />;
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {content}
      <nav style={navBar}>
        <TabButton label="Главная" active={tab === "home" && !eventId} onClick={() => { setEventId(null); setTab("home"); }} />
        <TabButton label="Расписание" active={tab === "schedule" && !eventId} onClick={() => { setEventId(null); setTab("schedule"); }} />
        <TabButton label="Профиль" active={tab === "profile" && !eventId} onClick={() => { setEventId(null); setTab("profile"); }} />
      </nav>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: "none",
        border: "none",
        padding: "12px 0",
        fontSize: 13,
        cursor: "pointer",
        color: active ? "var(--color-green-800)" : "var(--color-muted)",
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", gap: 12, padding: "var(--space-7) var(--space-5)" }}>
      {children}
    </main>
  );
}

const brand: React.CSSProperties = { fontFamily: "var(--font-heading)", fontSize: 22, color: "var(--color-green-800)", fontWeight: 600 };
const muted: React.CSSProperties = { color: "var(--color-graphite-600)", lineHeight: 1.6, margin: 0 };
const navBar: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  display: "flex",
  background: "var(--color-cream-50)",
  borderTop: "1px solid var(--color-line)",
  paddingBottom: "env(safe-area-inset-bottom)",
};
