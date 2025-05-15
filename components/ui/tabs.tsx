"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

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
