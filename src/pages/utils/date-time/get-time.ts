export const getTime = (date: number | Date) => {
  const parsedDate = date instanceof Date ? date : new Date(date);
  return parsedDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};
