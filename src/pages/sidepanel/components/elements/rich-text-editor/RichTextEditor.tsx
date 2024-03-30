import { CodeNode } from '@lexical/code';
import { ListNode, ListItemNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { $createQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text';
import { LexicalEditor } from './lexical-editor/LexicalEditor';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { logger } from '@root/src/utils';
import { $createLineBreakNode, $createParagraphNode, $createTextNode, $getRoot } from 'lexical';

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

type Props = {
  content: string;
  onChange: (content: string) => void;
  userSelectedText?: string;
};

export const EDITOR_EMPTY_STATE =
  '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';

const RichTextEditor = ({ content, onChange, userSelectedText }: Props) => {
  return (
    <div
      id="editor-wrapper"
      className={`relative prose min-w-full  prose-p:leading-[1.55rem] prose-a:text-slate-300/80 !caret-slate-200 prose-code:text-slate-400 prose-li:my-px prose-li:leading-[1.5rem] prose-ul:my-1 prose-hr:my-3 prose-hr:border-[1.1px] prose-hr:border-slate-700/80 prose-p:my-0 prose-headings:my-1
                prose-blockquote:text-slate-400 prose-blockquote:my-[10px] text-slate-300/90  prose-headings:text-slate-300/80 prose-strong:!text-slate-300/80 prose-strong:!font-extrabold`}>
      <LexicalEditor
        onChange={onChange}
        config={{
          namespace: 'note-editor',
          nodes: EDITOR_NODES,
          editorState: !userSelectedText
            ? content
            : () => {
                const root = $getRoot();

                const quote = $createQuoteNode();
                const quoteParagraphs = userSelectedText.trim().split('\n');
                quoteParagraphs.forEach((para, idx) => {
                  const textNode = $createTextNode(para);
                  quote.append(textNode);
                  if (quoteParagraphs.length > 1 && idx !== quoteParagraphs.length - 1) {
                    quote.append($createLineBreakNode());
                  }
                });

                root.append(quote);

                const para = $createParagraphNode();

                para.append($createTextNode(''));

                root.append(para);

                root.selectEnd();
              },

          theme: {
            root: 'px-4 py-2 border-transparent bg-brand-darkBgAccent/20 border-2 cc-scrollbar overflow-y-auto  rounded-md w-full min-h-[16rem] h-fit max-h-[26rem] focus:outline-none focus-within:border-brand-darkBgAccent',
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
            logger.error({
              error,
              msg: 'LexicalEditor component onError callback',
              fileTrace: 'sidepanel/components/elements/rich-text-editor/RichTextEditor',
            });
          },
        }}
      />
    </div>
  );
};

export default RichTextEditor;
