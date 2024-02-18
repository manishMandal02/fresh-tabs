export const formatNumTo2Digits = (num: number) => {
  return num.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
};
