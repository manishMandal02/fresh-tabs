import { Tooltip as ReactTooltip } from 'react-tooltip';

type Props = {
  label: string;
  children: React.ReactNode;
};

const Tooltip = ({ label, children }: Props) => {
  return (
    <>
      <span
        className="group inline-block relative "
        id="tooltip-anchor-el"
        data-tooltip-delay-show={500}
        data-tooltip-content={label}>
        {children}
      </span>
      <ReactTooltip anchorSelect="#tooltip-anchor-el" className="!bg-slate-700 !text-slate-50 !rounded-sm" />
    </>
  );
};

export default Tooltip;
