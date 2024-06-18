import { z } from 'zod';
import { useAtom, useAtomValue } from 'jotai';
import { ClipboardEventHandler } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';

import { generateId, omitObjProps } from '@root/src/utils';
import { isValidURL } from '@root/src/utils/url';
import { INote } from '@root/src/types/global.types';
import { snackbarAtom, activeSpaceAtom } from '@root/src/stores/app';
import { addNewNote, updateNote } from '@root/src/services/chrome-storage/notes';
import { cleanDomainName, getUrlDomain } from '@root/src/utils/url/get-url-domain';
import { naturalLanguageToDate } from '@root/src/utils/date-time/naturalLanguageToDate';

const domainWithSubdomainRegex = /^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,10}$/;

type UseNewNoteProps = {
  remainder: string;
  note: string;
  noteId: string;
  handleClose: () => void;
};

export const useNewNote = ({ remainder, note, noteId, handleClose }: UseNewNoteProps) => {
  // global state
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  const activeSpace = useAtomValue(activeSpaceAtom);

  const formSchema = z.object({
    domain: z
      .string()
      .trim()
      .refine(value => domainWithSubdomainRegex.test(value), {
        message: 'Enter a valid domain or sub domain',
      }),
    title: z.string().trim().min(4, {
      message: 'Title must be at least 4 characters',
    }),
  });

  type FormSchema = z.infer<typeof formSchema>;

  // react hook hook init
  const inputFrom = useForm<FormSchema>({
    mode: 'onTouched',
    resolver: zodResolver(formSchema),
    defaultValues: { domain: '', title: '' },
  });

  const handleOnPasteInDomainInput: ClipboardEventHandler<HTMLInputElement> = ev => {
    // check if pasted text is a sub domain

    // don't allow default paste value
    ev.preventDefault();

    const pastedText = ev.clipboardData.getData('text');
    // if yes - do nothing
    if (domainWithSubdomainRegex.test(pastedText)) {
      inputFrom.setValue('domain', cleanDomainName(pastedText));
      return;
    }

    // not a valid url
    if (!isValidURL(pastedText)) return;

    // valid url, extract domain including subdomain and paste to input field
    inputFrom.setValue('domain', cleanDomainName(getUrlDomain(pastedText)));
  };

  const handleAddNote: SubmitHandler<FormSchema> = async (data, ev) => {
    ev.preventDefault();

    const noteObj: INote = {
      id: generateId(),
      text: note,
      spaceId: activeSpace.id,
      title: data.title.trim(),
      createdAt: new Date().getTime(),
    };

    // add note remainder
    if (remainder) {
      const date = naturalLanguageToDate(remainder);
      if (date) {
        noteObj.remainderAt = date;
      }
    }

    // add note domain
    if (data.domain) {
      noteObj.domain = data.domain.trim();
    }

    let res = false;
    if (!noteId) {
      res = await addNewNote(noteObj);
    } else {
      res = await updateNote(noteId, omitObjProps(noteObj, 'createdAt'));
    }
    if (res) {
      setSnackbar({ show: true, msg: `Note ${noteId ? 'updated' : 'added'}`, isSuccess: true });
      handleClose();
    } else {
      // failed
      setSnackbar({ show: true, msg: `Failed to ${noteId ? 'update' : 'add'} note`, isSuccess: false });
    }
  };

  return {
    inputFrom,
    handleAddNote,
    snackbar,
    handleOnPasteInDomainInput,
  };
};
