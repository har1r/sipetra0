export const validateEmail = (email) => {
  if (typeof email !== "string") return false;

  const regex =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return regex.test(email.trim());
};

export const addThousandSeparator = (num) => {
  const number = Number(num);
  if (isNaN(number)) return "";

  return new Intl.NumberFormat("id-ID").format(number);
};