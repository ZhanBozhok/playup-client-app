import { useEffect, useState } from "react";
import { getInitData } from "./telegram";
import { authTelegram, type ClientUser } from "./api";

type State =
  | { phase: "loading" }
  | { phase: "ready"; user: ClientUser }
  | { phase: "error"; message: string };

export default function App() {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const initData = getInitData();
        const { token, user } = await authTelegram(initData);
        localStorage.setItem("playup_client_token", token);
        if (alive) setState({ phase: "ready", user });
      } catch (e) {
        if (alive) setState({ phase: "error", message: e instanceof Error ? e.message : "Ошибка" });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (state.phase === "loading") {
    return (
      <Screen>
        <div style={s.brand}>PlayUp</div>
        <p style={s.muted}>Открываем приложение…</p>
      </Screen>
    );
  }

  if (state.phase === "error") {
    return (
      <Screen>
        <div style={s.brand}>PlayUp</div>
        <h1 style={s.title}>Не получилось открыть приложение</h1>
        <p style={s.muted}>{state.message}. Попробуй зайти заново из Telegram.</p>
      </Screen>
    );
  }

  // ready — заглушка Главной (полноценная Главная и расписание появятся в Итерациях 1–2)
  return (
    <Screen>
      <div style={s.brand}>PlayUp</div>
      <h1 style={s.title}>
        Привет{state.user.telegram_username ? `, ${state.user.telegram_username}` : ""}
      </h1>
      <p style={s.muted}>
        Ты в клубе. {state.user.profile_completed ? "Профиль заполнен." : "Профиль заполним при первой записи."}
      </p>
      <div style={s.card}>
        <div style={s.cardTitle}>Скоро здесь</div>
        <p style={s.muted}>Расписание игр и запись появятся в следующих итерациях.</p>
      </div>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return <main style={s.screen}>{children}</main>;
}

const s: Record<string, React.CSSProperties> = {
  screen: {
    minHeight: "100vh",
    padding: "var(--space-7) var(--space-5)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-4)",
  },
  brand: { fontFamily: "var(--font-heading)", fontSize: 22, color: "var(--color-green-800)", fontWeight: 600 },
  title: { fontSize: "var(--font-size-h1)", margin: "var(--space-3) 0 0", lineHeight: 1.15 },
  muted: { color: "var(--color-graphite-600)", lineHeight: 1.6, margin: 0 },
  card: {
    marginTop: "var(--space-5)",
    background: "#fff",
    borderRadius: "var(--radius-xl)",
    boxShadow: "0 8px 24px rgba(31,35,32,0.06)",
    padding: "var(--space-6)",
  },
  cardTitle: { fontFamily: "var(--font-heading)", fontSize: 20, marginBottom: "var(--space-2)" },
};
