export const getISODate = (date: Date | string | number) => {
  if (typeof date === 'string' || typeof date === 'number') {
    return new Date(date).toISOString().split('T')[0];
  }

  return date.toISOString().split('T')[0];
};
