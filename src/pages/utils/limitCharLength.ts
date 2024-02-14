// show ... for longer string
const limitCharLength = (str: string, length = 32) => {
  if (str.length > length) {
    return str.substring(0, length) + '...';
  } else {
    return str;
  }
};

export { limitCharLength };
