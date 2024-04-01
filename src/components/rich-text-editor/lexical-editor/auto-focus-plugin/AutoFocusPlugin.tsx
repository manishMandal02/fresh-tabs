import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLayoutEffect } from 'react';

const AutofocusPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useLayoutEffect(() => {
    editor.focus();
  });

  return null;
};

export default AutofocusPlugin;
