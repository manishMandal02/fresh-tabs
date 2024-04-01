import { isValidURL } from '@root/src/utils/url';
import { $createTextNode, type LexicalNode } from 'lexical';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { type ElementTransformer, TRANSFORMERS } from '@lexical/markdown';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { $createListItemNode, $createListNode, $isListNode, ListNode } from '@lexical/list';

import AutofocusPlugin from './auto-focus-plugin/AutoFocusPlugin';
import { AutoLinkPlugin } from './auto-link-plugin/AutoLinkPlugin';
import LineSeparatorPlugin from './seperator-line-plugin/SeparatorLinePlugin';

type LexicalEditorProps = {
  config: Parameters<typeof LexicalComposer>['0']['initialConfig'];
} & { onChange: (value: string) => void };

export function LexicalEditor({ config, onChange }: LexicalEditorProps) {
  return (
    <LexicalComposer initialConfig={config}>
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<Placeholder />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <AutofocusPlugin />
      <HistoryPlugin />
      <ListPlugin />
      <CheckListPlugin />
      <LineSeparatorPlugin />
      <AutoLinkPlugin />
      <LinkPlugin validateUrl={isValidURL} />
      <MarkdownShortcutPlugin transformers={[...TRANSFORMERS, CHECKLIST_RULE]} />
      <OnChangePlugin
        ignoreHistoryMergeTagChange={false}
        onChange={state => {
          onChange(JSON.stringify(state.toJSON()));
        }}
      />
    </LexicalComposer>
  );
}

const Placeholder = () => <div className="absolute top-[0.5rem] left-[1.15rem] opacity-50">Note...</div>;

const CHECKLIST_RULE: ElementTransformer = {
  dependencies: [ListNode],
  export: (node: LexicalNode) => {
    return $isListNode(node) ? '[]' : null;
  },
  // regExp: /^(---|\*\*\*|___)\s?$/,
  regExp: /\[([x ])?\](.+?)(?=\n|$)/g,
  replace: parentNode => {
    const checkList = $createListNode('check');
    checkList.append($createListItemNode().append($createTextNode(``)));

    parentNode.replace(checkList);
    checkList.selectEnd();
  },

  type: 'element',
};
