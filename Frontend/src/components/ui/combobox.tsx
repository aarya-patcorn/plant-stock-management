"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type NativeComboboxProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  placeholder?: string
}

type ParsedOption = {
  disabled?: boolean
  label: React.ReactNode
  searchText: string
  value: string
}

function normalizeText(value: React.ReactNode): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value)
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeText(entry)).join(" ")
  }

  if (React.isValidElement(value)) {
    const elementProps = value.props as { children?: React.ReactNode }
    return normalizeText(elementProps.children)
  }

  return ""
}

function parseOptions(children: React.ReactNode) {
  const options: ParsedOption[] = []
  let placeholder = "Select option"

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      return
    }

    if (child.type === React.Fragment) {
      const fragmentProps = child.props as { children?: React.ReactNode }
      const nested = parseOptions(fragmentProps.children)
      options.push(...nested.options)
      if (nested.placeholder !== "Select option") {
        placeholder = nested.placeholder
      }
      return
    }

    if (child.type === "option") {
      const optionProps = child.props as React.OptionHTMLAttributes<HTMLOptionElement> & {
        children?: React.ReactNode
      }
      const optionValue = String(optionProps.value ?? "")
      const optionLabel = optionProps.children
      const isPlaceholder = optionValue === "" && optionProps.disabled

      if (isPlaceholder) {
        placeholder = normalizeText(optionLabel) || placeholder
        return
      }

      options.push({
        disabled: Boolean(optionProps.disabled),
        label: optionLabel,
        searchText: normalizeText(optionLabel).toLowerCase(),
        value: optionValue,
      })
    }
  })

  return { options, placeholder }
}

const Combobox = React.forwardRef<HTMLButtonElement, NativeComboboxProps>(
  ({ children, className, defaultValue, disabled, id, name, onChange, placeholder, value }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const { options, placeholder: parsedPlaceholder } = React.useMemo(() => parseOptions(children), [children])

    const resolvedPlaceholder = placeholder ?? parsedPlaceholder
    const resolvedValue = typeof value === "string" ? value : typeof defaultValue === "string" ? defaultValue : ""
    const selectedOption = options.find((option) => option.value === resolvedValue)

    const filteredOptions = React.useMemo(() => {
      const normalizedSearch = search.trim().toLowerCase()
      if (!normalizedSearch) {
        return options
      }

      return options.filter((option) => option.searchText.includes(normalizedSearch))
    }, [options, search])

    return (
      <>
        {name ? <input name={name} type="hidden" value={resolvedValue} /> : null}
        <Popover
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen)
            if (!nextOpen) {
              setSearch("")
            }
          }}
          open={open}
        >
          <PopoverTrigger asChild>
            <Button
              aria-controls={id ? `${id}-combobox-list` : undefined}
              aria-expanded={open}
              aria-haspopup="listbox"
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                !selectedOption && "text-muted-foreground",
                className,
              )}
              disabled={disabled}
              id={id}
              ref={ref}
              role="combobox"
              type="button"
              variant="outline"
            >
              <span className="truncate text-left">{selectedOption ? selectedOption.label : resolvedPlaceholder}</span>
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[220px] p-0" sideOffset={6}>
            <div className="border-b border-slate-200 p-2">
              <Input
                autoFocus
                placeholder={`Search ${String(resolvedPlaceholder).toLowerCase()}...`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-1" id={id ? `${id}-combobox-list` : undefined} role="listbox">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">No option found.</div>
              ) : (
                filteredOptions.map((option) => {
                  const selected = option.value === resolvedValue

                  return (
                    <button
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-slate-900 transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                        selected && "bg-slate-100",
                      )}
                      disabled={option.disabled}
                      key={`${option.value}-${option.searchText}`}
                      onClick={() => {
                        onChange?.({
                          target: {
                            id,
                            name,
                            value: option.value,
                          },
                        } as React.ChangeEvent<HTMLSelectElement>)
                        setOpen(false)
                        setSearch("")
                      }}
                      role="option"
                      type="button"
                    >
                      <Check className={cn("size-4 text-slate-900", selected ? "opacity-100" : "opacity-0")} />
                      <span className="truncate">{option.label}</span>
                    </button>
                  )
                })
              )}
            </div>
          </PopoverContent>
        </Popover>
      </>
    )
  },
)
Combobox.displayName = "Combobox"

export { Combobox }
