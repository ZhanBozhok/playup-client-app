const BASE = import.meta.env.VITE_API_BASE_URL || "";

export type ClientUser = {
  id: string;
  telegram_username: string | null;
  profile_completed: boolean;
};

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
