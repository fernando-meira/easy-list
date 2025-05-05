import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

import { Button, ButtonProps } from './ui/button';

interface ButtonActionProps extends ButtonProps {
  text: ReactNode;
  icon?: LucideIcon;
}

export function ActionButton({ text, icon: Icon, ...rest }: ButtonActionProps) {
  return (
    <Button {...rest} className='w-full p-6 text-primary rounded-none rounded-t-sm hover:bg-transparent font-bold border border-input border-b-0 bg-transparent'>
      {Icon && <Icon />} {text}
    </Button>
  );
}
