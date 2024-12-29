export const formatCurrency = (amount: number, currency: string = 'BRL', locale: string = 'pt-BR'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};
