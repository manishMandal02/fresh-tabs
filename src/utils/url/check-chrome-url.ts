export const isChromeUrl = (url: string) => {
  return (
    url?.startsWith('chrome://') ||
    url?.startsWith('devtools://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('https://developer.chrome.com/') ||
    url.includes('chromewebstore.google.com')
  );
};
