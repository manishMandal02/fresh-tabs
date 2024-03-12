import { parseDate } from 'chrono-node';

// convert natural language date string to date object
export const naturalLanguageToDate = (dateString: string) => {
  const formattedDateString = dateString.replace('@', 'at');
  const parsedData = parseDate(formattedDateString, null, {
    forwardDate: true,
  });

  return parsedData?.getTime() || null;
};
