import { Tooltip as ReactTooltip } from 'react-tooltip';

type Props = {
  label: string;
  children: React.ReactNode;
  delay?: number;
};

const Tooltip = ({ label, children, delay = 500 }: Props) => {
  return (
    <>
      <div
        className="group relative "
        id="tooltip-anchor-el"
        data-tooltip-delay-show={delay}
        data-tooltip-content={label}>
        {children}
      </div>
      {label ? (
        <ReactTooltip anchorSelect="#tooltip-anchor-el" className="!bg-slate-700 !text-slate-50 !rounded-sm" />
      ) : null}
    </>
  );
};

export default Tooltip;
