import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalClose,
} from "@/components/ui/modal";
import { X, Info } from "lucide-react";

export default function OcrHelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="bg-white dark:bg-[#18181c] p-6 rounded-xl border border-border">
        {/* ✨ 닫기 버튼 (X) */}
        <ModalClose asChild>
          <button
            className="absolute top-4 right-4 rounded-full p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </ModalClose>
        <ModalHeader>
          <Info className="text-primary" />
          <ModalTitle className="text-lg font-bold text-gray-900 dark:text-white">
            왜 텍스트 추출이 실패했을까요?
          </ModalTitle>
        </ModalHeader>

        <ModalDescription
          asChild
          className="text-sm text-gray-700 dark:text-gray-300 mt-4 space-y-2"
        >
          <div>
            <span>
              PDF 파일이어도 다음과 같은 이유로 텍스트 추출이 실패할 수
              있습니다:
            </span>
            <ul className="list-disc list-inside space-y-1">
              <li>문서가 이미지 스캔본으로만 저장된 경우</li>
              <li>문서 내부 인코딩이 비표준 방식으로 되어 있는 경우</li>
              <li>보안 설정(복사 방지 등)이 걸려 있는 경우</li>
              <li>특수한 폰트나 레이아웃이 사용된 경우</li>
            </ul>
            <span>
              이런 경우에는 <strong>OCR(이미지 텍스트 인식)</strong>을 통해
              문자를 추출할 수 있습니다.
            </span>
          </div>
        </ModalDescription>

        <ModalFooter className="mt-6">
          <ModalClose asChild>
            <button className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-primary-hover transition">
              닫기
            </button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
