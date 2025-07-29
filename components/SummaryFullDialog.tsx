"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { Icon } from "@iconify/react";
import SummaryViewer from "./SummaryViewer";
import DiagramView from "./diagram/DiagramView";
import { Edge, Node } from "@xyflow/react";
import { MyNodeData } from "@/app/types/tree";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import SummaryContent from "./SummaryContent";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: "text" | "diagram";
  onTabChange: (tab: "text" | "diagram") => void;
  text: string;
  nodes: Node<MyNodeData>[];
  edges: Edge[];
}

export default function SummaryFullDialog({
  open,
  onOpenChange,
  activeTab,
  onTabChange,
  text,
  nodes,
  edges,
}: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed inset-0 z-50 bg-white flex flex-col">
          <VisuallyHidden>
            <Dialog.Title>전체 보기</Dialog.Title>
          </VisuallyHidden>
          {/* Header: Tabs + X 버튼 */}
          <div className="flex items-center justify-between border-b p-4">
            <Tabs.Root
              value={activeTab}
              onValueChange={(v) => onTabChange(v as "text" | "diagram")}
              className="flex-1"
            >
              <Tabs.List className="flex gap-4">
                <Tabs.Trigger
                  value="text"
                  className="py-2 px-4 font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  텍스트 요약
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="diagram"
                  className="py-2 px-4 font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  다이어그램
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
            <Dialog.Close asChild>
              <button className="p-2 rounded-full hover:bg-gray-200">
                <Icon icon="mdi:close" className="w-5 h-5 text-gray-700" />
              </button>
            </Dialog.Close>
          </div>

          {/* Tab Contents */}
          <Tabs.Root
            value={activeTab}
            onValueChange={(v) => onTabChange(v as "text" | "diagram")}
            className="flex-1 flex flex-col"
          >
            <Tabs.Content value="text" className="flex-1 overflow-y-auto p-2">
              <SummaryContent initialText={text}
              scrollToComment={() => { } }
              scrollToTop={() => { } }
              scrollToDiagram={() => { } }   fullMode={true}/>
            
              {/* <SummaryViewer
                text={text}
                onEdit={() => {}}
                scrollToComment={() => {}}
                scrollToTop={() => {}}
                scrollToDiagram={() => {}}
              /> */}
            </Tabs.Content>

            <Tabs.Content value="diagram" className="flex-1 overflow-hidden">
              <DiagramView nodes={nodes} edges={edges} />
            </Tabs.Content>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
