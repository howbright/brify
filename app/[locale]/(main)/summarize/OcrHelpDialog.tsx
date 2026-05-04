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
import { useTranslations } from "next-intl";

export default function OcrHelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("SummarizePage.ocrHelp");

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
              {t("title")}
            </ModalTitle>
          </div>
          <ModalDescription className="mt-0">
            {t("subtitle")}
          </ModalDescription>
        </ModalHeader>

        <ModalDescription
          asChild
          className="mt-5 space-y-3 text-[15px] leading-7 text-neutral-800 dark:text-neutral-100"
        >
          <div>
            <span className="block">
              {t("reasonsTitle")}
            </span>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>{t("reason1")}</li>
              <li>{t("reason2")}</li>
              <li>{t("reason3")}</li>
              <li>{t("reason4")}</li>
            </ul>
            <span className="mt-3 block">
              {t.rich("footer", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </div>
        </ModalDescription>

        <ModalFooter className="mt-7">
          <ModalClose asChild>
            <button className="rounded-2xl border border-slate-400 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100 dark:border-white/20 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/10">
              {t("close")}
            </button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
