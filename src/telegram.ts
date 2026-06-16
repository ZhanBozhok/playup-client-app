// Достаёт Telegram init data. Внутри Telegram — из window.Telegram.WebApp.
// Локально (вне Telegram) — собирает dev init data из VITE_DEV_* переменных.

type TelegramWebApp = {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getInitData(): string {
  const wa = window.Telegram?.WebApp;
  if (wa?.initData && wa.initData.length > 0) {
    wa.ready?.();
    wa.expand?.();
    return wa.initData;
  }
  // dev-fallback: формируем init data с user, как ожидает backend в TELEGRAM_AUTH_DEV
  const id = import.meta.env.VITE_DEV_TELEGRAM_ID || "111111111";
  const username = import.meta.env.VITE_DEV_TELEGRAM_USERNAME || "dev_user";
  const user = encodeURIComponent(JSON.stringify({ id: Number(id), username }));
  return `user=${user}&auth_date=${Math.floor(Date.now() / 1000)}`;
}
