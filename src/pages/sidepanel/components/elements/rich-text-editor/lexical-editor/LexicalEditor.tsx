import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { isValidURL } from '@root/src/pages/utils/url';

import LineSeparatorPlugin from './seperator-line-plugin/SeparatorLinePlugin';

type LexicalEditorProps = {
  config: Parameters<typeof LexicalComposer>['0']['initialConfig'];
} & { onChange: (value: string) => void };

export function LexicalEditor(props: LexicalEditorProps) {
  return (
    <LexicalComposer initialConfig={props.config}>
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<Placeholder />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <MarkdownShortcutPlugin transformers={[...TRANSFORMERS]} />
      <ListPlugin />
      <LinkPlugin validateUrl={isValidURL} />
      <LineSeparatorPlugin />
      <OnChangePlugin
        ignoreHistoryMergeTagChange={false}
        onChange={state => props.onChange(JSON.stringify(state.toJSON()))}
      />
    </LexicalComposer>
  );
}

const Placeholder = () => {
  return <div className="absolute top-[1.125rem] left-[1.125rem] opacity-50">Start writing...</div>;
};

// const HORIZONTAL_RULE: ElementTransformer = {
//   dependencies: [HorizontalRuleNode],
//   export: (node: LexicalNode) => {
//     return $isHorizontalRuleNode(node) ? '***' : null;
//   },
//   // regExp: /^(---|\*\*\*|___)\s?$/,
//   regExp: /^(-){3}$/,
//   replace: (parentNode, _1, _2, isImport) => {
//     const line = $createHorizontalRuleNode();

//     if (isImport || parentNode.getNextSibling() != null) {
//       parentNode.replace(line);
//     } else {
//       parentNode.insertBefore(line);
//     }

//     line.selectNext();
//   },
//   type: 'element',
// };
