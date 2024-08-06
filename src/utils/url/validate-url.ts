// check if a string is a valid url
export const isValidURL = (url: string) => {
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.includes('chromewebstore.google.com')
  ) {
    return true;
  }

  return false;
};
