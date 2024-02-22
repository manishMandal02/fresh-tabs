// get domain (including subdomain) from url
export const getUrlDomain = (url: string) => {
  return new URL(url).hostname;
};
