import * as React from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  formatCalendarDate,
  parseCalendarDate,
} from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const INPUT_BASE_CLASSNAME =
  "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm ring-offset-background transition-[border-color,box-shadow,background-color] file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-teal-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-100";

function createSyntheticChangeEvent(
  name: string | undefined,
  value: string,
) {
  return {
    currentTarget: { name, value },
    target: { name, value },
  } as React.ChangeEvent<HTMLInputElement>;
}

function formatDisplayDate(value: string) {
  const selectedDate = parseCalendarDate(value);

  if (!selectedDate) {
    return "Select date";
  }

  return selectedDate.toLocaleDateString("en-GB").replace(/\//g, "-");
}

function parseLimitDate(value?: string | number) {
  if (typeof value !== "string" || !value) {
    return undefined;
  }

  return parseCalendarDate(value);
}

function DatePickerInput({
  className,
  disabled,
  id,
  max,
  min,
  name,
  onChange,
  placeholder,
  value,
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = parseCalendarDate(String(value || ""));
  const minDate = parseLimitDate(min);
  const maxDate = parseLimitDate(max);

  const isDisabledDate = React.useCallback(
    (date: Date) => {
      if (minDate && date < minDate) {
        return true;
      }

      if (maxDate && date > maxDate) {
        return true;
      }

      return false;
    },
    [maxDate, minDate],
  );

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <input id={id} name={name} type="hidden" value={String(value || "")} />
      <PopoverTrigger asChild>
        <button
          className={cn(
            INPUT_BASE_CLASSNAME,
            "items-center justify-between text-left font-normal",
            !value && "text-slate-400",
            className,
          )}
          disabled={disabled}
          type="button"
        >
          <span>{value ? formatDisplayDate(String(value)) : placeholder || "Select date"}</span>
          <CalendarDays className="size-4 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[19rem] p-3" align="start">
        <Calendar
          disabled={isDisabledDate}
          onSelect={(date) => {
            onChange?.(createSyntheticChangeEvent(name, formatCalendarDate(date)));
            setOpen(false);
          }}
          selected={selectedDate}
        />
      </PopoverContent>
    </Popover>
  );
}

function formatDisplayTime(value: string) {
  if (!value) {
    return "Select time";
  }

  return value;
}

function TimePickerInput({
  className,
  disabled,
  id,
  name,
  onChange,
  placeholder,
  value,
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [open, setOpen] = React.useState(false);
  const [draftValue, setDraftValue] = React.useState(String(value || ""));

  React.useEffect(() => {
    setDraftValue(String(value || ""));
  }, [value]);

  return (
    <Popover
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setDraftValue(String(value || ""));
        }
      }}
      open={open}
    >
      <input id={id} name={name} type="hidden" value={String(value || "")} />
      <PopoverTrigger asChild>
        <button
          className={cn(
            INPUT_BASE_CLASSNAME,
            "items-center justify-between text-left font-normal",
            !value && "text-slate-400",
            className,
          )}
          disabled={disabled}
          type="button"
        >
          <span>{value ? formatDisplayTime(String(value)) : placeholder || "Select time"}</span>
          <Clock3 className="size-4 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[16rem] p-3" align="start">
        <div className="space-y-3">
          <input
            className={cn(INPUT_BASE_CLASSNAME, "pr-3")}
            type="time"
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setDraftValue(String(value || ""));
                setOpen(false);
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onChange?.(createSyntheticChangeEvent(name, draftValue));
                setOpen(false);
              }}
              type="button"
            >
              Set time
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    if (type === "date") {
      return <DatePickerInput className={className} type={type} {...props} />;
    }

    if (type === "time") {
      return <TimePickerInput className={className} type={type} {...props} />;
    }

    return (
      <input
        type={type}
        className={cn(INPUT_BASE_CLASSNAME, className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, INPUT_BASE_CLASSNAME };
