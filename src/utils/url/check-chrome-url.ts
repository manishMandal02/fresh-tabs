export const isChromeUrl = (url: string) => {
  return (
    url?.startsWith('chrome://') ||
    url?.startsWith('devtools://') ||
    url.startsWith('chrome-extension://') ||
    url.includes('chromewebstore.google.com')
  );
};
