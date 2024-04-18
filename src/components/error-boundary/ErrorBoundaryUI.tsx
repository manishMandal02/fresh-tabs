import type { FallbackProps } from 'react-error-boundary';
import { AlertModal } from '../modal';
const ErrorBoundaryUI = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <AlertModal title="Failed to load app" isOpen onClose={() => {}} showCloseBtn={false}>
      <div className="py-1 px-2 w-full max-w-[300px] flex flex-col">
        <p className="text-rose-500 opacity-90 text-center">Something went wrong</p>
        <pre className=" mt-px text-slate-500 text-wrap break-words text-center w-full">{error.message}</pre>
        <button
          onClick={resetErrorBoundary}
          className="mt-5  w-fit mx-auto text-slate-500 font-medium px-4 py-1 rounded border border-brand-darkBgAccent hover:border-slate-600 duration-200 transition-all">
          Try again
        </button>
      </div>
    </AlertModal>
  );
};

export default ErrorBoundaryUI;
