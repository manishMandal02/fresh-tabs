import { getFaviconURL } from '@root/src/utils/url';
import { motion } from 'framer-motion';
import { useCustomAnimation } from '../../../../hooks/useAnimation';

type Props = {
  tabURL: string;
  numSelectedTabs: number;
};

const CARD_SIZE = 35;

const TabDraggedOutsideActiveSpace = ({ tabURL, numSelectedTabs }: Props) => {
  const faviconImg = getFaviconURL(tabURL);

  // bounce div animation
  const { bounce } = useCustomAnimation();

  return (
    <div
      style={{
        // transform: `translateX(${mouseXOnDrag - CARD_SIZE + 10}px)`,
        width: CARD_SIZE + 5,
      }}>
      {numSelectedTabs > 1 ? (
        <span
          className={`h-[35px] w-[45px] rounded-md absolute -top-2 -left-2 text-[9px] z-30 flex items-center justify-center
                        font-bold bg-gradient-to-bl from-brand-darkBgAccent/70 to-brand-darkBg/70 text-slate-400`}>
          +{numSelectedTabs - 1}
        </span>
      ) : null}
      <motion.div
        {...bounce}
        className=" rounded-lg flex items-center justify-center bg-brand-darkBgAccent z-40"
        style={{
          height: CARD_SIZE,
          width: CARD_SIZE,
        }}>
        <img className="w-4 h-4 rounded-lg" src={faviconImg} alt="favicon" />
      </motion.div>
    </div>
  );
};

export default TabDraggedOutsideActiveSpace;
