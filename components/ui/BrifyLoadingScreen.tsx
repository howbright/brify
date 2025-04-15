import Image from "next/image";
export default function Loading() {

  return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#f4f7f8] dark:bg-[#111827] text-[#1f1f1f] dark:text-white">
        <div className="animate-pulse mb-6">
          <Image
            src="/images/logo.png"
            alt="Brify Logo"
            width={100}
            height={100}
            className="opacity-90"
          />
        </div>
        </div>
  );
}
