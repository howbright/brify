import FeatureItem from "./FeatureItem";

export default function PricingSection() {
  return (
    <section className="bg-gradient-to-b from-white via-blue-50 to-blue-100 dark:via-gray-800 dark:from-gray-900 dark:to-gray-800">
      <div className="py-12 px-4 mx-auto max-w-screen-xl lg:py-20 lg:px-6">
        <div className="mx-auto max-w-screen-md text-center mb-12">
          <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
            지식이 완성되는 순간을 경험하세요.
          </h2>
          <p className="mb-2 text-lg font-semibold text-primary-600 dark:text-primary-400">
            플랜을 선택하세요
          </p>
          <p className="mb-5 font-normal text-gray-500 sm:text-xl dark:text-gray-400">
            한 번의 클릭으로 핵심정리부터 다이어그램까지 <br />
            중요한 정보만 선명하게 남겨보세요.
          </p>
        </div>

        <div className="w-full flex justify-center">
          <div className="w-full max-w-[900px] grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {/* Free Plan */}
            <div className="flex-grow h-full w-full flex flex-col justify-between p-6 mx-auto text-gray-900 bg-white rounded-2xl border border-gray-200 shadow-xl hover:shadow-2xl transition-shadow dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <div>
                <h2 className="mb-2 text-2xl font-semibold text-center">
                  Basic 플랜
                </h2>
                <div className="text-center bg-gray-100 dark:bg-gray-700 rounded-xl p-6 mb-10 mt-10">
                  <div className="text-4xl font-extrabold mb-2 text-center">
                    $0
                  </div>
                  <p className="text-center font-normal text-gray-500 sm:text-lg dark:text-gray-400">
                    무료로 시작해보세요
                  </p>
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
                <button className="w-full text-white bg-gray-400 hover:bg-gray-500 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-gray-900">
                  현재 사용 중
                </button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="flex-grow h-full w-full flex flex-col justify-between p-6 mx-auto text-gray-900 bg-white border border-primary-500 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow dark:border-primary-500 dark:bg-gray-800 dark:text-white">
              {/* 1. 상단 Pro 라벨 */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-400">
                  Pro 플랜
                </h2>
              </div>

              {/* 2. 가격 비교 행 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center bg-gray-100 dark:bg-gray-700 rounded-xl p-6 flex flex-col items-center justify-center">
                  <div className="text-4xl font-extrabold mb-3">$36</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    3개월 (월 $12)
                  </div>
                </div>
                <div className="relative text-center bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-500 rounded-xl p-4 pt-6">
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                    🔥 추천
                  </span>
                  <div className="text-4xl font-extrabold text-blue-900 dark:text-blue-100">
                    $96
                  </div>
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    연간 (월 $8)
                    <br />
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-300">
                      33% 할인
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. 기능 리스트 */}
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

              {/* 4. 하단 구독 버튼 */}
              <div className="flex justify-between gap-4">
                <button className="w-1/2 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-500 dark:hover:bg-primary-600 dark:focus:ring-primary-800">
                  3개월 구독
                </button>
                <button className="w-1/2 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800">
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
