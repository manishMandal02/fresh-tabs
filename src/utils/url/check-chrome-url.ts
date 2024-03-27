export const isChromeUrl = (url: string) => {
  return url?.startsWith('chrome://') || url.includes('chromewebstore.google.com');
};
