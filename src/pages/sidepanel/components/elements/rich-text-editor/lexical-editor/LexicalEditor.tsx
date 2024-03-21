import { TRANSFORMERS } from '@lexical/markdown';
import { isValidURL } from '@root/src/pages/utils/url';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';

import LineSeparatorPlugin from './seperator-line-plugin/SeparatorLinePlugin';
import { AutoLinkPlugin } from './auto-link-plugin/AutoLinkPlugin';

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
      <AutoLinkPlugin />
      <CheckListPlugin />
      <LineSeparatorPlugin />
      <HistoryPlugin />
      <OnChangePlugin
        ignoreHistoryMergeTagChange={false}
        onChange={state => props.onChange(JSON.stringify(state.toJSON()))}
      />
    </LexicalComposer>
  );
}

const Placeholder = () => <div className="absolute top-[1.125rem] left-[1.125rem] opacity-50">Note...</div>;
