# playup-client-app

Клиентское приложение PlayUp — Telegram mini app (Vite + React).
Работает с общим backend из `playup-admin-app`.

Спецификация — в репозитории `playup-docs`. Эта кодовая база реализует
клиентскую часть **Итерации 0 (Фундамент)** из `26_build_roadmap.md`.

## Что готово в Итерации 0

- Экран запуска + Telegram auth loading (`16`): при открытии берёт init data
  (из `window.Telegram.WebApp` или dev-фолбэка), шлёт `POST /api/client/auth/telegram`,
  создаёт/находит User и показывает приветствие либо ошибку.
- Дизайн-токены из `25` (клиентская типографическая шкала).

## Требования

- Node 20+. Запущенный backend (`playup-admin-app`) на `http://localhost:3001`.

## Запуск

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:3000 (проксирует /api -> :3001)
```

Вне Telegram (в обычном браузере) используется dev-фолбэк: init data собирается из
`VITE_DEV_TELEGRAM_ID` / `VITE_DEV_TELEGRAM_USERNAME`. Backend должен быть запущен с
`TELEGRAM_AUTH_DEV=true`.

## Скрипты

- `npm run dev` — dev-сервер (порт 3000)
- `npm run build` — production-сборка
- `npm run typecheck` — проверка типов

## Дальше

Расписание, карточка события и запись появятся в Итерациях 1–2.
