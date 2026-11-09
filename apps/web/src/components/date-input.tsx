import { CalendarDays } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { es } from 'react-day-picker/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// The forms keep dates as "YYYY-MM-DD" text (what the API expects). While the physio is still
// typing, the form gets the unfinished text instead, so its validation shows "not a valid date".

const pad = (n: number) => String(n).padStart(2, '0');

/** Date → "YYYY-MM-DD" in local time (toISOString would use UTC and could shift the day) */
function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-MM-DD" → Date at local midnight, or undefined if it isn't a real date */
function fromIso(text: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return undefined;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  // 31/02 rolls over to March: not a real date
  return date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : undefined;
}

/** "1948-03-12" → "12/03/1948"; unfinished text is shown as typed */
function toDisplay(value: string): string {
  const date = fromIso(value);
  return date
    ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
    : value;
}

/** Typed text → "dd/mm/aaaa" with the slashes added automatically, at most 8 digits */
function formatTyped(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)]
    .filter(Boolean)
    .join('/');
}

/** "12/03/1948" → "1948-03-12" if it's a complete, real date; otherwise the text itself */
function fromDisplay(text: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return text;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  return fromIso(iso) ? iso : text;
}

type DateInputProps = Omit<
  ComponentProps<'input'>,
  'value' | 'onChange' | 'type' | 'min' | 'max'
> & {
  /** "YYYY-MM-DD", '' or unfinished typed text */
  value: string;
  onChange: (value: string) => void;
  /** First and last allowed day, "YYYY-MM-DD" */
  min: string;
  max: string;
  /** Month and year dropdowns in the calendar, to jump far (birth dates) */
  dropdowns?: boolean;
  /** "Hoy" button under the calendar */
  todayShortcut?: boolean;
};

/**
 * Date field: type "dd/mm/aaaa" (slashes are added for you) or pick a day in the calendar
 * that opens from the button on the right. In Spanish, weeks start on Monday.
 */
export function DateInput({
  value,
  onChange,
  min,
  max,
  dropdowns = false,
  todayShortcut = false,
  className,
  disabled,
  placeholder = 'dd/mm/aaaa',
  ...props
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const selected = fromIso(value);
  const minDate = fromIso(min);
  const maxDate = fromIso(max);
  const [today] = useState(() => new Date()); // read once, not on every render
  const todayAllowed = toIso(today) >= min && toIso(today) <= max;

  function pick(date: Date | undefined) {
    if (!date) return;
    onChange(toIso(date));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn('relative', className)}>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            data-slot="input"
            placeholder={placeholder}
            disabled={disabled}
            value={toDisplay(value)}
            onChange={(event) =>
              onChange(fromDisplay(formatTyped(event.target.value)))
            }
            className="h-10 w-full min-w-0 rounded-md border border-input bg-card py-1 pr-11 pl-2.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
            {...props}
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              aria-label="Abrir calendario"
              className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <CalendarDays />
            </Button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>

      <PopoverContent align="start" className="w-auto p-2">
        <Calendar
          mode="single"
          locale={es}
          selected={selected}
          onSelect={pick}
          // Opens on the chosen day, or this month (kept inside the allowed range)
          defaultMonth={
            selected ??
            (maxDate && today > maxDate
              ? maxDate
              : minDate && today < minDate
                ? minDate
                : today)
          }
          startMonth={minDate}
          endMonth={maxDate}
          disabled={[
            ...(minDate ? [{ before: minDate }] : []),
            ...(maxDate ? [{ after: maxDate }] : []),
          ]}
          captionLayout={dropdowns ? 'dropdown' : 'label'}
          autoFocus
        />
        {todayShortcut && todayAllowed && (
          <Button
            type="button"
            variant="ghost"
            className="self-start text-primary"
            onClick={() => pick(today)}
          >
            Hoy
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
