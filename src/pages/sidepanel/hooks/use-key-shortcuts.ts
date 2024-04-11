import { useCallback, useEffect, useState } from 'react';

type useMetaKeyPressedProps = {
  parentConTainerEl?: HTMLElement;
  isSidePanel?: boolean;
};

export const useMetaKeyPressed = ({ isSidePanel = true, parentConTainerEl = null }: useMetaKeyPressedProps) => {
  //  ctrl/cmd key press status
  const [isMetaKeyPressed, setIsMetaKeyPressed] = useState(false);

  // left shift key press status
  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false);

  // if cmd/ctrl key is pressed save to state
  const handleKeydown = useCallback(ev => {
    const keyEv = ev as KeyboardEvent;

    if (keyEv.ctrlKey || keyEv.metaKey) {
      setIsMetaKeyPressed(true);
    }
    if (keyEv.shiftKey) {
      setIsShiftKeyPressed(true);
    }
  }, []);

  // keyup, reset the state
  const handleKeyUp = useCallback(() => {
    setIsMetaKeyPressed(false);
    setIsShiftKeyPressed(false);
  }, []);

  // key press event listeners
  // for content script (command palette)
  useEffect(() => {
    const containerEl = isSidePanel ? window : parentConTainerEl;

    if (!containerEl) return;

    containerEl.addEventListener('keydown', handleKeydown);
    containerEl.addEventListener('keyup', handleKeyUp);

    return () => {
      containerEl.removeEventListener('keydown', handleKeydown);
      containerEl.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSidePanel, parentConTainerEl, handleKeydown, handleKeyUp]);

  return {
    isMetaKeyPressed,
    isShiftKeyPressed,
  };
};
