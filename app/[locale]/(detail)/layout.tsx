import Footer from "@/components/layout/FooterOld";
import Header from "@/components/layout/Header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div>{children}</div>
      <Footer/>
    </>
  );
}
