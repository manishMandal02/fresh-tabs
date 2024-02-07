import { useCallback, useEffect, useState } from 'react';
import { useDeviceInfo } from './useDeviceInfo';

type useKeyPressedProps = {
  onDeletePressed?: () => void;
  onEscapePressed?: () => void;
};

export const useKeyPressed = ({ onDeletePressed, onEscapePressed }: useKeyPressedProps) => {
  // local state - ctrl/cmd key press status
  const [isModifierKeyPressed, setIsModifierKeyPressed] = useState(false);
  // local state - left shift key press status
  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false);

  // device details
  const { isMac } = useDeviceInfo();

  // if cmd/ctrl key is pressed save to state
  const handleKeydown = useCallback(
    ev => {
      const keyEv = ev as KeyboardEvent;

      console.log('🚀 ~ useKeyPressed ~ keyEv:', keyEv);

      if (onDeletePressed && keyEv.code.toLowerCase() === 'delete') {
        onDeletePressed();
      }

      if (isMac && onDeletePressed && keyEv.code.toLowerCase() === 'backspace') {
        onDeletePressed();
      }

      if (onEscapePressed && keyEv.code.toLowerCase() === 'escape') {
        onEscapePressed();
      }

      if (keyEv.ctrlKey || keyEv.metaKey) {
        setIsModifierKeyPressed(true);
      }

      if (keyEv.shiftKey) {
        setIsShiftKeyPressed(true);
      }
    },
    [onDeletePressed, onEscapePressed, isMac],
  );

  // keyup, reset the state
  const handleKeyUp = useCallback(() => {
    setIsModifierKeyPressed(false);
    setIsShiftKeyPressed(false);
  }, []);

  // keeping track of cmd/ctrl key press for UI action
  useEffect(() => {
    document.body.addEventListener('keydown', handleKeydown);
    document.body.addEventListener('keyup', handleKeyUp);

    return () => {
      document.body.removeEventListener('keydown', handleKeydown);
      document.body.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeydown, handleKeyUp]);

  return {
    isModifierKeyPressed,
    isShiftKeyPressed,
  };
};
