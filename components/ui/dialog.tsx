"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Tabs
export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }: React.ComponentPropsWithoutRef<"div">) => (
  <TabsPrimitive.List
    className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1", className)}
    {...props}
  />
);

export const TabsTrigger = ({
  className,
  value,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & { value: string }) => (
  <TabsPrimitive.Trigger
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-black dark:data-[state=active]:text-white",
      className
    )}
    value={value}
    {...props}
  />
);

export const TabsContent = ({
  className,
  value,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { value: string }) => (
  <TabsPrimitive.Content
    value={value}
    className={cn("mt-2 rounded-xl border border-border p-4", className)}
    {...props}
  />
);

// Dialog
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogTitle = DialogPrimitive.Title;

export const DialogOverlay = (props: React.ComponentPropsWithoutRef<"div">) => (
  <DialogPrimitive.Overlay
    {...props}
    className={cn("fixed inset-0 bg-black/30 z-[200]", props.className)}
  />
);

export const DialogContent = ({ className, children, ...props }: React.ComponentPropsWithoutRef<"div">) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        "fixed left-1/2 top-1/2 z-[210] w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white dark:bg-black p-6 shadow-xl focus:outline-none",
        className
      )}
      {...props}
    >
      <DialogPrimitive.Title asChild>
        <VisuallyHidden>Login Required</VisuallyHidden>
      </DialogPrimitive.Title>
      {children}
      <DialogPrimitive.Close className="absolute top-3 right-3 text-gray-500 hover:text-black dark:hover:text-white">
        <X className="w-5 h-5" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);
