"use client";

import Alert from "@/components/ui/Alert";
import { getYouTubeVideoId } from "@/lib/utils";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useState } from "react";
import { SourceType } from "./SourceTabs";
import UploadCard from "./UploadCard";
import OcrSuggestDialog from "./OcrSuggestDialog";
import OcrHelpDialog from "./OcrHelpDialog";

interface Props {
  type: SourceType;
  onExtracted: (text: string, succeed: boolean) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  onManualSubmit?: (text: string) => void; // 🔹 요약용 콜백
}

export default function InputSection({
  type,
  onExtracted,
  isLoading,
  setIsLoading,
  onManualSubmit,
}: Props) {
  const [textInput, setTextInput] = useState<string>("");
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [openAlert, setOpenAlert] = useState<boolean>(false);
  const [openOcrSuggest, setOpenOcrSuggest] = useState<boolean>(false);
  const [openOcrHelp, setOpenOcrHelp] = useState<boolean>(false);
  const [alertText, setAlertText] = useState<string>("");
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = async () => {
    if (type === "file" && !fileInput) {
      setAlertText("파일이 선택되지 않았습니다."); // ⚡ 추가: 업로드 전 파일 체크
      setOpenAlert(true);
      return;
    }
    setIsLoading(true);
    onExtracted("", false);
    try {
      if (type === "manual") return handleManualSubmit();
      if (type === "youtube") return handleYoutubeSubmit();
      if (type === "website") return handleWebsiteSubmit();
      if (type === "file") return handleFileSubmit();
    } catch (err) {
      console.error(err);
      onExtracted("⚠️ 처리 중 오류가 발생했습니다.", false);
      setIsLoading(false);
    } finally {
      // setIsLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!textInput || textInput.trim().length === 0) {
      onExtracted("❌ 입력된 텍스트가 없습니다.", false);
      setIsLoading(false);
      return;
    }

    onManualSubmit?.(textInput.trim());
  };

  const handleYoutubeSubmit = async () => {
    try {
      const videoId = getYouTubeVideoId(textInput);
      if (!videoId) {
        setAlertText("유효한 Youtube 링크가 아닙니다.");
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
            `🔗 유튜브 영상에서 추출한 스크립트입니다.\n\n${data.result}`,
            true
          );
          setIsLoading(false);
        } else {
          onExtracted("❌ 결과를 불러오는 데 문제가 발생했습니다.", false);
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
          console.log(pollData.status);
          console.log("pollData", pollData);

          if (pollData.status !== "processing") {
            setIsLoading(false);
          }

          if (pollRes.ok && pollData.status === "completed") {
            if (typeof pollData.result === "string") {
              onExtracted(
                `🔗 유튜브 영상에서 추출한 스크립트입니다.\n\n${pollData.result}`,
                true
              );
              setIsLoading(false);
            } else {
              onExtracted("❌ 결과를 불러오는 데 문제가 발생했습니다.", false);
              setIsLoading(false);
            }
          } else if (pollData.status === "failed") {
            onExtracted("❌ 유튜브 스크립트 추출에 실패했습니다.", false);
            setIsLoading(false);
          } else if (pollData.status === "error") {
            onExtracted("❌ 요청 처리 중 오류가 발생했습니다.", false);
            setIsLoading(false);
          } else {
            setTimeout(poll, 1000); // 계속 폴링
          }
        };

        poll();
      } else {
        onExtracted("❌ 요청 처리에 실패했습니다.", false);
        setIsLoading(false);
      }
    } catch (e: any) {
      console.error("❌ 유튜브 요청 중 에러 발생:", e);

      // 에러 상세 정보 로그
      if (e.response) {
        console.error("응답 상태:", e.response.status);
        console.error("응답 데이터:", await e.response.text?.());
      }

      // 사용자에게도 알려주기
      onExtracted("❌ 네트워크 오류가 발생했습니다. 다시 시도해주세요.", false);
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
          `🌐 웹사이트에서 추출한 본문입니다.\n\n${data.result}`,
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
              `🌐 웹사이트에서 추출한 본문입니다.\n\n${pollData.result}`,
              true
            );
            setIsLoading(false);
          } else if (pollData.status === "failed") {
            onExtracted("❌ 웹사이트 본문 추출에 실패했습니다.", false);
            setIsLoading(false);
          } else if (pollData.status === "error") {
            onExtracted("❌ 요청 처리 중 오류가 발생했습니다.", false);
            setIsLoading(false);
          } else if (pollData.status === "not_found") {
            // 🔥 추가!
            onExtracted("❌ 요청을 찾을 수 없습니다. (Job ID 없음)", false);
            setIsLoading(false);
          } else {
            setTimeout(poll, 1000); // 계속 폴링
          }
        };

        poll();
      } else {
        onExtracted("❌ 요청 처리에 실패했습니다.", false);
        setIsLoading(false);
        setIsLoading(false);
      }
    } catch (e: any) {
      console.error("❌ 웹사이트 요청 중 에러 발생:", e);
      setIsLoading(false);

      // 에러 상세 정보 로그
      if (e.response) {
        console.error("응답 상태:", e.response.status);
        console.error("응답 데이터:", await e.response.text?.());
      }

      // 사용자에게도 알려주기
      onExtracted(
        "❌ 웹사이트 요청 중 에러 발생했습니다. 다시 시도해주세요.",
        false
      );
      setIsLoading(false);
    }
  };

  const handleOcrFileUpload = async () => {

    if (!fileInput) {
      setAlertText("파일이 선택되지 않았습니다.");
      setOpenAlert(true);
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput);
  
    // 언어 자동 설정 예시 (locale에 따라)
    const userLang = navigator.language.startsWith('ko') ? 'kor+eng' : 'eng';
  
    formData.append("lang", userLang); // OCR 서버에서 lang 파라미터 수신
  
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
        onExtracted(
          `📷 OCR로 추출한 본문입니다.\n\n${data.result}`,
          true
        );
      } else {
        console.log(data);
        onExtracted("❌ OCR 처리에 실패했습니다.", false);
      }
    } catch (e) {
      console.error("OCR 업로드 에러:", e);
      onExtracted("❌ OCR 업로드 중 오류 발생", false);
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleFileSubmit = async () => {
    if (!fileInput) {
      setAlertText("파일이 선택되지 않았습니다.");
      setOpenAlert(true);
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput);
    console.log(formData.get("file"));

    const ext = fileInput.name.split(".").pop()?.toLowerCase();
    console.log('ext:', ext)

    try {
      if (ext === 'ocr' || ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
        await handleOcrFileUpload();
        return;
      }
      const res = await fetch(`${apiBaseUrl}/file/extract`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        if(data.result.trim() === ''){
          setOpenOcrSuggest(true);
          return;
        }
        onExtracted(
          `📄 업로드한 파일에서 추출한 본문입니다.\n\n${data.result}`,
          true
        );
      } else {
        console.log(data)
        onExtracted("❌ 파일 처리에 실패했습니다.", false);
      }
    } catch (e) {
      console.error("파일 업로드 에러:", e);
      onExtracted("❌ 파일 업로드 중 오류 발생", false);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit =
    isLoading ||
    (["youtube", "website", "manual"].includes(type) && !textInput.trim()) ||
    (type === "file" && !fileInput);

   const handleOcrConfirm = async() => {
    alert('ocr신청함')
   }

  const renderInputField = () => {
    if (type === "youtube" || type === "website") {
      return (
        <div className="w-full max-w-3xl mx-auto">
          <div className="rounded-xl bg-primary/5 dark:bg-[#18181c] p-6 space-y-4">
            <div className="text-left">
              <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">
                {type === "youtube" ? "YouTube 영상 주소" : "웹사이트 주소"}
              </label>
              <input
                type="text"
                placeholder={
                  type === "youtube"
                    ? "https://www.youtube.com/watch?v=..."
                    : "https://example.com/article"
                }
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              />
            </div>

            {type === "website" && (
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                대부분의 웹사이트는 요약이 가능하지만, 일부 로그인 필요하거나
                보안 설정된 사이트는 지원되지 않을 수 있어요.
              </p>
            )}
          </div>
        </div>
      );
    }

    if (type === "file") {
      return <UploadCard onFileSelected={(file) => setFileInput(file)} />;
    }

    if (type === "manual") {
      return (
        <div className="w-full max-w-3xl mx-auto">
          <div className="rounded-xl bg-primary/5 dark:bg-[#18181c] p-6 space-y-4">
            <div className="text-left">
              <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">
                직접 입력
              </label>
              <textarea
                rows={6}
                placeholder="직접 입력하거나 붙여넣기 해주세요"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full border border-gray-300 dark:border-white/20 p-3 rounded-lg bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="text-primary font-semibold">Tip:</span>{" "}
              편집하거나 수정한 후 요약을 시작할 수 있어요.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 w-full max-w-3xl mx-auto text-center">
      <Alert text={alertText} open={openAlert} onOpenChange={setOpenAlert} />
      <OcrSuggestDialog open={openOcrSuggest} onOpenChange={setOpenOcrSuggest} onOcrConfirm={handleOcrConfirm} onOpenOcrHelp={() => setOpenOcrHelp(true)} />
      <OcrHelpDialog open={openOcrHelp} onOpenChange={setOpenOcrHelp}/>
      {renderInputField()}

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
              <Icon icon="lucide:loader" className="animate-spin" width={18} />
              처리 중...
            </>
          ) : (
            <>
              <span>
                {type === "manual" ? "핵심정리 시작하기" : "원문 추출하기"}
              </span>
              <Icon
                icon="lucide:arrow-right"
                width={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
