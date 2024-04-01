import { ReactNode } from 'react';
import * as RadixForm from '@radix-ui/react-form';

type Props = {
  children: ReactNode;
};

const Form = ({ children }: Props) => {
  return <RadixForm.Root className="w-full">{children}</RadixForm.Root>;
};

export default Form;
