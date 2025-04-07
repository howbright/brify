import { Icon } from "@iconify/react";
import FeatureItem from "./FeatureItem";

export default function PricingSection() {
  return (
    <section className="bg-gradient-to-b from-white via-blue-50 to-blue-100  dark:via-gray-800 dark:from-gray-900 dark:to-gray-800">
      <div className="py-12 px-4 mx-auto max-w-screen-xl lg:py-20 lg:px-6">
        <div className="mx-auto max-w-screen-md text-center mb-12">
          <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
            지식이 정리되는 순간을 경험하세요.
          </h2>
          <p className="mb-5 font-normal text-gray-500 sm:text-xl dark:text-gray-400">
            한 번의 클릭으로 요약부터 다이어그램까지 <br />
            중요한 정보만 선명하게 남겨보세요.
          </p>
        </div>
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[900px] grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {/* Free Plan */}
            <div className="flex-grow  h-full w-full max-w-[450px] flex flex-col p-6 mx-auto text-center text-gray-900 bg-white rounded-2xl border border-primary-500  shadow-xl hover:shadow-2xl transition-shadow dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <h2 className="mb-4 text-2xl font-semibold">Free</h2>
              <p className="font-normal text-gray-500 sm:text-lg dark:text-gray-400">
                기본 기능을 체험해보고 싶다면
              </p>
              <div className="flex justify-center items-baseline my-6">
                <span className="mr-2 text-5xl font-extrabold">$0</span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <ul className="mb-6 space-y-3 text-left">
                <FeatureItem text="월 5회 요약" />
                <FeatureItem text="자동 다이어그램 생성" />
                <FeatureItem text="최근 3개 요약 저장" />
                <FeatureItem text="AI기반 자동 키워드 추출" />
                <FeatureItem text="다이어그램 편집 가능" disabled />
                <FeatureItem text="PDF 내보내기 가능" disabled />
                <FeatureItem text="AI 활용 고급 정리 도구" disabled />
              </ul>
              <button className="w-full mt-2 text-white bg-gray-400 hover:bg-gray-500 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-gray-900">
                현재 사용 중
              </button>
            </div>

            {/* Pro Plan */}
            <div className="flex-grow  h-full w-full max-w-[450px] flex flex-col p-6 mx-auto text-center text-gray-900 bg-white border border-primary-500 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow xl:p-8 dark:border-primary-500 dark:bg-gray-800 dark:text-white">
              <h2 className="mb-4 text-2xl font-semibold text-primary-600 dark:text-primary-400">
                Pro
              </h2>
              <p className="font-normal text-gray-500 sm:text-lg dark:text-gray-400">
                모든 기능을 무제한으로 즐기세요
              </p>
              <div className="flex justify-center items-baseline my-6">
                <span className="mr-2 text-5xl font-extrabold">$15</span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <ul className="mb-6 space-y-3 text-left">
                <FeatureItem text="무제한 요약" />
                <FeatureItem text="자동 다이어그램 생성" />
                <FeatureItem text="요약 무제한 저장" />
                <FeatureItem text="AI기반 자동 키워드 추출" />
                <FeatureItem text="다이어그램 편집 가능" />
                <FeatureItem text="PDF 내보내기 가능" />
                <FeatureItem text="AI 활용 고급 정리 도구" />
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
