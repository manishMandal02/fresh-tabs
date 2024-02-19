const rangeFormats = {
  seconds: { short: 's', medium: 'sec', long: 'second' },
  minutes: { short: 'm', medium: 'min', long: 'minute' },
  hours: { short: 'h', medium: 'hr', long: 'hour' },
  days: { short: 'd', medium: 'day', long: 'day' },
  weeks: { short: 'w', medium: 'wk', long: 'week' },
  months: { short: 'm', medium: 'mon', long: 'month' },
  years: { short: 'y', medium: 'yr', long: 'year' },
};

// convert time stamp to time ago string
export const getTimeAgo = (timestamp: number, format: 'medium' | 'short' | 'long' = 'medium') => {
  const now = new Date().getTime();
  const tsDiff = now / 1000 - timestamp;
  const seconds = Math.floor(tsDiff);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds <= 0) {
    return 'now';
  }

  const times = {
    years,
    months,
    weeks,
    days,
    hours,
    minutes,
    seconds,
  };
  const key = Object.keys(times).find(item => times[item] > 0) || 'seconds';
  const amount = times[key];
  const isShort = format === 'short';
  const plural = amount > 1 && !isShort ? 's' : '';
  const wording = rangeFormats[key][format];
  return `${amount}${isShort ? '' : ' '}${wording}${plural} ago`;
};
