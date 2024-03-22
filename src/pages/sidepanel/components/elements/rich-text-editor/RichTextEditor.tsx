import { CodeNode } from '@lexical/code';
import { ListNode, ListItemNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { LexicalEditor } from './lexical-editor/LexicalEditor';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';

const EDITOR_NODES = [
  CodeNode,
  HeadingNode,
  AutoLinkNode,
  LinkNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  HorizontalRuleNode,
];

const EmptyEditorState =
  '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';

type Props = {
  content: string;
  onChange: (content: string) => void;
};

const RichTextEditor = ({ content, onChange }: Props) => {
  console.log('🚀 ~ RichTextEditor ~ content:', content);

  // const editorStateRef = useRef('');

  return (
    <div
      id="editor-wrapper"
      className={`relative prose prose-p:leading-[1.55rem] prose-a:text-slate-300/80 !caret-slate-200 prose-li:my-px prose-li:leading-[1.5rem] prose-ul:my-1 prose-hr:my-3 prose-hr:border-[1.1px] prose-hr:border-slate-700/80 prose-p:my-0 prose-headings:mb-3 prose-headings:mt-2
                prose-blockquote:text-slate-400 text-slate-300/90  prose-headings:text-slate-300/80 `}>
      <LexicalEditor
        onChange={onChange}
        config={{
          namespace: 'note-editor',
          nodes: EDITOR_NODES,
          editorState: content || EmptyEditorState,
          theme: {
            root: 'px-4 py-2 border-transparent bg-brand-darkBgAccent/20 border-2 rounded-md h-full min-h-[18rem] max-h-[30rem] focus:outline-none focus-within:border-brand-darkBgAccent',
            link: 'cursor-pointer',
            text: {
              bold: 'font-semibold',
              underline: 'underline',
              italic: 'italic',
              strikethrough: 'line-through',
              underlineStrikethrough: 'underlined-line-through',
            },
            list: {
              listitemChecked: 'rich-text-editor__listItemChecked',
              listitemUnchecked: 'rich-text-editor__listItemUnchecked',
            },
          },
          onError: error => {
            console.log('🚀 ~ RichTextEditor ~ error:', error);
          },
        }}
      />
    </div>
  );
};

export default RichTextEditor;
