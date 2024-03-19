import { z } from 'zod';
import { useAtom } from 'jotai';
import { ClipboardEventHandler } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';

import { snackbarAtom, activeSpaceAtom } from '@root/src/stores/app';
import { isValidURL } from '@root/src/pages/utils/url';
import { addNewNote } from '@root/src/services/chrome-storage/notes';
import { INote } from '@root/src/pages/types/global.types';
import { generateId } from '@root/src/pages/utils';
import { naturalLanguageToDate } from '@root/src/pages/utils/date-time/naturalLanguageToDate';

const domainWithSubdomainRegex = /^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,6}$/;

// remove www for domains
const cleanDomainName = (domain: string) => {
  if (domain?.split('.')[0] !== 'www') return domain;

  return domain.replace('www.', '');
};

type UseNewNoteProps = {
  remainder: string;
  note: string;
};

export const useNewNote = ({ remainder, note }: UseNewNoteProps) => {
  // global state
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);
  const [activeSpace] = useAtom(activeSpaceAtom);

  const domainSchema = z.object({
    domain: z
      .string()
      .trim()
      .refine(value => domainWithSubdomainRegex.test(value), {
        message: 'Enter a valid domain or sub domain',
      }),
  });

  type FormSchema = z.infer<typeof domainSchema>;

  const inputFrom = useForm<FormSchema>({
    mode: 'onTouched',
    resolver: zodResolver(domainSchema),
    defaultValues: { domain: '' },
  });

  const handleAddNote: SubmitHandler<FormSchema> = async (data, ev) => {
    ev.preventDefault();

    const newNote: INote = {
      id: generateId(),
      text: note,
      spaceId: activeSpace.id,
      createdAt: new Date().getTime(),
    };

    // add note remainder
    if (remainder) {
      const date = naturalLanguageToDate(remainder);
      if (date) {
        newNote.remainderAt = date;
      }
    }

    // add note domain
    if (data.domain) {
      newNote.domain = data.domain;
    }

    const res = await addNewNote(newNote);

    if (res) {
      setSnackbar({ show: true, msg: 'Note added', isSuccess: true });
    } else {
      // failed
      setSnackbar({ show: true, msg: 'Failed to add note', isSuccess: false });
    }
  };

  const handleOnPasteInDomainInput: ClipboardEventHandler<HTMLInputElement> = ev => {
    //TODO - check if pasted text is a sub domain

    // don't allow default paste value
    ev.preventDefault();

    const pastedText = ev.clipboardData.getData('text');
    // if yes - do nothing
    if (domainWithSubdomainRegex.test(pastedText)) {
      inputFrom.setValue('domain', cleanDomainName(pastedText));
      return;
    }

    // check if it's a url
    // mot a valid url
    if (!isValidURL(pastedText)) return;

    // valid url, extract domain including subdomain
    // paste to input field
    inputFrom.setValue('domain', cleanDomainName(new URL(pastedText).hostname));
  };
  return {
    inputFrom,
    handleAddNote,
    snackbar,
    handleOnPasteInDomainInput,
  };
};
