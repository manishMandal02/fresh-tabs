export const getFaviconURL = (siteURL: string) => {
  const url = new URL(siteURL);
  return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=${32}
  `;
};
