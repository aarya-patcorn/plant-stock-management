import { useMemo } from "react";
import { FunnelXIcon, ListFilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createFilter as createBaseFilter,
  Filters,
  type CustomRendererProps,
  type Filter as BaseFilter,
  type FilterFieldConfig as BaseFilterFieldConfig,
} from "@/components/reui/filters";
import { cn } from "@/lib/utils";
import { getActiveFilters } from "@/lib/tableFilters";

export type Filter = BaseFilter<string>;
export type FilterFieldConfig = BaseFilterFieldConfig<string>;

function hasRangeOperator(operator: string) {
  return operator === "between" || operator === "not_between";
}

function DateFilterInput({
  values,
  operator,
  onChange,
}: CustomRendererProps<string>) {
  const stringValues = values as string[];
  const isRange = hasRangeOperator(operator);

  return (
    <div className={cn("flex items-center gap-2", isRange ? "w-[280px]" : "w-[148px]")}>
      <Input
        className="h-8"
        type="date"
        value={stringValues[0] ?? ""}
        onChange={(event) =>
          onChange(
            isRange
              ? [event.target.value, stringValues[1] ?? ""]
              : [event.target.value],
          )
        }
      />
      {isRange ? (
        <Input
          className="h-8"
          type="date"
          value={stringValues[1] ?? ""}
          onChange={(event) => onChange([stringValues[0] ?? "", event.target.value])}
        />
      ) : null}
    </div>
  );
}

function NumberFilterInput({
  values,
  operator,
  onChange,
}: CustomRendererProps<string>) {
  const stringValues = values as string[];
  const isRange = hasRangeOperator(operator);

  return (
    <div className={cn("flex items-center gap-2", isRange ? "w-[240px]" : "w-[132px]")}>
      <Input
        className="h-8"
        inputMode="decimal"
        placeholder={isRange ? "Min" : "Value"}
        type="number"
        value={stringValues[0] ?? ""}
        onChange={(event) =>
          onChange(
            isRange
              ? [event.target.value, stringValues[1] ?? ""]
              : [event.target.value],
          )
        }
      />
      {isRange ? (
        <Input
          className="h-8"
          inputMode="decimal"
          placeholder="Max"
          type="number"
          value={stringValues[1] ?? ""}
          onChange={(event) => onChange([stringValues[0] ?? "", event.target.value])}
        />
      ) : null}
    </div>
  );
}

export function createSelectOptions(values: Array<string | null | undefined>) {
  return [
    { value: "", label: "All" },
    ...Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)))
      .sort((left, right) => left.localeCompare(right))
      .map((value) => ({ value, label: value })),
  ];
}

export function createTextFilterField(
  key: string,
  label: string,
  placeholder?: string,
): FilterFieldConfig {
  return {
    key,
    label,
    type: "text",
    className: "w-44",
    placeholder: placeholder ?? `Search ${label.toLowerCase()}...`,
  };
}

export function createSelectFilterField(
  key: string,
  label: string,
  options: ReturnType<typeof createSelectOptions>,
): FilterFieldConfig {
  return {
    key,
    label,
    type: "select",
    searchable: true,
    className: "w-[180px]",
    options,
  };
}

export function createDateFilterField(key: string, label: string): FilterFieldConfig {
  return {
    key,
    label,
    type: "custom",
    className: "w-auto",
    defaultOperator: "between",
    operators: [
      { value: "is", label: "is" },
      { value: "before", label: "before" },
      { value: "after", label: "after" },
      { value: "between", label: "between" },
      { value: "not_between", label: "not between" },
      { value: "empty", label: "is empty" },
      { value: "not_empty", label: "is not empty" },
    ],
    customRenderer: DateFilterInput,
  };
}

export function createNumberFilterField(key: string, label: string): FilterFieldConfig {
  return {
    key,
    label,
    type: "custom",
    className: "w-auto",
    defaultOperator: "between",
    operators: [
      { value: "equals", label: "equals" },
      { value: "not_equals", label: "not equals" },
      { value: "greater_than", label: "greater than" },
      { value: "greater_than_or_equal", label: "greater than or equal" },
      { value: "less_than", label: "less than" },
      { value: "less_than_or_equal", label: "less than or equal" },
      { value: "between", label: "between" },
      { value: "not_between", label: "not between" },
      { value: "empty", label: "is empty" },
      { value: "not_empty", label: "is not empty" },
    ],
    customRenderer: NumberFilterInput,
  };
}

type TableFiltersBarProps = {
  fields: FilterFieldConfig[];
  filters: Filter[];
  onChange: (filters: Filter[]) => void;
  className?: string;
};

export function TableFiltersBar({
  fields,
  filters,
  onChange,
  className,
}: TableFiltersBarProps) {
  const activeFilters = useMemo(() => getActiveFilters(filters), [filters]);
  const hasVisibleFilters = filters.length > 0;

  return (
    <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between ", className)}>
      <Filters
        allowMultiple
        fields={fields}
        filters={filters}
        onChange={(nextFilters) => onChange(nextFilters as Filter[])}
        size="sm"
        trigger={
          <Button size="icon-sm" type="button" variant="outline">
            <ListFilterIcon className="size-4" />
          </Button>
        }
      />
      {hasVisibleFilters ? (
        <Button onClick={() => onChange([])} size="sm" type="button" variant="outline">
          <FunnelXIcon className="size-4" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}

export function createFilter(field: string, operator?: string, values: string[] = []): Filter {
  return createBaseFilter<string>(field, operator, values);
}



