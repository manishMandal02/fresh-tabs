import { Cross1Icon } from '@radix-ui/react-icons';

type Props = {
  onClose: () => void;
  title: string;
  body: string;
};

const ReadingMode = ({ title, body, onClose }: Props) => {
  // animate to slide up
  return (
    <div className="fixed w-full h-full bg-brand-darkBg flex items-center justify-center overflow-y-auto cc-scrollbar ">
      {/* controls */}
      <div className="absolute top-3 right-4">
        <button
          onClick={onClose}
          className="border border-slate-500/80 rounded px-2 py-1.5 group hover:border-slate-500 transition-colors duration-200">
          <Cross1Icon className="text-slate-500/80 scale-150 stroke-2 group-hover:text-slate-500 transition-colors duration-200" />
        </button>
      </div>
      {/* content */}
      <main className="h-full w-[65%] max-w-[70%]   flex flex-col items-center justify-start py-4">
        {/* title */}
        <h1 className="text-slate-300/80 text-[20px] font-light tracking-wide py-2">{title}</h1>
        {/* body */}
        <section className="text-slate-300/90 py-4" dangerouslySetInnerHTML={{ __html: body }}></section>
      </main>
    </div>
  );
};

export default ReadingMode;
