import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ComponentProps, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

type NumberInputProps = Omit<
  ComponentProps<'input'>,
  'value' | 'onChange' | 'type' | 'min' | 'max' | 'step'
> & {
  /** The form keeps numbers as text, so an empty field stays empty (not 0) */
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step?: number;
  /** Accept one decimal separator ("64,5" or "64.5"); otherwise whole numbers only */
  decimal?: boolean;
};

const INTEGER = /^\d*$/;
const DECIMAL = /^\d*([.,]\d*)?$/;

/**
 * Text field for numbers: only digits can be typed, and the arrows on the right (or the
 * keyboard's up/down keys) add or subtract `step`, staying between `min` and `max`.
 * Not `type="number"`: its arrows are tiny, can't be styled, don't show on tablets and it accepts "e".
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  decimal = false,
  className,
  disabled,
  onKeyDown,
  ...props
}: NumberInputProps) {
  const current = Number(value.replace(',', '.'));
  const isNumber = value.trim() !== '' && !Number.isNaN(current);

  function stepBy(direction: 1 | -1) {
    // Empty: the first press starts at the lowest allowed value
    const next = isNumber ? current + direction * step : min;
    const clamped = Math.min(max, Math.max(min, Math.round(next * 10) / 10));
    const text = String(clamped);
    onChange(decimal ? text.replace('.', ',') : text);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      stepBy(event.key === 'ArrowUp' ? 1 : -1);
    }
    onKeyDown?.(event);
  }

  const arrowClass =
    'flex flex-1 items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40';

  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        autoComplete="off"
        data-slot="input"
        value={value}
        disabled={disabled}
        // Ignore anything that would make it not a number (letters, a second comma…)
        onChange={(event) => {
          const text = event.target.value;
          if ((decimal ? DECIMAL : INTEGER).test(text)) onChange(text);
        }}
        onKeyDown={handleKeyDown}
        className="h-10 w-full min-w-0 rounded-md border border-input bg-card py-1 pr-10 pl-2.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
        {...props}
      />
      {/* Arrows: out of the Tab order (the keyboard uses the up/down keys on the field) */}
      <div className="absolute inset-y-px right-px flex w-8 flex-col overflow-hidden rounded-r-[calc(var(--radius-md)-1px)] border-l border-input">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Aumentar"
          disabled={disabled || (isNumber && current >= max)}
          onClick={() => stepBy(1)}
          className={cn(arrowClass, 'border-b border-input')}
        >
          <ChevronUp className="size-3.5" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Disminuir"
          disabled={disabled || (isNumber && current <= min)}
          onClick={() => stepBy(-1)}
          className={arrowClass}
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
