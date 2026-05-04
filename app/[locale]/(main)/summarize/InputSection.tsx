"use client";

import { SourceType } from "@/app/types/sourceType";
import Alert from "@/components/ui/Alert";
import { getYouTubeVideoId } from "@/lib/utils";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useState } from "react";
import OcrHelpDialog from "./OcrHelpDialog";
import OcrSuggestDialog from "./OcrSuggestDialog";
import UploadCard from "./UploadCard";
import { useLocale, useTranslations } from "next-intl";

interface Props {
  type: SourceType;
  onExtracted: (text: string, succeed: boolean) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

export default function InputSection({
  type,
  onExtracted,
  isLoading,
  setIsLoading,
}: Props) {
  const [textInput, setTextInput] = useState<string>("");
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [openAlert, setOpenAlert] = useState<boolean>(false);
  const [openOcrSuggest, setOpenOcrSuggest] = useState<boolean>(false);
  const [openOcrHelp, setOpenOcrHelp] = useState<boolean>(false);
  const [alertText, setAlertText] = useState<string>("");
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const locale = useLocale();
  const t = useTranslations("SummarizePage.input");
  const labels = {
    noFile: t("noFile"),
    invalidYoutube: t("invalidYoutube"),
    processingError: t("processingError"),
    extractButton: t("extractButton"),
    processing: t("processing"),
    youtubeLabel: t("youtubeLabel"),
    websiteLabel: t("websiteLabel"),
    websiteHint: t("websiteHint"),
    youtubeExtractPrefix: t("youtubeExtractPrefix"),
    websiteExtractPrefix: t("websiteExtractPrefix"),
    ocrExtractPrefix: t("ocrExtractPrefix"),
    fileExtractPrefix: t("fileExtractPrefix"),
    fetchResultFailed: t("fetchResultFailed"),
    youtubeTranscriptFailed: t("youtubeTranscriptFailed"),
    requestFailed: t("requestFailed"),
    requestError: t("requestError"),
    networkError: t("networkError"),
    websiteExtractFailed: t("websiteExtractFailed"),
    requestNotFound: t("requestNotFound"),
    websiteErrorRetry: t("websiteErrorRetry"),
    ocrFailed: t("ocrFailed"),
    ocrUploadFailed: t("ocrUploadFailed"),
    fileProcessFailed: t("fileProcessFailed"),
    fileUploadFailed: t("fileUploadFailed"),
  };

  const handleSubmit = async () => {
    if (type === SourceType.FILE && !fileInput) {
      setAlertText(labels.noFile); // ⚡ 추가: 업로드 전 파일 체크
      setOpenAlert(true);
      return;
    }
    setIsLoading(true);
    onExtracted("", false);
    try {
      // if (type === "manual") return handleManualSubmit();
      if (type === SourceType.YOUTUBE) return handleYoutubeSubmit();
      if (type === SourceType.WEBSITE) return handleWebsiteSubmit();
      if (type === SourceType.FILE) return handleFileSubmit();
    } catch (err) {
      console.error(err);
      onExtracted(labels.processingError, false);
      setIsLoading(false);
    } finally {
      // setIsLoading(false);
    }
  };

  const handleYoutubeSubmit = async () => {
    try {
      const videoId = getYouTubeVideoId(textInput);
      if (!videoId) {
        setAlertText(labels.invalidYoutube);
        setOpenAlert(true);
        setIsLoading(false);
        return;
      }
      const res = await fetch(`${apiBaseUrl}/youtube/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: textInput }),
      });

      const data = await res.json();
      console.log(data.status);

      if (res.ok && data.status === "cached") {
        // ✅ 캐시에서 바로 꺼낸 결과 → 바로 처리
        console.log("캐시 결과 사용");
        if (typeof data.result === "string") {
          onExtracted(
            `${labels.youtubeExtractPrefix}\n\n${data.result}`,
            true
          );
          setIsLoading(false);
        } else {
          onExtracted(labels.fetchResultFailed, false);
          setIsLoading(false);
        }
      } else if (res.ok && data.status === "queued" && data.jobId) {
        // ✅ Job 생성 → 폴링 시작
        console.log("폴링 시작");
        const jobId = data.jobId;

        const poll = async () => {
          const pollRes = await fetch(`${apiBaseUrl}/youtube/status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ jobId, url: textInput }), // ✅ url 함께 전송
          });

          const pollData = await pollRes.json();
          // console.log(pollData.status);
          // console.log("pollData", pollData);

          if (pollData.status !== "processing") {
            setIsLoading(false);
          }

          if (pollRes.ok && pollData.status === "completed") {
            if (typeof pollData.result === "string") {
              onExtracted(
                `${labels.youtubeExtractPrefix}\n\n${pollData.result}`,
                true
              );
              setIsLoading(false);
            } else {
              onExtracted(labels.fetchResultFailed, false);
              setIsLoading(false);
            }
          } else if (pollData.status === "failed") {
            onExtracted(labels.youtubeTranscriptFailed, false);
            setIsLoading(false);
          } else if (pollData.status === "error") {
            onExtracted(labels.requestError, false);
            setIsLoading(false);
          } else {
            setTimeout(poll, 1000); // 계속 폴링
          }
        };

        poll();
      } else {
        onExtracted(labels.requestFailed, false);
        setIsLoading(false);
      }
    } catch (error: unknown) {
      console.error("❌ 유튜브 요청 중 에러 발생:", error);
      onExtracted(labels.networkError, false);
      setIsLoading(false);
    }
  };

  const handleWebsiteSubmit = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/website/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: textInput }),
      });

      const data = await res.json();
      console.log("초기 응답:", data.status);

      if (res.ok && data.status === "cached") {
        // ✅ 캐시된 결과 바로 사용
        onExtracted(
          `${labels.websiteExtractPrefix}\n\n${data.result}`,
          true
        );
        setIsLoading(false);
      } else if (res.ok && data.status === "queued" && data.jobId) {
        // ✅ Job 큐에 들어감 → 폴링 시작
        const jobId = data.jobId;

        const poll = async () => {
          const pollRes = await fetch(`${apiBaseUrl}/website/status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ jobId, url: textInput }), // ✅ url 함께 전송
          });

          const pollData = await pollRes.json();
          console.log("폴링 응답:", pollData.status);

          if (pollData.status !== "processing") {
            setIsLoading(false);
          }

          if (pollRes.ok && pollData.status === "completed") {
            onExtracted(
              `${labels.websiteExtractPrefix}\n\n${pollData.result}`,
              true
            );
            setIsLoading(false);
          } else if (pollData.status === "failed") {
            onExtracted(labels.websiteExtractFailed, false);
            setIsLoading(false);
          } else if (pollData.status === "error") {
            onExtracted(labels.requestError, false);
            setIsLoading(false);
          } else if (pollData.status === "not_found") {
            // 🔥 추가!
            onExtracted(labels.requestNotFound, false);
            setIsLoading(false);
          } else {
            setTimeout(poll, 1000); // 계속 폴링
          }
        };

        poll();
      } else {
        onExtracted(labels.requestFailed, false);
        setIsLoading(false);
        setIsLoading(false);
      }
    } catch (error: unknown) {
      console.error("❌ 웹사이트 요청 중 에러 발생:", error);
      setIsLoading(false);
      onExtracted(
        labels.websiteErrorRetry,
        false
      );
      setIsLoading(false);
    }
  };

  const handleOcrFileUpload = async () => {
    if (!fileInput) {
      setAlertText(labels.noFile);
      setOpenAlert(true);
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput);
    formData.append("lang", locale); // OCR 서버에서 lang 파라미터 수신

    try {
      const res = await fetch(`${apiBaseUrl}/ocr/extract`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        if (data.result.trim() === "") {
          setOpenOcrSuggest(true);
          return;
        }
        onExtracted(`${labels.ocrExtractPrefix}\n\n${data.result}`, true);
      } else {
        console.log(data);
        onExtracted(labels.ocrFailed, false);
      }
    } catch (e) {
      console.error("OCR 업로드 에러:", e);
      onExtracted(labels.ocrUploadFailed, false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSubmit = async () => {
    if (!fileInput) {
      setAlertText(labels.noFile);
      setOpenAlert(true);
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput);
    console.log(formData.get("file"));

    const ext = fileInput.name.split(".").pop()?.toLowerCase();
    console.log("ext:", ext);

    try {
      if (ext === "ocr" || ext === "png" || ext === "jpg" || ext === "jpeg") {
        await handleOcrFileUpload();
        return;
      }
      const res = await fetch(`${apiBaseUrl}/file/extract`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        if (data.result.trim() === "") {
          setOpenOcrSuggest(true);
          return;
        }
        onExtracted(
          `${labels.fileExtractPrefix}\n\n${data.result}`,
          true
        );
      } else {
        console.log(data);
        onExtracted(labels.fileProcessFailed, false);
      }
    } catch (e) {
      console.error("파일 업로드 에러:", e);
      onExtracted(labels.fileUploadFailed, false);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit =
    isLoading ||
    ([SourceType.YOUTUBE, SourceType.WEBSITE, SourceType.MANUAL].includes(type) && !textInput.trim()) ||
    (type === SourceType.FILE && !fileInput);

  const handleOcrConfirm = async () => {
    await handleOcrFileUpload();
  };

  const renderInputField = () => {
    if (type === SourceType.YOUTUBE || type === SourceType.WEBSITE) {
      return (
        <div className="w-full max-w-3xl mx-auto">
          <div className="rounded-xl bg-primary/5 dark:bg-[#18181c] p-6 space-y-4">
            <div className="text-left">
              <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">
                {type === SourceType.YOUTUBE ? labels.youtubeLabel : labels.websiteLabel}
              </label>
              <input
                type="text"
                placeholder={
                  type === SourceType.YOUTUBE
                    ? "https://www.youtube.com/watch?v=..."
                    : "https://example.com/article"
                }
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              />
            </div>

            {type === SourceType.WEBSITE && (
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {labels.websiteHint}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (type === SourceType.FILE) {
      return <UploadCard onFileSelected={(file) => setFileInput(file)} />;
    }

    if (type === SourceType.MANUAL) {
      return null;
    }

    return null;
  };

  return (
    <div className="space-y-6 w-full max-w-3xl mx-auto text-center">
      <Alert text={alertText} open={openAlert} onOpenChange={setOpenAlert} />
      <OcrSuggestDialog
        open={openOcrSuggest}
        onOpenChange={setOpenOcrSuggest}
        onOcrConfirm={handleOcrConfirm}
        onOpenOcrHelp={() => setOpenOcrHelp(true)}
      />
      <OcrHelpDialog open={openOcrHelp} onOpenChange={setOpenOcrHelp} />
      {renderInputField()}
      {type !== SourceType.MANUAL && (
        <div className="flex justify-center mt-5">
          <button
            disabled={canSubmit}
            onClick={handleSubmit}
            className={clsx(
              "group flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all duration-200",
              "text-white bg-black hover:bg-gray-800 hover:shadow-md",
              (canSubmit || isLoading) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Icon
                  icon="lucide:loader"
                  className="animate-spin"
                  width={18}
                />
                {labels.processing}
              </>
            ) : (
              <>
                <span>{labels.extractButton}</span>
                <Icon
                  icon="lucide:arrow-right"
                  width={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
