export const getReadableDate = (date: Date | string | number) => {
  if (typeof date === 'string' || typeof date === 'number') {
    return new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
};
