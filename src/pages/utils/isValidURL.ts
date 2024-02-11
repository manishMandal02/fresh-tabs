// check if a string is a valid url
export const isValidURL = (url: string) => {
  try {
    return Boolean(new URL(url));
  } catch (error) {
    return false;
  }
};
