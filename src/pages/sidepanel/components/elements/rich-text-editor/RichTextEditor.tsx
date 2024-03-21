import { LexicalEditor } from './lexical-editor/LexicalEditor';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { CodeNode } from '@lexical/code';

const EDITOR_NODES = [CodeNode, HeadingNode, AutoLinkNode, LinkNode, ListNode, ListItemNode, QuoteNode];

type Props = {
  content: string;
};

const RichTextEditor = ({ content }: Props) => {
  return (
    <div
      id="editor-wrapper"
      className={
        'relative prose  prose-blockquote:text-slate-400 text-slate-300 prose-p:my-0 prose-headings:text-slate-400 prose-headings:mb-4 prose-headings:mt-2'
      }>
      <LexicalEditor
        config={{
          namespace: 'note-editor',
          nodes: EDITOR_NODES,
          editorState: content,
          theme: {
            root: 'p-4 border-slate-500 border-2 rounded h-full min-h-[200px] focus:outline-none focus-visible:border-black',
            link: 'cursor-pointer',
            text: {
              bold: 'font-semibold',
              underline: 'underline',
              italic: 'italic',
              strikethrough: 'line-through',
              underlineStrikethrough: 'underlined-line-through',
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
