import * as React from "react";
import { cn } from "@/lib/utils";

type PopoverContextValue = {
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
};

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopoverContext(component: string) {
  const context = React.useContext(PopoverContext);

  if (!context) {
    throw new Error(`${component} must be used within a Popover.`);
  }

  return context;
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (!ref) {
    return;
  }

  if (typeof ref === "function") {
    ref(value);
    return;
  }

  try {
    (ref as React.MutableRefObject<T>).current = value;
  } catch {
    // Ignore ref assignment failures for unsupported refs.
  }
}

export function Popover({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const nextValue = typeof value === "function" ? value(open) : value;

      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextValue);
      }

      onOpenChange?.(nextValue);
    },
    [controlledOpen, onOpenChange, open],
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;

      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, setOpen]);

  return (
    <PopoverContext.Provider value={{ contentRef, open, setOpen, triggerRef }}>
      <div className="relative w-full">{children}</div>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({
  asChild = false,
  children,
}: {
  asChild?: boolean;
  children: React.ReactElement;
}) {
  const { open, setOpen, triggerRef } = usePopoverContext("PopoverTrigger");
  const childElement = children as React.ReactElement<{
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  }>;

  if (!React.isValidElement(childElement)) {
    return null;
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    childElement.props.onClick?.(event);
    if (!event.defaultPrevented) {
      setOpen(!open);
    }
  };

  if (asChild) {
    return React.cloneElement(childElement, {
      "aria-expanded": open,
      "aria-haspopup": "dialog",
      onClick: handleClick,
      ref: (node: HTMLElement) => {
        triggerRef.current = node;
        assignRef((childElement as { ref?: React.Ref<HTMLElement> }).ref, node);
      },
    } as Record<string, unknown>);
  }

  return React.cloneElement(childElement, {
    onClick: handleClick,
  } as Record<string, unknown>);
}

export function PopoverContent({
  align = "start",
  children,
  className,
}: {
  align?: "center" | "end" | "start";
  children: React.ReactNode;
  className?: string;
}) {
  const { contentRef, open } = usePopoverContext("PopoverContent");

  if (!open) {
    return null;
  }

  const alignClassName =
    align === "center"
      ? "left-1/2 -translate-x-1/2"
      : align === "end"
        ? "right-0"
        : "left-0";

  return (
    <div
      className={cn(
        "absolute top-[calc(100%+0.5rem)] z-50 w-full min-w-[14rem] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]",
        alignClassName,
        className,
      )}
      ref={contentRef}
    >
      {children}
    </div>
  );
}
