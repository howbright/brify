"use client";

import MarkdownEditor from "@/components/ui/MarkdownEditor";
import { useState } from "react";

export default function Page() {
  const [md, setMd] = useState("## 시작하기\n텍스트를 입력해보세요.");

  return (
    <div className="mx-auto mt-10 max-w-2xl">
      <MarkdownEditor initialContent={md} onChange={setMd} />
      <pre className="mt-4 p-2 border bg-gray-50">{md}</pre>
    </div>
  );
}