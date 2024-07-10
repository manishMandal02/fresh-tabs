import { parseDate, parse } from 'chrono-node';

// convert natural language date string to date object
export const naturalLanguageToDate = (dateString: string) => {
  const formattedDateString = dateString.replace('@', 'at');

  const parsedData = parseDate(formattedDateString, null, {
    forwardDate: true,
  });

  return parsedData?.getTime() || null;
};

// get date/time text hint string from a give string
export const parseStringForDateTimeHint = (note: string) => {
  const parsedData = parse(note.replace(' @ ', ' at '), { instant: new Date() }, { forwardDate: true });

  if (!parsedData || parsedData.length < 1) return null;

  const lastOccurrence = parsedData.pop();

  const dateString = lastOccurrence.text;

  return { date: lastOccurrence.start.date(), dateString };
};
