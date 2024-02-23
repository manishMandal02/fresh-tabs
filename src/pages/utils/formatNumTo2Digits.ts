export const formatNumTo2Digits = (num: number, minimumDigits = 2) => {
  return num.toLocaleString('en-US', {
    minimumIntegerDigits: minimumDigits,
    useGrouping: false,
  });
};
