import { Button } from '@/components/ui/button';
import { WEEKDAYS, type Weekday } from './programs.api';
import { weekdayLong, weekdayShort } from './programs.labels';

interface DayPickerProps {
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
  invalid?: boolean;
}

/** Seven toggle buttons, L M X J V S D. Selected days are filled. */
export function DayPicker({ value, onChange, invalid }: DayPickerProps) {
  function toggle(day: Weekday) {
    const next = value.includes(day)
      ? value.filter((d) => d !== day)
      : [...value, day];
    // Keep week order, so the saved list reads Monday → Sunday
    onChange(WEEKDAYS.filter((d) => next.includes(d)));
  }

  return (
    <div className="flex gap-1" role="group" aria-invalid={invalid}>
      {WEEKDAYS.map((day) => {
        const selected = value.includes(day);
        return (
          <Button
            key={day}
            type="button"
            size="icon-sm"
            variant={selected ? 'default' : 'outline'}
            aria-pressed={selected}
            aria-label={weekdayLong[day]}
            title={weekdayLong[day]}
            onClick={() => toggle(day)}
          >
            {weekdayShort[day]}
          </Button>
        );
      })}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() =>
          onChange(value.length === WEEKDAYS.length ? [] : [...WEEKDAYS])
        }
      >
        {value.length === WEEKDAYS.length ? 'Ninguno' : 'Todos'}
      </Button>
    </div>
  );
}
