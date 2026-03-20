import Image from "next/image";
export default function Loading() {

  return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#f4f7f8] dark:bg-[#111827] text-[#1f1f1f] dark:text-white">
        <div className="animate-pulse mb-6 flex items-center gap-3">
          <Image
            src="/images/newlogo.png"
            alt="Brify Logo"
            width={512}
            height={512}
            className="h-10 w-10 opacity-90"
          />
          <span className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Brify
          </span>
        </div>
        </div>
  );
}
