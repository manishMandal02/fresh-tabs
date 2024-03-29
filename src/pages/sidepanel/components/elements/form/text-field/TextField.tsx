import { motion } from 'framer-motion';
import { Form, Field, Label, Control as RadixControl } from '@radix-ui/react-form';
import { Control, FieldValues, UseFormRegisterReturn } from 'react-hook-form';
import { useCustomAnimation } from '@root/src/pages/sidepanel/hooks/useAnimation';
import { ClipboardEventHandler } from 'react';

type Props = {
  name: string;
  label?: string;
  placeholder?: string;
  registerHook?: UseFormRegisterReturn<string>;
  control?: Control<FieldValues>;
  error?: string;
  onPasteHandler?: ClipboardEventHandler<HTMLInputElement>;
};

const TextField = ({ name, label, placeholder, registerHook, error, onPasteHandler }: Props) => {
  console.log('🚀 ~ TextField ~ errors:', error);

  const { bounce } = useCustomAnimation();

  return (
    <Form>
      <Field name={name} className="flex flex-col">
        {label ? (
          <Label className={`text-[12.5px] ml-px mb-[3px] ${!error ? 'text-slate-400/90' : 'text-rose-600'}`}>
            {label}
          </Label>
        ) : null}

        <RadixControl asChild>
          <input
            {...(registerHook ? { ...registerHook } : {})}
            onPaste={onPasteHandler ? onPasteHandler : null}
            onKeyDown={ev => {
              if (ev.code !== 'Enter') return;
              ev.preventDefault();
            }}
            type="text"
            placeholder={placeholder}
            className={`bg-brand-darkBgAccent/40 text-slate-300/80 text-[14px] px-2 py-1 border border-transparent
            focus-within:border-brand-darkBgAccent/90 outline-none rounded placeholder:text-slate-500 ${
              error ? 'bg-rose-400/10 border-rose-400/40' : ''
            }`}
          />
        </RadixControl>
        {error ? (
          <motion.span {...bounce} className="ml-1 mt-1 text-red-400 font-medium text-[9px]">
            {error}
          </motion.span>
        ) : null}
      </Field>
    </Form>
  );
};

export default TextField;
