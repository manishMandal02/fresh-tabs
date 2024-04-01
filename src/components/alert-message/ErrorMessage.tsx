import { motion } from 'framer-motion';
import { useCustomAnimation } from '../../pages/sidepanel/hooks/useAnimation';

type Props = {
  msg: string;
};

const ErrorMessage = ({ msg }: Props) => {
  const { bounce } = useCustomAnimation();
  return (
    <>
      {msg ? (
        <motion.span
          {...bounce}
          className="test-[12px]  font-medium mx-auto mt-2 text-brand-darkBgAccent bg-red-400 px-4 py-1 w-fit text-center rounded">
          {msg}
        </motion.span>
      ) : null}
    </>
  );
};

export default ErrorMessage;
