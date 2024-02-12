import { useCallback, useEffect, useState } from 'react';
import { useDeviceInfo } from './useDeviceInfo';

type useKeyPressedProps = {
  monitorModifierKeys?: boolean;
  onDeletePressed?: () => void;
  onEscapePressed?: () => void;
  onEnterPressed?: () => void;
  onTabPressed?: () => void;
  onArrowUpPressed?: () => void;
  onArrowDownPressed?: () => void;
  parentConTainerEl?: HTMLElement;
};

export const useKeyPressed = ({
  monitorModifierKeys = true,
  parentConTainerEl,
  onDeletePressed,
  onEscapePressed,
  onEnterPressed,
  onTabPressed,
  onArrowUpPressed,
  onArrowDownPressed,
}: useKeyPressedProps) => {
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

      if (onEnterPressed && keyEv.code === 'Enter') {
        onEnterPressed();
        keyEv.preventDefault();
      }
      if (onTabPressed && keyEv.code === 'Tab') {
        onTabPressed();
        keyEv.preventDefault();
      }

      if (onArrowUpPressed && keyEv.code === 'ArrowUp') {
        onArrowUpPressed();
      }
      if (onArrowDownPressed && keyEv.code === 'ArrowDown') {
        onArrowDownPressed();
      }

      if (onDeletePressed && keyEv.code === 'Delete') {
        onDeletePressed();
      }

      if (isMac && onDeletePressed && keyEv.code === 'Backspace') {
        onDeletePressed();
      }

      if (onEscapePressed && keyEv.code === 'Escape') {
        onEscapePressed();
      }

      if (monitorModifierKeys && (keyEv.ctrlKey || keyEv.metaKey)) {
        setIsModifierKeyPressed(true);
      }
      if (monitorModifierKeys && keyEv.shiftKey) {
        setIsShiftKeyPressed(true);
      }
    },
    [
      isMac,
      onDeletePressed,
      onEscapePressed,
      onEnterPressed,
      onArrowDownPressed,
      onArrowUpPressed,
      monitorModifierKeys,
      onTabPressed,
    ],
  );

  // keyup, reset the state
  const handleKeyUp = useCallback(() => {
    setIsModifierKeyPressed(false);
    setIsShiftKeyPressed(false);
  }, []);

  // keeping track of cmd/ctrl key press for UI action
  useEffect(() => {
    if (!parentConTainerEl) {
      document.body.addEventListener('keydown', handleKeydown);
      monitorModifierKeys && document.body.addEventListener('keyup', handleKeyUp);
    } else {
      parentConTainerEl.addEventListener('keydown', handleKeydown);
      monitorModifierKeys && parentConTainerEl.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      if (!parentConTainerEl) {
        document.body.removeEventListener('keydown', handleKeydown);
        monitorModifierKeys && document.body.removeEventListener('keyup', handleKeyUp);
      } else {
        parentConTainerEl.removeEventListener('keydown', handleKeydown);
        monitorModifierKeys && parentConTainerEl.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, [handleKeydown, handleKeyUp, monitorModifierKeys, parentConTainerEl]);

  return {
    isModifierKeyPressed,
    isShiftKeyPressed,
  };
};
