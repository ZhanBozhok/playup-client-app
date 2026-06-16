// Форматирование дат/времени для отображения. Тайзмона Europe/Belgrade (24).
const TZ = "Europe/Belgrade";

export const fmtDate = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: TZ,
});
export const fmtTime = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

export function activityLabel(a: string): string {
  const map: Record<string, string> = {
    football: "Футбол",
    padel: "Падел",
    run: "Бег",
    yoga: "Йога",
    recovery: "Восстановление",
    social: "Встреча",
    other: "Другое",
  };
  return map[a] ?? a;
}

export function spotsLabel(spotsLeft: number): string {
  if (spotsLeft === 0) return "Мест нет";
  if (spotsLeft <= 2) return `Осталось ${spotsLeft} ${spotsLeft === 1 ? "место" : "места"}`;
  return `Свободно ${spotsLeft}`;
}
