import { Form, Field, Label, Control as RadixControl } from '@radix-ui/react-form';
import { Control, FieldValues, UseFormRegisterReturn } from 'react-hook-form';

type Props = {
  name: string;
  label?: string;
  placeholder?: string;

  registerHook?: UseFormRegisterReturn<string>;
  control?: Control<FieldValues>;
  error?: string;
};

const TextField = ({ name, label, placeholder, registerHook, error }: Props) => {
  console.log('🚀 ~ TextField ~ errors:', error);

  return (
    <Form>
      <Field name={name} className="flex flex-col">
        <Label className={`text-[12px] ml-px mb-[3px] ${!error ? 'text-slate-400' : 'text-red-500'}`}>{label}</Label>

        <RadixControl asChild>
          <input
            type="text"
            placeholder={placeholder}
            className={`bg-brand-darkBgAccent/70 text-slate-300/90 text-[12px] px-2 py-1 border border-brand-darkBgAccent/60 
            focus:border-brand-darkBgAccent/90 outline-none rounded placeholder:text-slate-500`}
            {...registerHook}
          />
        </RadixControl>
      </Field>
    </Form>
  );
};

export default TextField;
