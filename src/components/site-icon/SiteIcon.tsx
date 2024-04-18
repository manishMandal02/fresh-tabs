import { GlobeIcon } from '@radix-ui/react-icons';
import { CSSClasses } from '@root/src/types/global.types';
import { cn } from '@root/src/utils/cn';
import { getAlternativeFaviconUrl, getFaviconURL } from '@root/src/utils/url';
import { ReactEventHandler } from 'react';

type Props = {
  siteURl: string;
  classes?: CSSClasses;
};

const SiteIcon = ({ siteURl, classes }: Props) => {
  // handle fallback image for favicon icons
  const handleImageLoadError: ReactEventHandler<HTMLImageElement> = ev => {
    ev.stopPropagation();
    ev.currentTarget.style.display = 'none';
    (ev.currentTarget.nextElementSibling as SVGAElement).style.display = 'block';
  };

  return (
    <>
      <img
        alt="icon"
        onError={handleImageLoadError}
        src={getFaviconURL(siteURl)}
        onLoad={async ev => {
          const res = await fetch(ev.currentTarget.src);

          if (res.ok) return;

          const alternateFaviconUrl = getAlternativeFaviconUrl(siteURl);
          if (ev.currentTarget?.src) {
            ev.currentTarget.src = alternateFaviconUrl;
          } else {
            // @ts-expect-error - target.src is an img element
            ev.target.src = alternateFaviconUrl;
          }
        }}
        className={cn(
          'size-[14px] mr-[6px] rounded-md border-[0.5px] border-slate-700 object-center object-scale-down ',
          { invert: siteURl.includes('github.com') },
          classes,
        )}
      />
      {/* show fallback icon */}
      <GlobeIcon className="hidden text-slate-400 scale-[0.9] mr-1.5" />
    </>
  );
};

export default SiteIcon;
