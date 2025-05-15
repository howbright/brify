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
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
            <Icon icon="mdi:lock-alert" className="text-yellow-600" width={20} />
            로그인 필요
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            이 기능을 사용하려면 로그인 또는 회원가입이 필요합니다.
          </p>

          <Tabs value={tab} onValueChange={(val) => setTab(val as "login" | "signup")}> 
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
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
