"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import "react-multi-carousel/lib/styles.css";
import { useTranslations } from "next-intl";

const Carousel = dynamic(() => import("react-multi-carousel"), { ssr: false });

const responsive = {
  superLargeDesktop: { breakpoint: { max: 4000, min: 1024 }, items: 3 },
  desktop: { breakpoint: { max: 1024, min: 768 }, items: 2 },
  tablet: { breakpoint: { max: 768, min: 464 }, items: 1 },
  mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
};

const Needs1 = () => {
  const t = useTranslations("slides");
  const t2 = useTranslations("carouselIntro");

  const slides = [
    { src: "/images/slide1.jpg", title: t("slide1") },
    { src: "/images/slide2.jpg", title: t("slide2") },
    { src: "/images/slide3.jpg", title: t("slide3") },
    { src: "/images/slide4.jpg", title: t("slide4") },
    { src: "/images/slide5.jpg", title: t("slide5") },
  ];

  return (
    <section className="relative flex justify-center z-10 bg-gradient-to-b from-[#fffdf7] to-[#fdf0e6] py-14">
      <div className="w-full max-w-7xl px-4">
        {/* 👉 타이틀 문구 */}
        <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-7">
          {t2("title")}
        </h2>

        {/* 👉 디스크립션 문구 */}
        <p className="mt-4 text-base md:text-lg text-center text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-7">
          {t2("description")}
        </p>

        {/* 👉 슬라이드 */}
        <Carousel
          responsive={responsive}
          infinite={true}
          autoPlay={true}
          autoPlaySpeed={2500}
          keyBoardControl={true}
          showDots={false}
          customTransition="all 0.5s"
          transitionDuration={500}
          itemClass="px-4"
        >
          {slides.map((item, index) => (
            <div
              key={index}
              className="relative w-full h-60 overflow-hidden rounded-xl shadow-md"
            >
              {/* 이미지 */}
              <Image
                src={item.src}
                alt={item.title}
                width={400}
                height={240}
                className="object-cover w-full h-full"
              />

              {/* 오버레이 텍스트 */}
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t h-28 from-black/90 via-black/70 to-transparent px-4 py-3">
                <p className="text-white text-3xl sm:text-3xl font-semibold drop-shadow">
                  {item.title}
                </p>
              </div>
            </div>
          ))}
        </Carousel>
        {/* 👉 유튜브 URL 입력 필드 */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
          <input
            type="url"
            placeholder="YouTube 영상 링크를 입력하세요"
            className="w-full sm:w-[400px] px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-black dark:text-white dark:border-white/20"
          />
          <button
            type="button"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition"
          >
            영상 핵심요약하기
          </button>
        </div>
      </div>
    </section>
  );
};

export default Needs1;
