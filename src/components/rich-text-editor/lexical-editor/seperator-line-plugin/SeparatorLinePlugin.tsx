import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { $getSelection, TextNode } from 'lexical';

const LineSeparatorPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  editor.registerNodeTransform(TextNode, textNode => {
    if (textNode.getTextContent() === '---') {
      const line = $createHorizontalRuleNode();

      textNode.remove();

      const selection = $getSelection();
      selection.insertNodes([line]);
    }
  });

  return null;
};

export default LineSeparatorPlugin;
