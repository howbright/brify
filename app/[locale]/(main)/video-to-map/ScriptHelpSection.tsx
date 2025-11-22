import { Icon } from "@iconify/react";
import Image from "next/image";

type ScriptHelpSectionProps = {
  isHelpOpen: boolean;
  onToggle: () => void;
};

export default function ScriptHelpSection({
  isHelpOpen,
  onToggle,
}: ScriptHelpSectionProps) {
  return (
    <section
      className={`
        rounded-3xl border border-neutral-200 bg-white
        shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)]
        backdrop-blur-sm
        dark:bg-[#020818] dark:border-white/15
        transition-all duration-300 ease-out
        ${isHelpOpen ? "p-4 md:p-5" : "p-3 md:p-3.5"}
      `}
    >
      {/* 헤더: 항상 보이는 영역 (뱃지 + 타이틀 + 한 줄 요약 + 아이콘) */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={isHelpOpen}
      >
        <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
          <span className="text-[11px] px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 dark:border-[rgb(var(--hero-b))]/40 dark:bg-white/5 dark:text-[rgb(var(--hero-b))]">
            도움말
          </span>
          <h2
            className="
              text-sm md:text-base font-semibold text-neutral-900 dark:text-white
              whitespace-normal md:whitespace-wrap
            "
          >
            영상 스크립트 가져오는 방법
          </h2>
          <p className="text-[11px] md:text-xs text-neutral-500 dark:text-neutral-400">
            YouTube 스크립트를 복사하는 방법을 안내해 드려요.
          </p>
        </div>

        <Icon
          icon="mdi:chevron-down"
          className={`
            h-5 w-5 shrink-0
            transition-transform duration-200 ease-out
            ${isHelpOpen ? "rotate-180" : ""}
          `}
        />
      </button>

      {/* 토글되는 본문 래퍼: 높이 애니메이션 + 잘림 담당 */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${isHelpOpen ? "mt-4 max-h-[520px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        {/* 실제 스크롤이 생기는 영역 */}
        <div className="max-h-[380px] md:max-h-[430px] overflow-y-auto pr-1">
          <div className="space-y-5 text-xs md:text-sm text-neutral-700 dark:text-neutral-200">
            {/* 블럭 A: YouTube에서 스크립트 가져오기 */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm md:text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                  YouTube에서 스크립트 가져오기 (PC 기준)
                </h3>
                <p className="mt-1 text-[11px] md:text-xs text-neutral-500 dark:text-neutral-400">
                  아래 순서를 천천히 따라오시면 1–2분 안에 스크립트를 가져오실
                  수 있어요.
                </p>
              </div>

              {/* Step 1 */}
              <div className="flex gap-3 md:gap-4 items-start">
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700 dark:bg-white/5 dark:text-[rgb(var(--hero-b))]">
                  1
                </div>
                <div className="flex-1 space-y-2">
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">
                    영상 아래의{" "}
                    <span className="font-semibold">&quot;···&quot;</span> 또는{" "}
                    <span className="font-semibold">&quot;더보기&quot;</span>{" "}
                    버튼을 눌러 주세요.
                  </p>
                  <p className="text-[11px] md:text-xs text-neutral-600 dark:text-neutral-400">
                    영상 제목 아래, 좋아요/공유 버튼 옆에 있는 점 세 개(···)
                    버튼 또는 &quot;더보기&quot; 버튼을 찾으시면 돼요.
                  </p>
                  <div className="mt-1 overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-white/15 bg-neutral-50/60 dark:bg-black/40">
                    <Image
                      src="/images/help/youtube-step1-watch-page.png"
                      alt="YouTube 재생 화면에서 더보기(···) 버튼 위치 안내"
                      width={640}
                      height={360}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3 md:gap-4 items-start">
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700 dark:bg-white/5 dark:text-[rgb(var(--hero-b))]">
                  2
                </div>
                <div className="flex-1 space-y-2">
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">
                    메뉴에서 <strong>&quot;대본 보기&quot;</strong> 또는{" "}
                    <strong>&quot;Transcript&quot;</strong>를 선택해 주세요.
                  </p>
                  <p className="text-[11px] md:text-xs text-neutral-600 dark:text-neutral-400">
                    펼쳐진 메뉴 안에서 &quot;대본 보기&quot;, &quot;자막&quot;,
                    &quot;Transcript&quot;와 같은 이름의 항목을 눌러 주세요.
                  </p>
                  <div className="mt-1 overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-white/15 bg-neutral-50/60 dark:bg-black/40">
                    <Image
                      src="/images/help/youtube-step2-menu.png"
                      alt="YouTube 메뉴에서 대본 보기(Transcript) 선택 화면"
                      width={640}
                      height={360}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3 md:gap-4 items-start">
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700 dark:bg-white/5 dark:text-[rgb(var(--hero-b))]">
                  3
                </div>
                <div className="flex-1 space-y-2">
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">
                    오른쪽에 열린 대본을 전체 선택해서 복사해 주세요.
                  </p>
                  <div className="text-[11px] md:text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                    <p>1. 대본 첫 줄을 한 번 클릭합니다.</p>
                    <p>
                      2. 스크롤로 맨 아래까지 내린 뒤,{" "}
                      <span className="font-medium">
                        반드시 Shift 키를 누른 상태에서
                      </span>{" "}
                      마지막 줄을 한 번 클릭하면 대본 전체가 선택돼요.
                    </p>
                    <p>
                      3. 그런 다음 <span className="font-medium">Ctrl + C</span>{" "}
                      (Mac은 <span className="font-medium">⌘ + C</span>)를 눌러
                      복사해 주세요.
                    </p>
                    <p className="mt-1">
                      ※ <span className="font-medium">Ctrl + A</span>는 페이지
                      전체를 선택해 버려서, 대본만 복사할 때는 사용하지 않는 걸
                      추천드려요.
                    </p>
                  </div>
                  <div className="mt-1 overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-white/15 bg-neutral-50/60 dark:bg-black/40">
                    <Image
                      src="/images/help/youtube-step3-transcript.png"
                      alt="YouTube Transcript 패널 전체 선택 화면"
                      width={640}
                      height={360}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3 md:gap-4 items-start">
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700 dark:bg-white/5 dark:text-[rgb(var(--hero-b))]">
                  4
                </div>
                <div className="flex-1 space-y-2">
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">
                    이 페이지의 <strong>왼쪽 입력창</strong>에 붙여넣어 주세요.
                  </p>
                  <p className="text-[11px] md:text-xs text-neutral-600 dark:text-neutral-400">
                    &quot;영상 스크립트 붙여넣기&quot; 입력창을 클릭하신 뒤,{" "}
                    <span className="font-medium">Ctrl + V</span> (Mac은{" "}
                    <span className="font-medium">⌘ + V</span>)로 붙여넣어
                    주시면 준비가 완료돼요.
                  </p>
                  <div className="mt-1 overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-white/15 bg-neutral-50/60 dark:bg-black/40">
                    <Image
                      src="/images/help/youtube-step4-paste.png"
                      alt="영상 스크립트 붙여넣기 입력창에 텍스트를 붙여넣는 화면"
                      width={640}
                      height={360}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 구분선 */}
            <div className="h-px bg-neutral-200/80 dark:bg-white/10" />

            {/* 블럭 B: 자막 파일 / 편집툴 / 이미 있는 스크립트 */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm md:text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">
                  자막 파일이나 편집툴에서 가져오고 싶으신가요?
                </h3>
                <p className="mt-1 text-[11px] md:text-xs text-neutral-500 dark:text-neutral-400">
                  이미 작업 중인 프로젝트가 있어도, 텍스트만 복사해서 그대로
                  붙여넣으시면 괜찮아요.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* 케이스 1 */}
                <div className="flex gap-2.5 items-start">
                  <div className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-md bg-neutral-100 text-[10px] font-semibold text-neutral-700 dark:bg-white/10 dark:text-neutral-100">
                    ①
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[12px] md:text-[13px] text-neutral-900 dark:text-neutral-50">
                      편집툴(프리미어, 캡컷 등)에서 자막·대본 복사
                    </p>
                    <p className="mt-0.5 text-[11px] md:text-xs text-neutral-600 dark:text-neutral-400">
                      타임라인에 있는 자막 텍스트를 전체 선택해서 복사한 뒤,
                      왼쪽 입력창에 붙여넣어 주세요.
                    </p>
                  </div>
                </div>

                {/* 케이스 2 */}
                <div className="flex gap-2.5 items-start">
                  <div className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-md bg-neutral-100 text-[10px] font-semibold text-neutral-700 dark:bg:white/10 dark:text-neutral-100">
                    ②
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[12px] md:text-[13px] text-neutral-900 dark:text-neutral-50">
                      자막 파일(srt, vtt 등)을 텍스트로 열기
                    </p>
                    <p className="mt-0.5 text-[11px] md:text-xs text-neutral-600 dark:text-neutral-400">
                      srt·vtt 파일을 메모장/텍스트 편집기로 열면 시간 정보와
                      함께 대사가 들어 있어요. 필요한 부분의 대사 텍스트를
                      복사해서 붙여넣어 주시면 돼요.
                    </p>
                  </div>
                </div>

                {/* 케이스 3 */}
                <div className="flex gap-2.5 items-start">
                  <div className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-md bg-neutral-100 text-[10px] font-semibold text-neutral-700 dark:bg-white/10 dark:text-neutral-100">
                    ③
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[12px] md:text-[13px] text-neutral-900 dark:text-neutral-50">
                      이미 정리해 두신 스크립트 문서 사용
                    </p>
                    <p className="mt-0.5 text-[11px] md:text-xs text-neutral-600 dark:text-neutral-400">
                      블로그, 워드, 노션 등 어디에 적어 두신 스크립트든
                      상관없어요. 전체 텍스트를 복사해서 그대로 붙여넣어 주시면
                      됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 구분선 (얇게) */}
            <div className="h-px bg-neutral-200/60 dark:bg-white/10" />

            {/* 블럭 C: 작은 FAQ / 팁 */}
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 p-3 text-[11px] md:text-xs text-neutral-700 dark:border-white/15 dark:bg-white/5 dark:text-neutral-200">
              <p className="font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
                Q. &quot;대본 보기&quot; / &quot;Transcript&quot; 메뉴가 안
                보여요.
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>
                  일부 영상은 제작자가 대본 노출을 막아 둔 경우일 수 있어요.
                </li>
                <li>
                  자막이 아예 없는 영상이거나, 라이브/실시간 스트리밍 영상일
                  수도 있어요.
                </li>
                <li>
                  이런 경우에는 직접 들으면서 정리하시거나, 별도의 자막 생성
                  도구를 사용해 보셔야 해요.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
