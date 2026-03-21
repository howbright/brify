import {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Info, X } from "lucide-react";

export default function OcrHelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-xl p-6 md:p-7">
        <ModalClose asChild>
          <button
            className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </ModalClose>
        <ModalHeader className="gap-2">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-700 dark:text-[rgb(var(--hero-b))]" />
            <ModalTitle className="text-xl">
              왜 텍스트 추출이 실패했을까요?
            </ModalTitle>
          </div>
          <ModalDescription className="mt-0">
            OCR이 필요한 대표적인 이유를 간단히 정리했어요.
          </ModalDescription>
        </ModalHeader>

        <ModalDescription
          asChild
          className="mt-5 space-y-3 text-[15px] leading-7 text-neutral-800 dark:text-neutral-100"
        >
          <div>
            <span className="block">
              PDF 파일이어도 다음과 같은 이유로 텍스트 추출이 실패할 수
              있습니다:
            </span>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>문서가 이미지 스캔본으로만 저장된 경우</li>
              <li>문서 내부 인코딩이 비표준 방식으로 되어 있는 경우</li>
              <li>보안 설정(복사 방지 등)이 걸려 있는 경우</li>
              <li>특수한 폰트나 레이아웃이 사용된 경우</li>
            </ul>
            <span className="mt-3 block">
              이런 경우에는 <strong>OCR(이미지 텍스트 인식)</strong>을 통해
              문자를 추출할 수 있습니다.
            </span>
          </div>
        </ModalDescription>

        <ModalFooter className="mt-7">
          <ModalClose asChild>
            <button className="rounded-2xl border border-slate-400 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100 dark:border-white/20 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/10">
              닫기
            </button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
