import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

type Section = {
  id: string;
  title: string;
  paragraphs: string[];
  items?: string[];
};

type TermsCopy = {
  badge: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  summaryTitle: string;
  summaryBody: string;
  quickFacts: { label: string; value: string }[];
  sectionNavLabel: string;
  sections: Section[];
  contactTitle: string;
  contactBody: string;
  contactEmailLabel: string;
  relatedLinks: { href: string; label: string }[];
};

const KO_COPY: TermsCopy = {
  badge: "Brify 이용약관",
  title: "브리파이 서비스를 이용하기 전에 꼭 확인해 주세요",
  subtitle:
    "브리파이는 텍스트, 웹페이지, 유튜브 스크립트 등을 구조적으로 정리해 주는 서비스입니다. 아래 약관은 계정 이용, 입력 콘텐츠, AI 생성 결과, 크레딧 결제와 공유 기능에 대한 기본 기준을 설명합니다.",
  updatedAt: "최종 업데이트: 2026년 3월 30일",
  summaryTitle: "핵심 안내",
  summaryBody:
    "브리파이는 구독제가 아니라 크레딧 기반 서비스이며, 입력한 콘텐츠의 권리와 책임은 이용자에게 있습니다. AI 결과물은 보조 도구로 제공되므로 최종 검토는 이용자가 직접 해주셔야 합니다.",
  quickFacts: [
    { label: "이용 방식", value: "회원가입 후 약관 동의가 필요합니다." },
    { label: "결제 구조", value: "유료 크레딧 충전 후 기능별로 차감됩니다." },
    { label: "공유 범위", value: "공유 링크를 켜면 링크를 가진 누구나 읽기 전용으로 볼 수 있습니다." },
  ],
  sectionNavLabel: "주요 조항 빠르게 보기",
  sections: [
    {
      id: "purpose",
      title: "1. 목적 및 적용 범위",
      paragraphs: [
        "본 약관은 Brify(이하 “회사” 또는 “서비스”)가 제공하는 요약, 구조맵 생성, 저장, 수정, 공유 등 관련 제반 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정하는 것을 목적으로 합니다.",
        "이 약관은 회원가입, 로그인, 크레딧 충전, 입력 데이터 처리, 결과물 저장 및 공유 기능을 포함한 Brify 서비스 전반에 적용됩니다.",
      ],
    },
    {
      id: "service",
      title: "2. 서비스 내용",
      paragraphs: [
        "회사는 이용자에게 텍스트, 웹페이지 URL, 유튜브 링크, 직접 작성한 메모 등 다양한 입력을 바탕으로 요약문, 키워드, 구조맵 등 정리 결과를 제공할 수 있습니다.",
        "회사는 서비스의 품질 향상, 안정성 확보, 정책 변경 또는 외부 연동 변경 등을 위해 서비스의 일부 기능을 추가, 수정 또는 중단할 수 있습니다.",
      ],
      items: [
        "텍스트 및 링크 기반 콘텐츠 추출과 정리",
        "AI 기반 요약, 키워드 생성, 구조맵 생성",
        "생성 결과의 저장, 수정, 관리 및 열람",
        "공유 링크 생성 및 읽기 전용 공개",
        "크레딧 충전, 사용 내역 확인 및 관련 부가 기능",
      ],
    },
    {
      id: "account",
      title: "3. 회원가입과 계정 관리",
      paragraphs: [
        "이용자는 회사가 정한 절차에 따라 회원가입을 신청할 수 있으며, 회사가 이를 승인하면 회원으로서 서비스를 이용할 수 있습니다.",
        "회원가입 또는 일부 기능 이용 과정에서는 이용약관 및 개인정보처리방침에 대한 동의가 요구될 수 있습니다.",
        "이용자는 자신의 계정 정보와 인증 수단을 안전하게 관리해야 하며, 계정 도용 또는 보안 문제가 의심되는 경우 즉시 회사에 알려야 합니다.",
      ],
      items: [
        "허위 정보로 가입하거나 타인의 정보를 도용하면 안 됩니다.",
        "약관 위반 또는 서비스 운영 방해가 확인되면 이용이 제한될 수 있습니다.",
        "약관 동의가 완료되지 않으면 일부 보호 영역 서비스에 접근할 수 없습니다.",
      ],
    },
    {
      id: "content",
      title: "4. 이용자 콘텐츠와 권리",
      paragraphs: [
        "이용자가 서비스에 입력, 업로드, 작성, 저장 또는 공유하는 텍스트, URL, 메모, 구조맵, 제목, 설명, 태그 등 콘텐츠에 대한 권리와 책임은 이용자에게 있습니다.",
        "이용자는 자신이 입력하거나 업로드하는 콘텐츠에 대해 적법한 권리를 보유하거나 적법한 이용 권한을 확보해야 합니다.",
        "회사는 법령 위반, 권리 침해 우려, 정책 위반 등이 확인되거나 합리적으로 의심되는 경우 해당 콘텐츠의 노출 제한, 삭제, 공유 중단 등 필요한 조치를 취할 수 있습니다.",
      ],
      items: [
        "타인의 저작권, 상표권, 초상권, 영업비밀을 침해하는 콘텐츠",
        "타인의 개인정보 또는 비공개 정보를 무단 포함한 콘텐츠",
        "불법 정보, 유해 정보, 명예훼손, 혐오 또는 범죄 관련 콘텐츠",
        "악성코드, 스팸, 자동화 남용 등 서비스 운영에 위해를 주는 행위",
      ],
    },
    {
      id: "ai",
      title: "5. AI 생성 결과물에 대한 안내",
      paragraphs: [
        "Brify는 인공지능 또는 자동화 기술을 활용하여 요약문, 키워드, 구조맵 등 생성 결과물을 제공합니다.",
        "생성 결과물은 이용자의 입력 내용, 외부 콘텐츠 상태, 모델 특성 등에 따라 부정확하거나 불완전할 수 있으며, 회사는 그 정확성, 완전성, 최신성 또는 특정 목적 적합성을 보장하지 않습니다.",
        "이용자는 생성 결과물을 스스로 검토하고 자신의 책임으로 사용해야 하며, 법률, 세무, 의료, 투자 등 전문적 판단이 필요한 영역에서는 별도의 전문가 검토가 필요합니다.",
      ],
    },
    {
      id: "credits",
      title: "6. 크레딧 충전 및 사용",
      paragraphs: [
        "서비스의 일부 기능은 크레딧 차감 방식으로 제공됩니다. 크레딧은 유료로 구매한 크레딧과 이벤트, 가입 보상, 프로모션 등으로 지급되는 무상 크레딧으로 구분될 수 있습니다.",
        "유료 크레딧의 가격, 제공 단위, 결제 수단, 사용 조건은 서비스 화면에 표시된 내용에 따르며, 유료 크레딧 구매에 대한 결제는 회사가 정한 결제수단 및 외부 결제대행사를 통해 처리됩니다.",
        "특정 기능 이용 시 필요한 크레딧 수량은 입력량, 기능 종류, 처리 방식 등에 따라 달라질 수 있으며, 구체적인 차감 기준은 서비스 내 안내를 따릅니다.",
      ],
      items: [
        "회원이 구매한 유료 크레딧의 유효기간은 각 결제일로부터 1년이며, 해당 기간 내 사용하지 않은 유료 크레딧은 회사 정책 및 관련 법령에 따라 소멸될 수 있습니다.",
        "회원이 구매한 크레딧은 다른 회원에게 양도, 대여 또는 이전할 수 없습니다.",
        "크레딧 구매 이후 환불은 원칙적으로 결제에 사용된 동일한 결제수단으로 진행됩니다.",
        "유료 크레딧의 환불은 별도 환불정책 및 관련 법령에 따릅니다.",
        "무상 크레딧은 현금으로 환급되지 않으며, 회사 정책에 따라 사용 조건이 달라질 수 있습니다.",
        "회사는 운영상 필요 시 크레딧 정책을 변경할 수 있으며, 중요한 변경은 사전에 안내하도록 노력합니다.",
      ],
    },
    {
      id: "payments",
      title: "7. 취소 및 환불",
      paragraphs: [
        "유료 크레딧의 취소 및 환불에는 관련 법령, 회사의 환불정책 및 각 결제수단 제공자 또는 결제대행사의 정책이 함께 적용될 수 있습니다.",
      ],
      items: [
        "회원은 회사가 정한 환불정책 및 관련 법령에 따라 결제 취소 및 환불을 요청할 수 있습니다.",
        "단순 변심에 의한 환불은 구매 후 7일 이내이고, 해당 주문으로 충전된 유료 크레딧을 전혀 사용하지 않은 경우에 한하여 가능합니다.",
        "미사용 유료 크레딧에 대한 환불은 해당 구매 시점에 결제된 금액을 기준으로 처리됩니다.",
        "이미 사용한 유료 크레딧은 취소 또는 환불이 불가합니다.",
        "환불은 원칙적으로 이용자가 결제에 사용한 동일한 결제수단으로 진행되며, 실제 환불 반영 시점은 결제수단 제공자 또는 결제대행사의 정책에 따라 달라질 수 있습니다.",
        "회사의 귀책사유로 결제 오류가 발생하거나 중복 결제가 확인된 경우, 또는 관련 법령상 환불 의무가 있는 경우에는 회사가 개별 검토 후 환불할 수 있습니다.",
      ],
    },
    {
      id: "sharing",
      title: "8. 공유 링크와 공개 범위",
      paragraphs: [
        "회원은 서비스에서 제공하는 기능을 통해 자신의 구조맵 또는 결과물에 대한 공유 링크를 생성할 수 있습니다.",
        "공유 링크가 활성화되면 해당 링크를 알고 있는 사람은 회사가 정한 범위 내에서 해당 콘텐츠를 읽기 전용으로 열람할 수 있습니다.",
        "회원은 공유 링크의 생성, 관리, 외부 전달, 비활성화에 대한 책임을 부담하며, 링크 외부 유출 가능성을 스스로 고려해야 합니다.",
      ],
    },
    {
      id: "restrictions",
      title: "9. 금지행위 및 이용 제한",
      paragraphs: [
        "이용자는 관련 법령, 본 약관 또는 서비스 정책에 위반되는 방식으로 서비스를 이용해서는 안 됩니다.",
        "회사는 약관 위반이 중대하거나 반복되는 경우, 또는 타인의 권리를 침해하거나 서비스에 중대한 위험을 초래하는 경우 사전 또는 사후 통지 후 서비스 이용을 제한할 수 있습니다.",
      ],
      items: [
        "타인의 계정, 정보 또는 권리를 침해하는 행위",
        "시스템, 네트워크 또는 보안을 침해하거나 우회하려는 행위",
        "비정상적인 자동화 요청, 과도한 트래픽 유발, 스팸 전송",
        "서비스 또는 결과물을 불법 목적, 사기, 유해 콘텐츠 제작 등에 이용하는 행위",
        "회사의 사전 허락 없이 서비스를 복제, 재판매, 역설계, 상업적으로 악용하는 행위",
      ],
    },
    {
      id: "liability",
      title: "10. 서비스 중단 및 면책",
      paragraphs: [
        "회사는 시스템 점검, 유지보수, 장애 대응, 외부 서비스 연동 문제, 통신 장애, 천재지변 기타 불가항력 사유가 있는 경우 서비스 제공을 일시적으로 중단할 수 있습니다.",
        "회사는 이용자가 제공한 콘텐츠의 적법성, 정확성, 완전성 또는 신뢰성을 보증하지 않으며, 외부 웹페이지, 유튜브 링크, 제3자 플랫폼 또는 외부 데이터의 상태로 인해 발생한 결과에 대해 책임을 지지 않습니다.",
        "회사는 생성 결과물의 정확성, 완전성, 특정 성과 달성을 보장하지 않으며, 무료로 제공되는 기능에 관하여 특별한 사정이 없는 한 손해배상 책임을 부담하지 않습니다.",
      ],
    },
    {
      id: "law",
      title: "11. 준거법 및 문의처",
      paragraphs: [
        "본 약관은 대한민국 법령에 따라 해석되고 적용됩니다.",
        "서비스 이용과 관련하여 회사와 이용자 간에 분쟁이 발생한 경우, 관련 법령에 따른 관할 법원을 제1심 관할 법원으로 합니다.",
        "약관 또는 서비스 이용과 관련한 문의는 아래 이메일을 통해 접수할 수 있습니다.",
      ],
    },
  ],
  contactTitle: "문의",
  contactBody:
    "이용약관, 결제, 계정, 공유 기능과 관련해 궁금한 점이 있다면 아래 메일로 알려 주세요.",
  contactEmailLabel: "이메일",
  relatedLinks: [
    { href: "/privacy", label: "개인정보처리방침" },
    { href: "/refund-policy", label: "환불 정책" },
  ],
};

const EN_COPY: TermsCopy = {
  badge: "Brify Terms of Service",
  title: "Please review these terms before using Brify",
  subtitle:
    "Brify helps users organize text, web pages, and video transcripts into summaries and structured maps. These terms explain the main rules for accounts, user input, AI-generated output, credits, and sharing.",
  updatedAt: "Last updated: March 30, 2026",
  summaryTitle: "At a glance",
  summaryBody:
    "Brify is a credit-based service, not a subscription product. You remain responsible for the content you provide, and AI-generated output should always be reviewed before you rely on it.",
  quickFacts: [
    { label: "Access", value: "Some features require account registration and acceptance of the terms." },
    { label: "Billing", value: "Paid credits are purchased in packs and deducted per feature use." },
    { label: "Sharing", value: "Anyone with an active share link can view shared content in read-only mode." },
  ],
  sectionNavLabel: "Jump to sections",
  sections: [
    {
      id: "purpose",
      title: "1. Purpose and Scope",
      paragraphs: [
        "These Terms of Service govern the rights, obligations, and responsibilities between Brify (the “Company” or the “Service”) and its users in connection with summaries, structure maps, storage, editing, sharing, and related features.",
        "These terms apply to the overall use of Brify, including account registration, login, credit purchases, input processing, result storage, and sharing features.",
      ],
    },
    {
      id: "service",
      title: "2. Service Description",
      paragraphs: [
        "The Company may provide summaries, keywords, structure maps, and other organized outputs based on user-submitted text, web page URLs, YouTube links, notes, and similar inputs.",
        "The Company may add, modify, suspend, or discontinue parts of the Service for quality improvement, stability, policy updates, or changes to third-party integrations.",
      ],
      items: [
        "Extraction and organization of text and linked content",
        "AI-assisted summaries, keywords, and structure maps",
        "Storage, editing, viewing, and management of generated results",
        "Read-only public sharing through share links",
        "Credit purchases, usage history, and related billing features",
      ],
    },
    {
      id: "account",
      title: "3. Registration and Account Management",
      paragraphs: [
        "Users may register by following the procedures provided by the Company, and approved users may access the Service as members.",
        "Use of certain features may require agreement to these terms and the Privacy Policy.",
        "Users are responsible for keeping their account credentials secure and must promptly notify the Company if unauthorized use or a security issue is suspected.",
      ],
    },
    {
      id: "content",
      title: "4. User Content and Rights",
      paragraphs: [
        "Users retain responsibility for the text, URLs, notes, maps, titles, descriptions, tags, and other content they input, upload, save, or share through the Service.",
        "Users must have the legal right or valid permission to use any content they provide to the Service.",
        "The Company may restrict access to, remove, or disable content or sharing where a legal violation, rights infringement, or policy breach is confirmed or reasonably suspected.",
      ],
      items: [
        "Content that infringes copyrights, trademarks, portrait rights, or trade secrets",
        "Content that unlawfully contains personal or confidential information of others",
        "Illegal, harmful, defamatory, hateful, or criminal content",
        "Malware, spam, abusive automation, or conduct harmful to service operations",
      ],
    },
    {
      id: "ai",
      title: "5. AI-Generated Output",
      paragraphs: [
        "Brify uses AI and automated systems to generate summaries, keywords, and structure maps.",
        "Generated output may be inaccurate, incomplete, or unsuitable for a specific purpose depending on user input, source content, and model behavior.",
        "Users must review generated output before relying on it, especially in legal, medical, tax, investment, or other professional contexts.",
      ],
    },
    {
      id: "credits",
      title: "6. Credits and Usage",
      paragraphs: [
        "Some features of the Service are provided on a credit-deduction basis. Credits may be paid credits or free credits issued through events, signup rewards, or promotions.",
        "Prices, pack sizes, payment methods, and usage conditions for paid credits are shown within the Service, and payments for paid credits are processed through payment methods and third-party payment providers designated by the Company.",
        "Required credits may vary depending on input volume, feature type, and processing method, and detailed usage rules follow the notices displayed in the Service.",
        "Paid credits purchased by a member are valid for 1 year from each payment date, and unused paid credits may expire after that period in accordance with the Company’s policy and applicable law.",
      ],
      items: [
        "Purchased credits may not be transferred, assigned, lent, or otherwise moved to another member.",
        "Refunds for paid credits are subject to the Refund Policy and applicable law.",
        "Free credits are not redeemable for cash and may be subject to separate usage conditions set by the Company.",
      ],
    },
    {
      id: "payments",
      title: "7. Cancellations and Refunds",
      paragraphs: [
        "Cancellations and refunds for paid credits may also be subject to applicable law, the Company’s Refund Policy, and the policies of the relevant payment method provider or payment processor.",
      ],
      items: [
        "Members may request payment cancellation or refunds in accordance with the Company’s Refund Policy and applicable law.",
        "Refunds for convenience reasons are available only within 7 days of purchase and only when none of the paid credits charged by that order have been used.",
        "Refunds for unused paid credits are processed based on the amount paid at the time of purchase.",
        "Paid credits that have already been used are not eligible for cancellation or refund.",
        "Refunds will in principle be made through the same payment method originally used by the customer, and the actual posting time may vary depending on the payment provider or financial institution.",
        "The Company may separately review refunds in cases such as payment errors caused by the Company, duplicate charges, or where a refund is required by applicable law.",
      ],
    },
    {
      id: "sharing",
      title: "8. Share Links and Visibility",
      paragraphs: [
        "Members may create share links for their maps or results through the features provided by the Service.",
        "When a share link is active, anyone with that link may view the related content in read-only mode within the scope provided by the Service.",
        "Members are responsible for enabling, managing, distributing, and disabling share links, and should consider the possibility of further external distribution.",
      ],
    },
    {
      id: "restrictions",
      title: "9. Prohibited Conduct and Restrictions",
      paragraphs: [
        "Users must not use the Service in violation of applicable law, these terms, or Service policies.",
        "The Company may restrict or suspend access where violations are serious, repeated, or harmful to third-party rights or service operations.",
      ],
      items: [
        "Infringing the rights, data, or accounts of others",
        "Attempting to bypass or compromise system, network, or security protections",
        "Abusive automation, spam, or excessive traffic generation",
        "Using the Service or output for illegal, fraudulent, or harmful purposes",
        "Copying, reselling, reverse engineering, or commercially exploiting the Service without permission",
      ],
    },
    {
      id: "liability",
      title: "10. Interruptions and Disclaimer",
      paragraphs: [
        "The Company may temporarily suspend the Service for maintenance, incident response, third-party integration issues, network failures, force majeure, or similar reasons.",
        "The Company does not guarantee the legality, accuracy, completeness, or reliability of user-provided content, external webpages, YouTube links, or third-party data sources.",
        "The Company does not guarantee the accuracy, completeness, or business outcome of generated output and is not liable for ordinary issues related to free features unless required by law.",
      ],
    },
    {
      id: "law",
      title: "11. Governing Law and Contact",
      paragraphs: [
        "These terms are governed by the laws of the Republic of Korea.",
        "Any dispute relating to the Service will be handled by the court with jurisdiction under applicable law.",
        "Questions regarding these terms or the Service may be sent to the contact email below.",
      ],
    },
  ],
  contactTitle: "Contact",
  contactBody:
    "If you have questions about these terms, billing, account access, or sharing features, please contact us by email.",
  contactEmailLabel: "Email",
  relatedLinks: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/refund-policy", label: "Refund Policy" },
  ],
};

function getCopy(locale: string): TermsCopy {
  return locale === "ko" ? KO_COPY : EN_COPY;
}

export default function TermsPage() {
  const locale = useLocale();
  const copy = getCopy(locale);

  return (
    <div className="relative overflow-hidden bg-[#f4f6fb] pb-16 pt-24 text-neutral-900 dark:bg-[#020617] dark:text-neutral-50 md:pt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(860px_420px_at_10%_0%,rgba(59,130,246,0.16),transparent_60%),radial-gradient(860px_420px_at_100%_10%,rgba(14,165,233,0.16),transparent_60%)] dark:bg-[radial-gradient(860px_420px_at_10%_0%,rgba(59,130,246,0.16),transparent_60%),radial-gradient(860px_420px_at_100%_10%,rgba(14,165,233,0.16),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.04)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)]"
      />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-start lg:gap-10 lg:px-8">
        <aside className="lg:sticky lg:top-28 lg:w-[280px] lg:flex-none">
          <div className="rounded-[28px] border border-slate-300/90 bg-white/88 p-5 shadow-[0_22px_55px_-34px_rgba(15,23,42,0.32)] backdrop-blur dark:border-white/14 dark:bg-white/[0.05] dark:shadow-[0_22px_55px_-34px_rgba(0,0,0,0.6)]">
            <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200">
              {copy.badge}
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {copy.sectionNavLabel}
              </p>
              <nav className="mt-3 flex flex-col gap-2">
                {copy.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-2xl border border-transparent px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/[0.06] dark:hover:text-white"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {copy.contactTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {copy.contactBody}
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                {copy.contactEmailLabel}: hello@brify.app
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {copy.relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/14 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-blue-300/40 dark:hover:text-blue-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <section className="overflow-hidden rounded-[32px] border border-slate-300/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,248,255,0.96))] shadow-[0_28px_70px_-42px_rgba(15,23,42,0.34)] dark:border-white/14 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.96))] dark:shadow-[0_28px_70px_-42px_rgba(0,0,0,0.7)]">
            <div className="border-b border-slate-200/90 px-6 py-8 dark:border-white/10 sm:px-8 sm:py-10">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {copy.updatedAt}
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-[2.6rem] sm:leading-[1.1]">
                {copy.title}
              </h1>
              <p className="mt-4 max-w-3xl text-[15px] leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                {copy.subtitle}
              </p>
            </div>

            <div className="grid gap-4 border-b border-slate-200/90 px-6 py-6 dark:border-white/10 sm:grid-cols-3 sm:px-8">
              {copy.quickFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-2xl border border-slate-200/90 bg-white/85 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {fact.label}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-b border-slate-200/90 px-6 py-6 dark:border-white/10 sm:px-8">
              <div className="rounded-[24px] border border-blue-200 bg-[linear-gradient(135deg,rgba(219,234,254,0.72),rgba(239,246,255,0.95))] p-5 dark:border-blue-400/20 dark:bg-[linear-gradient(135deg,rgba(37,99,235,0.16),rgba(15,23,42,0.42))]">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-200">
                  {copy.summaryTitle}
                </p>
                <p className="mt-3 max-w-4xl text-[15px] leading-7 text-slate-700 dark:text-slate-200">
                  {copy.summaryBody}
                </p>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-col gap-5">
                {copy.sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-28 rounded-[26px] border border-slate-200/90 bg-white/90 p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none sm:p-6"
                  >
                    <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                      {section.title}
                    </h2>
                    <div className="mt-4 flex flex-col gap-3">
                      {section.paragraphs.map((paragraph) => (
                        <p
                          key={paragraph}
                          className="text-[15px] leading-7 text-slate-700 dark:text-slate-200"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {section.items?.length ? (
                      <ul className="mt-4 flex flex-col gap-2">
                        {section.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-3 rounded-2xl bg-slate-50/90 px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-white/[0.04] dark:text-slate-200"
                          >
                            <span className="mt-2 h-2 w-2 flex-none rounded-full bg-blue-600 dark:bg-blue-300" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
