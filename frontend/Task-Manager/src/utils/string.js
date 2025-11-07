export const toTitle = (s = "") =>
  String(s)
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export const toUpper = (text = "") => String(text).toUpperCase();

export const toNumber = (value) => (Number.isFinite(+value) ? +value : 0);
