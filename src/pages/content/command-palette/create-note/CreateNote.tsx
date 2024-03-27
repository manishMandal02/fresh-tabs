type Props = {
  note: string;
  setNote: (note: string) => void;
  userSelectedText: string;
};

const CreateNote = ({ note, setNote, userSelectedText }: Props) => {
  console.log('🚀 ~ CreateNote ~ userSelectedText:', userSelectedText);

  // TODO - add note text editor
  //   TODO - quote user selected text if any
  // TODO - create a note title
  // TODO - note remainder

  return <input type="text" value={note} onChange={e => setNote(e.target.value)} />;
};

export default CreateNote;
