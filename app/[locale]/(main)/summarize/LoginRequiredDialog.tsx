"use client";

import LoginForm from "@/components/LoginForm";
import SignupForm from "@/components/SignupForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@iconify/react";
import { useState } from "react";

interface LoginRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoginRequiredDialog({ open, onOpenChange }: LoginRequiredDialogProps) {
  const [tab, setTab] = useState<"login" | "signup">("login");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden p-0">
        <div className="relative p-6 sm:p-8">
          <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-blue-700 dark:text-[rgb(var(--hero-b))]">
            <Icon icon="mdi:lock-alert" className="text-blue-700 dark:text-[rgb(var(--hero-b))]" width={22} />
            로그인 필요
          </h2>
          <p className="mb-5 text-base font-semibold text-neutral-900 dark:text-white">
            이 기능을 사용하려면 로그인 또는 회원가입이 필요합니다.
          </p>

          <Tabs value={tab} onValueChange={(val) => setTab(val as "login" | "signup")}> 
            <TabsList className="mb-4 grid h-auto grid-cols-2 rounded-2xl border border-slate-400 bg-white p-1 dark:border-white/20 dark:bg-white/[0.08]">
              <TabsTrigger value="login" className="rounded-2xl text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-[rgb(var(--hero-b))] dark:data-[state=active]:text-neutral-950">로그인</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-2xl text-sm font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-[rgb(var(--hero-b))] dark:data-[state=active]:text-neutral-950">회원가입</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
