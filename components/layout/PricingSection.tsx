export default function PricingSection() {
    return (
      <section className="bg-white dark:bg-gray-900">
        <div className="py-12 px-4 mx-auto max-w-screen-xl lg:py-20 lg:px-6">
          <div className="mx-auto max-w-screen-md text-center mb-12">
            <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
              요약과 다이어그램을 한 번에
            </h2>
            <p className="mb-5 font-normal text-gray-500 sm:text-xl dark:text-gray-400">
              지금 바로 시작해보세요. 필요한 기능은 Pro에서 모두 열려 있어요.
            </p>
          </div>
          <div className="w-full flex justify-center">
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {/* Free Plan */}
            <div className="w-full flex flex-col p-6 mx-auto text-center text-gray-900 bg-white rounded-2xl border border-gray-200 shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <h3 className="mb-4 text-2xl font-semibold">Free</h3>
              <p className="font-normal text-gray-500 sm:text-lg dark:text-gray-400">
                기본 기능을 체험해보고 싶다면
              </p>
              <div className="flex justify-center items-baseline my-6">
                <span className="mr-2 text-5xl font-extrabold">$0</span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <ul className="mb-6 space-y-3 text-left">
                <li>✅ 월 5회 요약 가능</li>
                <li>✅ 자동 다이어그램 생성</li>
                <li>✅ 최근 3개 요약 기록 저장</li>
                <li className="text-gray-400 line-through">❌ PDF 내보내기</li>
                <li className="text-gray-400 line-through">❌ 다이어그램 편집</li>
              </ul>
              <button className="w-full text-white bg-gray-400 hover:bg-gray-500 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-gray-900">
                현재 사용 중
              </button>
            </div>
  
            {/* Pro Plan */}
            <div className="w-full flex flex-col p-6 mx-auto text-center text-gray-900 bg-white border border-primary-500 rounded-2xl shadow-lg xl:p-8 dark:border-primary-500 dark:bg-gray-800 dark:text-white">
              <h3 className="mb-4 text-2xl font-semibold text-primary-600 dark:text-primary-400">Pro</h3>
              <p className="font-normal text-gray-500 sm:text-lg dark:text-gray-400">
                모든 기능을 무제한으로 즐기세요
              </p>
              <div className="flex justify-center items-baseline my-6">
                <span className="mr-2 text-5xl font-extrabold">$15</span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <ul className="mb-6 space-y-3 text-left">
                <li>✅ 무제한 요약</li>
                <li>✅ 다이어그램 편집 기능</li>
                <li>✅ PDF 다운로드</li>
                <li>✅ 폴더 정리 및 검색</li>
                <li>✅ GPT 기반 키워드 추출 및 질문 기능</li>
              </ul>
              <button className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-500 dark:hover:bg-primary-600 dark:focus:ring-primary-800">
                Pro로 업그레이드
              </button>
            </div>
          </div>
          </div>
        </div>
      </section>
    );
  }
  