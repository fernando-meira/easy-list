export const convertToCurrency = (value: number | string) => {
  const parsedValue = typeof value === "string" ? parseFloat(value.replace(",", ".")) : value;

  const convertedValue = Number(parsedValue);

  if (!convertedValue || isNaN(convertedValue)) {
    return "Valor inválido";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(convertedValue);
};
