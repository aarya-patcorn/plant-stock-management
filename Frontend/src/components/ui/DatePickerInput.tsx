import * as React from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Calendar, formatCalendarDate, parseCalendarDate } from "@/components/ui/calendar";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function parseFlexibleDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = parseCalendarDate(trimmed);
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  }

  const localFormatMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (localFormatMatch) {
    const [, day, month, year] = localFormatMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDate(value: string) {
  const parsed = parseFlexibleDate(value);

  if (!parsed) {
    return value;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

type DatePickerInputProps = {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function DatePickerInput({
  id,
  name,
  value,
  onChange,
  placeholder = "DD Month YYYY",
  className,
  disabled = false,
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(formatDisplayDate(value));

  React.useEffect(() => {
    setInputValue(formatDisplayDate(value));
  }, [value]);

  const selectedDate = React.useMemo(() => parseFlexibleDate(value), [value]);

  const commitValue = React.useCallback(
    (nextValue: string) => {
      const parsed = parseFlexibleDate(nextValue);

      if (!parsed) {
        if (!nextValue.trim()) {
          onChange("");
          setInputValue("");
          return;
        }

        setInputValue(formatDisplayDate(value));
        return;
      }

      const formatted = formatCalendarDate(parsed);
      onChange(formatted);
      setInputValue(formatDisplayDate(formatted));
    },
    [onChange, value],
  );

  return (
    <div className={cn("space-y-0", className)}>
      <input name={name} type="hidden" value={value} />
      <Popover onOpenChange={setOpen} open={open}>
        <InputGroup className="h-10 rounded-md border border-input bg-background shadow-none">
          <InputGroupAddon>
            <InputGroupText>
              <CalendarDays className="size-4" />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            autoComplete="off"
            disabled={disabled}
            id={id}
            placeholder={placeholder}
            value={inputValue}
            onBlur={() => commitValue(inputValue)}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitValue(inputValue);
                setOpen(false);
              }
            }}
          />
          <InputGroupAddon align="inline-end">
            <PopoverTrigger asChild>
              <InputGroupButton aria-label="Open calendar" disabled={disabled} size="icon-sm" type="button" variant="ghost">
                <ChevronDown className="size-4" />
              </InputGroupButton>
            </PopoverTrigger>
          </InputGroupAddon>
        </InputGroup>
        <PopoverContent align="start" className="w-[320px] p-3" sideOffset={8}>
          <Calendar
            onSelect={(date) => {
              const formatted = formatCalendarDate(date);
              onChange(formatted);
              setInputValue(formatDisplayDate(formatted));
              setOpen(false);
            }}
            selected={selectedDate ?? undefined}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
