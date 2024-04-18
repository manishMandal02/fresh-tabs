export const isChromeUrl = (url: string) => {
  return url?.startsWith('chrome://') || url?.startsWith('devtools://') || url.includes('chromewebstore.google.com');
};
