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

  console.log('🚀 ~ useKeyPressed ~ isMac:', isMac);

  // if cmd/ctrl key is pressed save to state
  const handleKeydown = useCallback(
    ev => {
      const keyEv = ev as KeyboardEvent;

      if (onDeletePressed && (keyEv.code.toLowerCase() === 'delete' || keyEv.code.toLowerCase() === 'backspace')) {
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
    [onDeletePressed, onEscapePressed],
  );

  // keyup, reset the state
  const handleKeyUp = useCallback(() => {
    setIsModifierKeyPressed(false);
    setIsShiftKeyPressed(false);
  }, []);

  // keeping track of cmd/ctrl key press for UI action
  useEffect(() => {
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeydown, handleKeyUp]);

  return {
    isModifierKeyPressed,
    isShiftKeyPressed,
  };
};
