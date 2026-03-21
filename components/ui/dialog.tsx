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
    className={cn("fixed inset-0 z-[200] bg-black/45 backdrop-blur-sm", props.className)}
  />
);

export const DialogContent = ({ className, children, ...props }: React.ComponentPropsWithoutRef<"div">) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        "fixed left-1/2 top-1/2 z-[210] w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-3xl border border-slate-400 bg-white p-5 shadow-[0_28px_90px_-40px_rgba(15,23,42,0.85)] focus:outline-none dark:border-white/20 dark:bg-[#0F172A] dark:ring-1 dark:ring-white/16 dark:shadow-[0_34px_120px_-60px_rgba(0,0,0,0.95)]",
        className
      )}
      {...props}
    >
      <div
        className="
          pointer-events-none absolute inset-0 rounded-3xl
          bg-[radial-gradient(800px_260px_at_20%_0%,rgba(59,130,246,0.18),transparent_55%)]
          dark:bg-[radial-gradient(800px_260px_at_20%_0%,rgba(56,189,248,0.18),transparent_55%)]
        "
      />
      <div className="pointer-events-none absolute inset-0 rounded-3xl dark:bg-white/[0.03]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-slate-400 dark:bg-white/20" />
      <DialogPrimitive.Title asChild>
        <VisuallyHidden>Login Required</VisuallyHidden>
      </DialogPrimitive.Title>
      {children}
      <DialogPrimitive.Close className="absolute top-4 right-4 z-10 text-neutral-500 hover:text-neutral-800 dark:text-white/60 dark:hover:text-white">
        <X className="h-6 w-6" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);
