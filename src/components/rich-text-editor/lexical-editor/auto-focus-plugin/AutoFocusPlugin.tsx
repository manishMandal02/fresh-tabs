import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_HIGH, FOCUS_COMMAND } from 'lexical';
import { useEffect } from 'react';

const AutofocusPlugin = () => {
  const [editor] = useLexicalComposerContext();

  // useLayoutEffect(() => {
  //   editor.focus();
  // });

  useEffect(() => {
    return editor.registerCommand(
      FOCUS_COMMAND,
      ev => {
        console.log('🚀 ~ useEffect ~ editor.registerCommand ~ ev:', ev);
        if (ev.relatedTarget) {
          console.log('🚀 ~ useEffect ~ ev.target:', ev.target);
          (ev.target as HTMLInputElement).focus();
          console.log('🚀 ~ useEffect ~ ev.relatedTarget:', ev.relatedTarget);

          // editor.blur();
          ev.stopImmediatePropagation();
          // ev.preventDefault();
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, []);

  return null;
};

export default AutofocusPlugin;
