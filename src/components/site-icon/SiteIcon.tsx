import { GlobeIcon } from '@radix-ui/react-icons';
import { CSSClasses } from '@root/src/types/global.types';
import { cn } from '@root/src/utils/cn';
import { getAlternativeFaviconUrl, getFaviconURL, isChromeUrl, isValidURL } from '@root/src/utils/url';
import { ReactEventHandler } from 'react';

type Props = {
  siteURl?: string;
  faviconUrl?: string;
  classes?: CSSClasses;
};

const SiteIcon = ({ siteURl, faviconUrl, classes }: Props) => {
  // handle fallback image for favicon icons
  const handleImageLoadError: ReactEventHandler<HTMLImageElement> = ev => {
    ev.stopPropagation();
    ev.currentTarget.style.display = 'none';
    (ev.currentTarget.nextElementSibling as SVGAElement).style.display = 'block';
  };

  const handleImageLoad: ReactEventHandler<HTMLImageElement> = async ev => {
    if (!isValidURL(siteURl) || isChromeUrl(siteURl) || ev.currentTarget?.src.includes('faviconkit.com')) return;

    const res = await fetch(ev.currentTarget?.src);

    if (res.ok) return;

    const alternateFaviconUrl = getAlternativeFaviconUrl(siteURl);

    if (ev.currentTarget?.src) {
      ev.currentTarget.src = alternateFaviconUrl;
    } else {
      // @ts-expect-error - target.src is an img element
      ev.target.src = alternateFaviconUrl;
    }
  };

  return (
    <>
      <img
        alt="icon"
        onError={handleImageLoadError}
        src={faviconUrl ? faviconUrl : getFaviconURL(siteURl)}
        {...(!faviconUrl && { onLoad: handleImageLoad })}
        className={cn(
          'size-[14px] mr-[6px] rounded-md bg-brand-darkBgAccent/15 object-center object-scale-down',
          // { invert: siteURl.includes('github.com') },
          classes,
        )}
      />
      {/* show fallback icon */}
      <GlobeIcon className="hidden text-slate-400 scale-[0.9] mr-1.5" />
    </>
  );
};

export default SiteIcon;
