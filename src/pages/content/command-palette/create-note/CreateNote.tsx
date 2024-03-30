import { useState, useEffect } from 'react';

import RichTextEditor, {
  EDITOR_EMPTY_STATE,
} from '@root/src/pages/sidepanel/components/elements/rich-text-editor/RichTextEditor';

type Props = {
  userSelectedText: string;
  onClose?: () => void;
};

const CreateNote = ({ userSelectedText }: Props) => {
  // local state
  const [note, setNote] = useState('');

  useEffect(() => {
    setNote(EDITOR_EMPTY_STATE);
  }, [userSelectedText]);

  // TODO - add note text editor
  // TODO - create a note title
  // TODO - note remainder

  return note ? (
    <div className=" w-full max-h-[500px] h-fit bg-brand-darkBg rounded-lg cc-scroll-bar">
      {/* editor */}
      <RichTextEditor content={note} onChange={setNote} userSelectedText={userSelectedText} />
    </div>
  ) : (
    <></>
  );
};
export default CreateNote;
