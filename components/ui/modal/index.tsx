"use client";

import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";

const Modal = DialogPrimitive.Root;
const ModalTrigger = DialogPrimitive.Trigger;

const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/45" />

    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-[210] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-slate-400 bg-white p-6 shadow-[0_32px_100px_-48px_rgba(15,23,42,0.92)] focus:outline-none dark:border-white/20 dark:bg-[#0F172A] dark:ring-1 dark:ring-white/16 dark:shadow-[0_38px_120px_-60px_rgba(0,0,0,0.96)]",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_240px_at_20%_0%,rgba(59,130,246,0.12),transparent_58%)] dark:bg-[radial-gradient(900px_240px_at_20%_0%,rgba(56,189,248,0.14),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-300/90 to-transparent dark:via-white/18" />
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
ModalContent.displayName = "ModalContent";

const ModalHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("relative flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
ModalHeader.displayName = "ModalHeader";

const ModalFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
ModalFooter.displayName = "ModalFooter";

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-xl font-bold leading-none tracking-tight text-blue-700 dark:text-[rgb(var(--hero-b))]", className)}
    {...props}
  />
));
ModalTitle.displayName = "ModalTitle";

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-base font-medium text-neutral-700 dark:text-neutral-200", className)}
    {...props}
  />
));
ModalDescription.displayName = "ModalDescription";

const ModalClose = DialogPrimitive.Close;

export {
  Modal, ModalClose, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalTrigger
};
