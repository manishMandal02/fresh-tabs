// get domain (including subdomain) from url
export const getUrlDomain = (url: string) => {
  return new URL(url)?.hostname || '';
};

// remove www for domains
export const cleanDomainName = (domain: string) => {
  if (domain?.split('.')[0] !== 'www') return domain;

  return domain.replace('www.', '');
};
