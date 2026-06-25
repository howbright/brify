import Footer from "@/components/layout/Footer";

export default function PublicCleanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <div className="lg:ml-[264px] lg:w-[calc(100%-264px)]">
        <Footer />
      </div>
    </>
  );
}
