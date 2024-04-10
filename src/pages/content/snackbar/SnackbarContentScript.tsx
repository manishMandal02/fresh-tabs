import { CSSProperties, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { CheckCircledIcon } from '@radix-ui/react-icons';
import { useCustomAnimation } from '../../sidepanel/hooks/useCustomAnimation';
import { ContentScriptContainerIds } from '@root/src/constants/app';
import { wait } from '@root/src/utils';

type Props = {
  title: string;
};

const containerStyles: CSSProperties = {
  position: 'fixed',
  top: '28px',
  left: '45.5%',
  zIndex: 2147483647,
  display: 'flex',
  padding: '2px 10px',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  letterSpacing: '0.45px',
  fontWeight: 300,
  height: '40px',
  width: 'fit-content',
  color: '#d3d3d3',
  borderRadius: '8px',
  backgroundColor: '#191919',
  border: '1.5px solid #7878784e',
  boxShadow: '#6262883f 0px 2px 5px -1px, #7070704c 0px 1px 3px -1px;',
};

const textStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const SnackbarContentScript = ({ title }: Props) => {
  const handleRemoveSnackbar = () => {
    // outer container (react root)
    const snackbarContainer = document.getElementById(ContentScriptContainerIds.SNACKBAR);
    // inner wrapper
    const snackbarWrapper = document.getElementById(ContentScriptContainerIds.SNACKBAR + '-wrapper');
    if (!snackbarContainer || !snackbarWrapper) return;
    // remove children
    snackbarContainer?.replaceChildren();
    snackbarWrapper?.replaceChildren();
    // remove main container
    snackbarContainer?.remove();
    snackbarWrapper?.remove();
  };

  useEffect(() => {
    setTimeout(async () => {
      const snackbarWrapper = document.getElementById(ContentScriptContainerIds.SNACKBAR + '-wrapper');
      if (snackbarWrapper) {
        snackbarWrapper.style.transitionDuration = '500ms';
        snackbarWrapper.style.transitionProperty = 'all';
        snackbarWrapper.style.transform = 'scale(0)';
        snackbarWrapper.style.opacity = '0';
      }
      await wait(400);
      handleRemoveSnackbar();
    }, 3000);
  }, []);

  const { bounce } = useCustomAnimation();

  return title ? (
    createPortal(
      <motion.div {...bounce} style={containerStyles} id={ContentScriptContainerIds.SNACKBAR + '-wrapper'}>
        <span style={textStyles}>
          <CheckCircledIcon style={{ color: '#dedede9f', marginRight: '6px', scale: '1.1' }} />
          {title}
        </span>
      </motion.div>,
      document.body,
    )
  ) : (
    <></>
  );
};

export default SnackbarContentScript;
