import { GlobeIcon } from '@radix-ui/react-icons';
import { CSSClasses } from '@root/src/types/global.types';
import { cn } from '@root/src/utils/cn';
import { getFaviconURL } from '@root/src/utils/url';
import { ReactEventHandler } from 'react';

type Props = {
  siteURl: string;
  classes?: CSSClasses;
};

const getSrcUrl = (url: string) => {
  return getFaviconURL(url);
};

const SiteIcon = ({ siteURl, classes }: Props) => {
  // handle fallback image for favicon icons
  const handleImageLoadError: ReactEventHandler<HTMLImageElement> = ev => {
    ev.stopPropagation();
    // ev.currentTarget.src = FALLBACK_ICON;
    ev.currentTarget.style.display = 'none';
    (ev.currentTarget.nextElementSibling as SVGAElement).style.display = 'block';
  };

  return (
    <>
      <img
        alt="icon"
        onError={handleImageLoadError}
        src={getSrcUrl(siteURl)}
        className={cn(
          'size-[14px] mr-[6px] rounded-md border-[0.5px] border-slate-700 object-center object-scale-down',
          classes,
        )}
      />
      {/* show fallback icon */}
      <GlobeIcon className="hidden text-slate-400 scale-[0.9]" />
    </>
  );
};

export default SiteIcon;
