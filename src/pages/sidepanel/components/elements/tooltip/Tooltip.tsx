import { generateId } from '@root/src/pages/utils/generateId';
import { Tooltip as ReactTooltip } from 'react-tooltip';

type Props = {
  label: string;
  children: React.ReactNode;
  delay?: number;
};

const Tooltip = ({ label, children, delay = 1500 }: Props) => {
  const tooltipId = generateId();
  return (
    <>
      {label ? (
        <>
          <div className="relative " data-tooltip data-tooltip-id={tooltipId} data-tooltip-delay-show={delay}>
            {children}
          </div>
          <ReactTooltip
            id={tooltipId}
            className="!bg-brand-darkBgAccent !z-[1000] !text-[13px] !text-slate-100 !rounded">
            {label}
          </ReactTooltip>
        </>
      ) : null}
    </>
  );
};

export default Tooltip;
