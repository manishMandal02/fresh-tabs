import { formatNumTo2Digits } from '../formatNumTo2Digits';

export const prettifyDate = (date: Date | number) => {
  let newDate: Date;
  if (typeof date === 'number') {
    newDate = new Date(date);
  } else {
    newDate = date;
  }
  return `${newDate.toDateString()} <span style='font-weight: 700;opacity: 0.8;'>@</span> ${newDate.getHours()}:${formatNumTo2Digits(
    newDate.getMinutes(),
  )}`;
};
