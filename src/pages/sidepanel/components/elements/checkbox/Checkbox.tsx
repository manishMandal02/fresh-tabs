import { CheckIcon } from '@radix-ui/react-icons';
import * as RadixCheckbox from '@radix-ui/react-checkbox';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
  size: 'sm' | 'md' | 'lg';
};

const Checkbox = ({ id, checked, onChange, size = 'md' }: Props) => {
  const getSize = () => {
    if (size === 'sm') return 'size-[14px]';
    if (size === 'md') return 'size-[24px]';

    return 'size-[32px]';
  };
  return (
    <RadixCheckbox.Root
      className={` hover:bg-brand-darkBgAccent/90 flex  appearance-none  data-[state=checked]:bg-brand-primary items-center justify-center
                 rounded-[4px] bg-brand-darkBgAccent/70 outline-none focus:bg-brand-darkBgAccent/90 ${getSize()}`}
      checked={checked}
      onCheckedChange={checked => onChange(!!checked)}
      id={id}>
      <RadixCheckbox.Indicator className="text-violet11">
        <CheckIcon />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
};

export default Checkbox;
