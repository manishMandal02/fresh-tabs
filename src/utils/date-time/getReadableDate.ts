export const getReadableDate = (date: Date | string | number, showTime = false) => {
  if (typeof date === 'string' || typeof date === 'number') {
    return new Date(date).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...(showTime ? { minute: '2-digit', hour12: false, hour: '2-digit' } : {}),
    });
  }

  return date.toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(showTime ? { minute: '2-digit', hour12: false, hour: '2-digit' } : {}),
  });
};
