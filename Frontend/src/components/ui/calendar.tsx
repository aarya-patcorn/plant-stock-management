import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function createDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(left: Date, right: Date) {
  return formatDateKey(left) === formatDateKey(right);
}

function buildCalendarDays(month: Date) {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
}

export function Calendar({
  disabled,
  onSelect,
  selected,
}: {
  disabled?: (date: Date) => boolean;
  onSelect: (date: Date) => void;
  selected?: Date;
}) {
  const [month, setMonth] = React.useState(
    selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date(),
  );

  React.useEffect(() => {
    if (!selected) {
      return;
    }

    setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [selected]);

  const days = React.useMemo(() => buildCalendarDays(month), [month]);

  return (
    <div className="space-y-2 p-1 sm:space-y-3">
      <div className="flex items-center justify-between px-1">
        <Button
          className="h-7 w-7 rounded-lg sm:h-9 sm:w-9 sm:rounded-xl"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="text-xs font-semibold text-slate-800 sm:text-sm">
          {month.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })}
        </div>
        <Button
          className="h-7 w-7 rounded-lg sm:h-9 sm:w-9 sm:rounded-xl"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:gap-1 sm:text-xs">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday}>{weekday}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const isSelected = selected ? isSameDay(date, selected) : false;
          const isOutsideMonth = date.getMonth() !== month.getMonth();
          const isDisabled = disabled?.(date) ?? false;

          return (
            <button
              className={cn(
                "flex h-7 items-center justify-center rounded-lg text-xs transition sm:h-10 sm:rounded-xl sm:text-sm",
                isSelected
                  ? "bg-teal-900 font-semibold text-white shadow-sm hover:bg-teal-600"
                  : "text-slate-700 hover:bg-slate-100",
                isOutsideMonth && !isSelected && "text-slate-300",
                isDisabled && "cursor-not-allowed bg-transparent text-slate-300 hover:bg-transparent",
              )}
              disabled={isDisabled}
              key={formatDateKey(date)}
              onClick={() => onSelect(date)}
              type="button"
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function parseCalendarDate(value: string) {
  return value ? createDate(value) : undefined;
}

export function formatCalendarDate(date: Date) {
  return formatDateKey(date);
}
