"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const EMPTY_VALUE = "__SHADCN_EMPTY_OPTION__"

type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>
type RootSelectProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> & {
  className?: string
  children?: React.ReactNode
}

type SelectSharedProps = NativeSelectProps | RootSelectProps

type ParsedOption = {
  disabled?: boolean
  label: React.ReactNode
  value: string
}

function isNativeSelectProps(props: SelectSharedProps) {
  if ("onChange" in props || "id" in props || "name" in props) {
    return true
  }

  const children = React.Children.toArray(props.children)
  return children.some((child) => React.isValidElement(child) && child.type === "option")
}

function normalizeOptionValue(value: string) {
  return value === "" ? EMPTY_VALUE : value
}

function denormalizeOptionValue(value: string) {
  return value === EMPTY_VALUE ? "" : value
}

function parseNativeOptions(children: React.ReactNode) {
  const parsedOptions: ParsedOption[] = []
  let placeholder: React.ReactNode = "Select option"

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      return
    }

    if (child.type === React.Fragment) {
      const fragmentProps = child.props as { children?: React.ReactNode }
      const nested = parseNativeOptions(fragmentProps.children)
      parsedOptions.push(...nested.options)
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
        placeholder = optionLabel
        return
      }

      parsedOptions.push({
        disabled: Boolean(optionProps.disabled),
        label: optionLabel,
        value: optionValue,
      })
    }
  })

  return { options: parsedOptions, placeholder }
}

const Select = React.forwardRef<HTMLButtonElement, SelectSharedProps>((props, ref) => {
  if (isNativeSelectProps(props)) {
    const {
      children,
      className,
      defaultValue,
      disabled,
      id,
      name,
      onChange,
      required,
      value,
    } = props as NativeSelectProps

    const { options, placeholder } = parseNativeOptions(children)
    const controlledValue = typeof value === "string" ? normalizeOptionValue(value) : undefined
    const defaultSelectValue = typeof defaultValue === "string" ? normalizeOptionValue(defaultValue) : undefined

    return (
      <>
        {name ? <input name={name} type="hidden" value={typeof value === "string" ? value : ""} /> : null}
        <SelectPrimitive.Root
          defaultValue={defaultSelectValue}
          disabled={disabled}
          onValueChange={(nextValue) => {
            const resolvedValue = denormalizeOptionValue(nextValue)
            onChange?.({
              target: {
                id,
                name,
                value: resolvedValue,
              },
            } as React.ChangeEvent<HTMLSelectElement>)
          }}
          required={required}
          value={controlledValue}
        >
          <SelectTrigger className={className} id={id} ref={ref}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem disabled={option.disabled} key={`${option.value}-${String(option.label)}`} value={normalizeOptionValue(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectPrimitive.Root>
      </>
    )
  }

  const { children, ...rootProps } = props as RootSelectProps
  return <SelectPrimitive.Root {...rootProps}>{children}</SelectPrimitive.Root>
})
Select.displayName = "Select"

const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { size?: string }
>(({ className, children, size: _size, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "isolate z-[70] relative max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-xl ring-1 ring-black/5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}

