import { formatNumTo2Digits } from '../formatNumTo2Digits';

export const formatTime = (date: Date | number) => {
  let newDate: Date;
  if (typeof date === 'number') {
    newDate = new Date(date);
  } else {
    newDate = date;
  }
  return `${newDate.getHours()}:${formatNumTo2Digits(newDate.getMinutes())}`;
};
