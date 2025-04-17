import FeatureItem from "./FeatureItem";

export default function PricingSection() {
  return (
    <section className="bg-gradient-to-b from-background via-secondary to-accent dark:via-[#1c1f26] dark:from-[#1a1d23] dark:to-[#1b1f26]">
      <div className="py-16 px-4 mx-auto max-w-7xl lg:py-24 lg:px-6">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-text dark:text-white leading-snug">
            지식이 완성되는 순간을 경험하세요.
          </h2>
          <p className="mb-2 text-lg font-semibold text-primary dark:text-primary">
            플랜을 선택하세요
          </p>
          <p className="mb-6 font-normal text-muted-foreground sm:text-xl">
            한 번의 클릭으로 핵심정리부터 다이어그램까지 <br />
            중요한 정보만 선명하게 남겨보세요.
          </p>
        </div>

        <div className="w-full flex justify-center">
          <div className="w-full max-w-5xl grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {/* Basic Plan */}
            <div className="grow h-full w-full flex flex-col justify-between p-6 bg-card text-text border border-border rounded-2xl shadow-md hover:shadow-xl transition-shadow">
              <div>
                <h2 className="mb-4 text-2xl font-semibold text-center">Basic 플랜</h2>
                <div className="text-center bg-secondary rounded-xl p-6 mb-10">
                  <div className="text-4xl font-extrabold mb-2">$0</div>
                  <p className="font-normal text-muted-foreground">무료로 시작해보세요</p>
                </div>
                <ul className="mb-6 space-y-3 text-left">
                  <FeatureItem text="하루 3회 핵심정리 가능" />
                  <FeatureItem text="YouTube 추출 1회 (하루)" />
                  <FeatureItem text="웹사이트 요약 무제한" />
                  <FeatureItem text="직접 입력 요약 무제한" />
                  <FeatureItem text="자동 다이어그램 생성" />
                  <FeatureItem text="최근 3개 핵심정리 저장" />
                  <FeatureItem text="AI기반 자동 키워드 추출" />
                  <FeatureItem text="다이어그램 편집 가능" disabled />
                  <FeatureItem text="PDF 내보내기 가능" disabled />
                  <FeatureItem text="이미지 OCR 요약" disabled />
                  <FeatureItem text="GPT로 심화 질문하기" disabled />
                </ul>
              </div>
              <div className="text-center">
                <button className="w-full text-white bg-muted-foreground hover:bg-muted focus:ring-4 focus:ring-border font-medium rounded-lg text-sm px-5 py-2.5">
                  현재 사용 중
                </button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="grow h-full w-full flex flex-col justify-between p-6 bg-card text-text border-2 border-primary rounded-2xl shadow-md hover:shadow-xl transition-shadow">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-primary dark:text-primary">Pro 플랜</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center bg-secondary rounded-xl p-6">
                  <div className="text-4xl font-extrabold mb-3">$36</div>
                  <div className="text-sm text-muted-foreground">3개월 (월 $12)</div>
                </div>
                <div className="relative text-center bg-primary/10 border border-primary rounded-xl p-4 pt-6">
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                    🔥 추천
                  </span>
                  <div className="text-4xl font-extrabold text-primary">$96</div>
                  <div className="text-sm font-medium text-primary">
                    연간 (월 $8)
                    <br />
                    <span className="text-sm font-bold text-primary-hover">
                      33% 할인
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <ul className="mb-6 space-y-3 text-left">
                  <FeatureItem text="핵심정리 무제한 이용" />
                  <FeatureItem text="YouTube 추출 무제한" />
                  <FeatureItem text="웹사이트/문서/직접입력 무제한 요약" />
                  <FeatureItem text="자동 다이어그램 생성" />
                  <FeatureItem text="핵심정리 무제한 저장" />
                  <FeatureItem text="AI기반 자동 키워드 추출" />
                  <FeatureItem text="다이어그램 편집 가능" />
                  <FeatureItem text="PDF 내보내기 가능" />
                  <FeatureItem text="이미지 OCR 요약 기능" />
                  <FeatureItem text="GPT로 심화 질문하기" />
                </ul>
              </div>

              <div className="flex justify-between gap-4">
                <button className="w-1/2 text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:ring-ring font-medium rounded-lg text-sm px-4 py-2">
                  3개월 구독
                </button>
                <button className="w-1/2 text-white bg-primary-hover hover:bg-primary focus:ring-4 focus:ring-ring font-medium rounded-lg text-sm px-4 py-2">
                  연간 구독
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}