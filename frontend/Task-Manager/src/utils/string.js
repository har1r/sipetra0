export const toTitle = (s = "") =>
  String(s)
    .split(/(\s+|_)/)
    .map((part) =>
      /^[\s_]+$/.test(part)
        ? part
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join("");

export const toUpper = (s = "") => String(s).toUpperCase();
