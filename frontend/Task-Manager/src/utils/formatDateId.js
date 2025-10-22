export const formatDateId = (value, { withWeekday = false } = {}) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  const options = {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
    ...(withWeekday ? { weekday: "long" } : {}),
  };
  return new Intl.DateTimeFormat("id-ID", options).format(date);
}
