// check if a string is a valid url
export const isValidURL = (url: string) => {
  try {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('chrome://')) return true;
    return false;
  } catch (error) {
    return false;
  }
};
