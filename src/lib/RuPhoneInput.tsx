'use client';

import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';
import { attachRuPhoneMask, formatRuPhone, RU_PHONE_PLACEHOLDER, toRuPhoneDigits } from './ru-phone';

type Props = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'value' | 'onChange' | 'defaultValue'> & {
  defaultValue?: string;
  onValueChange?: (digits: string) => void;
};

/** FormData input: one DOM owner, no duplicate formatting state or Vue dependency. */
export function RuPhoneInput({ defaultValue = '', onValueChange, disabled, readOnly, ...props }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const onValueChangeRef = useRef(onValueChange);
  useEffect(() => { onValueChangeRef.current = onValueChange; }, [onValueChange]);
  useEffect(() => {
    if (!input.current) return;
    return attachRuPhoneMask(input.current, { onValueChange: digits => onValueChangeRef.current?.(digits) });
  }, [disabled, readOnly]);

  return <input
    {...props}
    ref={input}
    type="tel"
    name={props.name ?? 'phone'}
    inputMode="tel"
    autoComplete="tel"
    placeholder={RU_PHONE_PLACEHOLDER}
    maxLength={18}
    defaultValue={formatRuPhone(toRuPhoneDigits(defaultValue))}
    disabled={disabled}
    readOnly={readOnly}
  />;
}
