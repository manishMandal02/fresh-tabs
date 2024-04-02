import { CSSProperties, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAnimate } from 'framer-motion';
import { wait } from '@root/src/utils';
import { CheckCircledIcon } from '@radix-ui/react-icons';

type Props = {
  title: string;
};

const containerStyles: CSSProperties = {
  position: 'fixed',
  top: '-50px',
  left: '48%',
  zIndex: 2147483647,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  letterSpacing: '0.45px',
  fontWeight: 300,
  height: '40px',
  width: '40px',
  color: '#d3d3d3',
  borderRadius: '100%',
  backgroundColor: '#191919',
  border: '1.5px solid #7878784e',
  boxShadow: '#6262883f 0px 2px 5px -1px, #7070704c 0px 1px 3px -1px;',
};

const textStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  opacity: 0,
};

const SnackbarContentScript = ({ title }: Props) => {
  const [scope, animate] = useAnimate();

  const animateSnackbar = async () => {
    // wait 0.1s
    // await wait(100);
    //  round div drop
    animate(scope.current, { y: '60px' }, { duration: 0.1, type: 'spring', damping: 20, stiffness: 80 });
    // expand width
    animate(
      scope.current,
      { width: '170px', borderRadius: '20px', x: '-50px' },
      { delay: 0.1, duration: 0.1, type: 'spring', damping: 16, stiffness: 80 },
    );

    // show text
    animate('span', { opacity: 1 }, { delay: 0.35, duration: 0.3, type: 'spring' });

    // wait 2.5s
    await wait(3000);

    // collapse to width to make round again
    animate(
      scope.current,
      { width: '40px', borderRadius: '28px', x: '0px' },
      { duration: 0.4, type: 'spring', damping: 16, stiffness: 50 },
    );

    // hide text
    animate('span', { opacity: 0 }, { duration: 0.35, type: 'spring' });

    // move out of the screen
    animate(scope.current, { y: '-50px' }, { delay: 0.05, duration: 0.6, type: 'spring', damping: 18, stiffness: 50 });
  };

  useEffect(() => {
    animateSnackbar();
  }, []);

  return title ? (
    createPortal(
      <div style={containerStyles} ref={scope}>
        <span style={textStyles}>
          <CheckCircledIcon style={{ color: '#dedede9f', marginRight: '6px', scale: '1.1' }} />
          {title}
        </span>
      </div>,
      document.body,
    )
  ) : (
    <></>
  );
};

export default SnackbarContentScript;
