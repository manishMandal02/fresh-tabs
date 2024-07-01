// get site/domain cookie
export const getDomainCookies = async (domain: string) => {
  const domainCookies = await chrome.cookies.getAll({ domain });

  if (!domainCookies) throw new Error('no cookies found for domain:' + domain);

  return domainCookies;
};

function adjustCookieForSpecialNames(cookie: chrome.cookies.SetDetails) {
  if (cookie.name.startsWith('__Host-')) {
    delete cookie.domain;
  }
  return cookie;
}

// set cookies for domain
export const setDomainCookies = async (domain: string, cookies: chrome.cookies.Cookie[]) => {
  const setCookiesPromises = Object.values(cookies).map(async cookie => {
    // TODO - check if the cookies if already set for the domain (individual level)
    const cookieUrl = (cookie.secure ? 'https://' : 'http://') + cookie.domain.replace(/^\./, '');
    if (!cookie.sameSite) {
      console.log('cookie.sameSite:', cookie.sameSite);
      cookie.sameSite = 'no_restriction';
    }
    const origin_cookie: chrome.cookies.SetDetails = {
      url: cookieUrl,
      httpOnly: false,
      name: cookie.name,
      path: cookie.path,
      value: cookie.value,
      domain: cookie.domain,
      secure: cookie.secure,
      sameSite: 'strict',
      expirationDate: cookie.expirationDate,
    };

    const fixedCookie = adjustCookieForSpecialNames(origin_cookie);

    return chrome.cookies.set(fixedCookie);
  });

  await Promise.allSettled(setCookiesPromises);

  return true;
};

// clear cookie for domain
export const clearDomainCookies = async (domain: string) => {
  const cookiesToRemove = await chrome.cookies.getAll({ domain });

  if (!cookiesToRemove || cookiesToRemove.length < 1) throw new Error('no cookie found for domain:' + domain);

  const removeCookiePromises = cookiesToRemove.map(cookie => {
    const url = 'http' + (cookie.secure ? 's' : '') + '://' + domain;

    return chrome.cookies.remove({ url, name: cookie.name, storeId: cookie.storeId });
  });

  await Promise.allSettled(removeCookiePromises);

  return true;
};
