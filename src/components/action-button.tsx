import { ReactNode } from 'react';
import { CirclePlus } from 'lucide-react';
import { Button, ButtonProps } from './ui/button';

interface ButtonActionProps extends ButtonProps {
  text: ReactNode;
}

export function ActionButton({ text, ...rest }: ButtonActionProps) {
  return (
    <Button {...rest} className='w-full p-6 text-primary rounded-none rounded-t-sm hover:bg-transparent font-bold border border-input border-b-0 bg-transparent'><CirclePlus />{text}</Button>
  );
}
