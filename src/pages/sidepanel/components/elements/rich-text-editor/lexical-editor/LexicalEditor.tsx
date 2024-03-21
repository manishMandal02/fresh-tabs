import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';

import { TRANSFORMERS } from '@lexical/markdown';

import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { isValidURL } from '@root/src/pages/utils/url';

type LexicalEditorProps = {
  config: Parameters<typeof LexicalComposer>['0']['initialConfig'];
};

export function LexicalEditor(props: LexicalEditorProps) {
  return (
    <LexicalComposer initialConfig={props.config}>
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<Placeholder />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <ListPlugin />
      <LinkPlugin validateUrl={isValidURL} />
    </LexicalComposer>
  );
}

const Placeholder = () => {
  return <div className="absolute top-[1.125rem] left-[1.125rem] opacity-50">Start writing...</div>;
};
