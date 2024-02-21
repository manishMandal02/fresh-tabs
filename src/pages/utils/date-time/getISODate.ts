export const getISODate = (date: Date | string) => {
  if (typeof date !== 'string') {
    return date.toISOString().split('T')[0];
  }

  return new Date(date).toISOString().split('T')[0];
};
