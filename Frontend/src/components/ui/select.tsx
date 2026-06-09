import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { INPUT_BASE_CLASSNAME, Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type OptionItem = {
  disabled?: boolean;
  label: string;
  value: string;
};

function collectOptions(children: React.ReactNode): OptionItem[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement(child)) {
      return [];
    }

    const element = child as React.ReactElement<{
      children?: React.ReactNode;
      disabled?: boolean;
      value?: string;
    }>;

    if (element.type === React.Fragment) {
      return collectOptions(element.props.children);
    }

    if (element.type === "option") {
      const label =
        typeof element.props.children === "string"
          ? element.props.children
          : React.Children.toArray(element.props.children).join("");

      return [
        {
          disabled: element.props.disabled,
          label,
          value: String(element.props.value ?? ""),
        },
      ];
    }

    return [];
  });
}

function createSyntheticSelectEvent(
  name: string | undefined,
  value: string,
) {
  return {
    currentTarget: { name, value },
    target: { name, value },
  } as React.ChangeEvent<HTMLSelectElement>;
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  placeholder?: string;
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className, disabled, id, name, onChange, placeholder, value, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const options = React.useMemo(() => collectOptions(children), [children]);
    const selectedValue = String(value ?? "");
    const selectedOption = options.find((option) => option.value === selectedValue);
    const placeholderOption = options.find((option) => option.value === "");
    const triggerLabel =
      selectedOption?.label ||
      placeholder ||
      placeholderOption?.label ||
      "Select option";

    const filteredOptions = React.useMemo(() => {
      const normalizedQuery = query.trim().toLowerCase();

      if (!normalizedQuery) {
        return options.filter((option) => option.value !== "");
      }

      return options.filter(
        (option) =>
          option.value !== "" &&
          option.label.toLowerCase().includes(normalizedQuery),
      );
    }, [options, query]);

    return (
      <Popover
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setQuery("");
          }
        }}
        open={open}
      >
        <select
          {...props}
          className="hidden"
          disabled={disabled}
          id={id}
          name={name}
          ref={ref}
          value={selectedValue}
        >
          {children}
        </select>
        <PopoverTrigger asChild>
          <button
            className={cn(
              INPUT_BASE_CLASSNAME,
              "items-center justify-between text-left font-normal",
              !selectedValue && "text-slate-400",
              className,
            )}
            disabled={disabled}
            type="button"
          >
            <span className="truncate">{triggerLabel}</span>
            <ChevronDown className="size-4 shrink-0 text-slate-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-2" align="start">
          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search..."
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-500">
                  No options found.
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === selectedValue;

                  return (
                    <button
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition",
                        isSelected
                          ? "bg-teal-50 font-medium text-teal-700"
                          : "text-slate-700 hover:bg-slate-50",
                        option.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                      )}
                      disabled={option.disabled}
                      key={`${option.value}-${option.label}`}
                      onClick={() => {
                        onChange?.(createSyntheticSelectEvent(name, option.value));
                        setOpen(false);
                      }}
                      type="button"
                    >
                      <span>{option.label}</span>
                      {isSelected ? <Check className="size-4" /> : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);
Select.displayName = "Select";

export { Select };
