export const getWeekday = (date: Date) => {
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return weekday[date.getDay()];
};
