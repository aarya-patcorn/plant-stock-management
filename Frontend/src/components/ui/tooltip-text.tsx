import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type TooltipTextProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  content: ReactNode;
  side?: ComponentPropsWithoutRef<typeof TooltipContent>["side"];
  tooltipClassName?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className" | "title">;

export function TooltipText<T extends ElementType = "span">({
  as,
  children,
  className,
  content,
  side = "top",
  tooltipClassName,
  ...props
}: TooltipTextProps<T>) {
  const Component = (as ?? "span") as ElementType;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Component className={className} {...props}>
          {children}
        </Component>
      </TooltipTrigger>
      <TooltipContent className={tooltipClassName} side={side}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
