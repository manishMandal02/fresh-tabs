import { useCallback, useEffect, useState } from 'react';

import { useDeviceInfo } from './useDeviceInfo';

type useKeyShortcutsProps = {
  monitorModifierKeys?: boolean;
  onDeletePressed?: () => void;
  onEscapePressed?: () => void;
  onEnterPressed?: () => void;
  onTabPressed?: () => void;
  onArrowUpPressed?: () => void;
  onArrowDownPressed?: () => void;
  parentConTainerEl?: HTMLElement;
};

export const useKeyShortcuts = ({
  monitorModifierKeys = true,
  parentConTainerEl = null,
  onDeletePressed,
  onEscapePressed,
  onEnterPressed,
  onTabPressed,
  onArrowUpPressed,
  onArrowDownPressed,
}: useKeyShortcutsProps) => {
  // TODO - keep track if the event listener is added already or not
  //  ctrl/cmd key press status
  const [isModifierKeyPressed, setIsModifierKeyPressed] = useState(false);
  // left shift key press status
  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false);

  // device details
  const { isMac } = useDeviceInfo();

  // if cmd/ctrl key is pressed save to state
  const handleKeydown = useCallback(
    ev => {
      const keyEv = ev as KeyboardEvent;

      console.log('🚀 ~ keyEv.code:', keyEv.metaKey);

      // console.log('🚀 ~ keyEv.code: pressed ✅', keyEv.code);

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

  // key press event listeners
  // for content script (command palette)
  useEffect(() => {
    if (parentConTainerEl) {
      parentConTainerEl.addEventListener('keydown', handleKeydown);
      monitorModifierKeys && parentConTainerEl.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      parentConTainerEl?.removeEventListener('keydown', handleKeydown);
      monitorModifierKeys && parentConTainerEl?.removeEventListener('keyup', handleKeyUp);
    };
  }, [parentConTainerEl, handleKeyUp, handleKeydown, monitorModifierKeys]);

  // side panel
  useEffect(() => {
    if (parentConTainerEl) return;
    document.body.addEventListener('keydown', handleKeydown);
    monitorModifierKeys && document.body.addEventListener('keyup', handleKeyUp);

    return () => {
      document.body.removeEventListener('keydown', handleKeydown);
      monitorModifierKeys && document.body.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isModifierKeyPressed,
    isShiftKeyPressed,
  };
};
