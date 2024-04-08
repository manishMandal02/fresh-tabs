import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

const AutofocusPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.focus(null, { defaultSelection: 'rootEnd' });
  }, [editor]);

  return null;
};

export default AutofocusPlugin;
