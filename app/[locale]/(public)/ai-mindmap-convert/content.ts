export type AiMindMapConvertLocale = "ko" | "en" | "fr";

type PageContent = {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogAlt: string;
  breadcrumbName: string;
  heroTitle: string;
  heroLead: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  imageAlt: string;
  sectionFastTitle: string;
  sectionFastParagraphs: string[];
  sectionPracticalTitle: string;
  sectionPracticalLead: string;
  practicalItems: string[];
  sectionUseCasesTitle: string;
  useCases: string[];
  ctaTitle: string;
  ctaBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
  faq: Array<{ question: string; answer: string }>;
};

const KO_CONTENT: PageContent = {
  metaTitle: "긴 글 마인드맵 변환 | 상세정보를 포함하는 AI 마인드맵 - Brify",
  metaDescription:
    "Brify는 긴 글을 요약으로 줄이지 않고 상세정보를 포함한 편집·공유 가능한 마인드맵으로 변환합니다. 논문, 강의 노트, 보고서, 유튜브 대본, 책, 회의록, 설교 원고, 정책 문서를 구조화하세요.",
  metaKeywords: [
    "긴 글 마인드맵",
    "마인드맵 변환",
    "AI 마인드맵",
    "상세정보 마인드맵",
    "긴 글 정리",
    "유튜브 대본 구조화",
    "논문 마인드맵",
    "보고서 분석",
    "편집 가능한 마인드맵",
    "공유 가능한 마인드맵",
    "브라이피",
  ],
  ogAlt: "긴 글을 상세정보 포함 마인드맵으로 변환하는 Brify",
  breadcrumbName: "긴 글 마인드맵 변환",
  heroTitle: "긴 글을 상세정보 포함 마인드맵으로",
  heroLead:
    "긴 글을 붙여넣으면 핵심 흐름과 세부 정보가 한 화면에 보이도록 구조화됩니다. 단순 요약이 아니라 다시 읽고 편집하고 공유할 수 있는 마인드맵으로 남깁니다.",
  heroPrimaryCta: "무료로 시작하기",
  heroSecondaryCta: "샘플 결과 보기",
  imageAlt: "AI 구조맵 결과 예시 이미지",
  sectionFastTitle: "긴 글을 다시 읽는 시간을 줄이세요",
  sectionFastParagraphs: [
    "자료를 처음부터 끝까지 반복해서 읽지 않아도 됩니다. 구조화된 화면에서 주장, 근거, 예시, 세부 정보를 빠르게 찾아볼 수 있습니다.",
    "핵심 흐름과 세부 정보가 함께 정리되기 때문에 논문 읽기, 강의 노트 정리, 보고서 분석, 유튜브 대본 구조화에 활용하기 좋습니다.",
  ],
  sectionPracticalTitle: "읽고 이해하는 흐름에 맞춘 기능",
  sectionPracticalLead:
    "핵심만 압축하는 요약이 아니라, 근거와 세부 내용을 다시 확인할 수 있게 구조화합니다.",
  practicalItems: [
    "핵심 주장과 하위 근거를 한 번에 파악",
    "중요 용어와 세부 정보까지 함께 정리",
    "원문 맥락을 놓치지 않는 구조 기반 읽기",
    "여러 자료를 같은 기준으로 정리해 비교",
    "공유 링크로 스터디와 공동 연구 리뷰 지원",
  ],
  sectionUseCasesTitle: "이런 긴 글에 특히 잘 맞습니다",
  useCases: [
    "논문과 선행연구의 흐름을 빠르게 읽어야 할 때",
    "강의 노트, 보고서, 정책 문서의 구조를 잡아야 할 때",
    "유튜브 영상 대본, 회의록, 인터뷰를 정리해야 할 때",
    "책, 설교 원고, 강의 원고처럼 긴 자료를 다시 읽기 쉽게 남겨야 할 때",
  ],
  ctaTitle: "지금 AI 구조맵 정리를 시작해보세요",
  ctaBody:
    "긴 글을 상세정보까지 담은 마인드맵으로 바꾸면 필요한 정보를 더 빨리 찾고, 읽은 내용을 더 오래 붙잡을 수 있습니다.",
  ctaPrimary: "AI 구조맵 시작",
  ctaSecondary: "샘플 결과 보기",
  faq: [
    {
      question: "어떤 문서에 가장 잘 맞나요?",
      answer:
        "논문, 강의 노트, 보고서, 유튜브 대본, 책, 회의록, 인터뷰, 설교 원고, 정책 문서처럼 길고 복잡한 자료에서 특히 효과적입니다. 핵심 흐름과 세부 정보를 함께 정리해 읽는 시간을 줄여줍니다.",
    },
    {
      question: "단순 요약과 무엇이 다른가요?",
      answer:
        "핵심 문장만 줄이는 방식이 아니라, 주장-근거-세부 정보를 연결된 구조로 정리해 다시 읽기와 리포트 준비에 바로 활용할 수 있습니다.",
    },
  ],
};

const EN_CONTENT: PageContent = {
  metaTitle:
    "Long Text to Mind Map | Detail-Preserving AI Mind Maps - Brify",
  metaDescription:
    "Brify converts long text into editable, shareable mind maps that keep the details instead of reducing everything to a short summary. Use it for papers, lecture notes, reports, YouTube transcripts, books, meeting notes, sermons, and professional documents.",
  metaKeywords: [
    "long text to mind map",
    "AI mind map",
    "mind map generator",
    "detailed mind map",
    "convert text to mind map",
    "YouTube transcript mind map",
    "paper mind map",
    "report analysis",
    "editable mind map",
    "shareable mind map",
    "brify",
  ],
  ogAlt: "Brify turns long text into detailed editable mind maps",
  breadcrumbName: "Long Text to Mind Map",
  heroTitle: "Turn long text into detail-preserving mind maps",
  heroLead:
    "Paste long text and Brify structures it so the core flow and supporting details are visible in one screen. This is not just a summary. It creates an editable mind map you can revisit and share.",
  heroPrimaryCta: "Start for Free",
  heroSecondaryCta: "View Sample Output",
  imageAlt: "Example output from AI structure map conversion",
  sectionFastTitle: "Spend less time rereading long text",
  sectionFastParagraphs: [
    "You do not need to reread dense materials from start to finish. A structured view helps you jump directly to claims, evidence, examples, and details.",
    "Because core flow and supporting details stay connected, it works well for papers, lecture notes, report analysis, YouTube transcripts, books, meeting notes, and professional documents.",
  ],
  sectionPracticalTitle: "Built for active reading and understanding",
  sectionPracticalLead:
    "Beyond summarization, it keeps claims, evidence, and details connected so you can review with confidence.",
  practicalItems: [
    "See core claims and supporting evidence together",
    "Keep key terms and critical details in context",
    "Use a structure-first workflow for dense reading",
    "Apply the same review frame across multiple sources",
    "Share links for study groups and research review",
  ],
  sectionUseCasesTitle: "Especially useful for long texts like:",
  useCases: [
    "Papers and prior research",
    "Lecture notes, reports, and policy documents",
    "YouTube transcripts, meeting notes, and interviews",
    "Books, sermons, lecture scripts, and long professional materials",
  ],
  ctaTitle: "Start organizing with AI structure maps",
  ctaBody:
    "When long text becomes a detail-preserving mind map, you find key information faster and keep your reading easier to revisit.",
  ctaPrimary: "Start AI Structure Mapping",
  ctaSecondary: "View Sample Output",
  faq: [
    {
      question: "What kinds of documents is this best for?",
      answer:
        "It is especially effective for long, complex materials such as papers, lecture notes, reports, YouTube transcripts, books, meeting notes, interviews, sermons, policy documents, and professional materials.",
    },
    {
      question: "How is this different from a basic summary?",
      answer:
        "Instead of compressing text into short bullets, it keeps claims, evidence, and details connected in a structure you can review, refine, and use while preparing reports.",
    },
  ],
};

const FR_CONTENT: PageContent = {
  metaTitle:
    "Texte long en carte mentale | Carte IA avec détails - Brify",
  metaDescription:
    "Brify transforme les textes longs en cartes mentales modifiables et partageables qui conservent les détails au lieu de tout réduire à un résumé. Pour articles, notes de cours, rapports, transcriptions YouTube, livres, réunions, sermons et documents professionnels.",
  metaKeywords: [
    "texte long en carte mentale",
    "carte mentale IA",
    "générateur de carte mentale",
    "carte mentale détaillée",
    "convertir un texte en carte mentale",
    "transcription YouTube en carte mentale",
    "article en carte mentale",
    "analyse de rapport",
    "carte mentale modifiable",
    "carte mentale partageable",
    "brify",
  ],
  ogAlt: "Brify transforme les textes longs en cartes mentales détaillées et modifiables",
  breadcrumbName: "Texte long en carte mentale",
  heroTitle: "Transformez un texte long en carte mentale qui garde les détails",
  heroLead:
    "Collez un texte long et Brify le structure pour rendre visibles en un écran la logique centrale et les détails d'appui. Ce n'est pas un simple résumé : c'est une carte mentale modifiable à relire et partager.",
  heroPrimaryCta: "Commencer gratuitement",
  heroSecondaryCta: "Voir un exemple",
  imageAlt: "Exemple de résultat de carte structurée par IA",
  sectionFastTitle:
    "Passez moins de temps à relire des textes longs",
  sectionFastParagraphs: [
    "Vous n'avez pas besoin de relire des documents denses du début à la fin. Une vue structurée permet d'aller directement aux affirmations, preuves, exemples et détails.",
    "Comme la logique centrale et les détails d'appui restent liés, Brify convient aux articles, notes de cours, analyses de rapports, transcriptions YouTube, livres, réunions et documents professionnels.",
  ],
  sectionPracticalTitle:
    "Pensé pour lire et comprendre activement",
  sectionPracticalLead:
    "Au-delà du résumé, l'outil conserve le lien entre affirmations, preuves et détails pour une relecture fiable.",
  practicalItems: [
    "Voir ensemble les affirmations clés et leurs éléments de preuve",
    "Conserver les termes importants et les détails dans leur contexte",
    "Adopter un flux structuré pour les lectures denses",
    "Appliquer le même cadre d'analyse à plusieurs sources",
    "Partager un lien pour accélérer la revue en groupe d'étude ou de recherche",
  ],
  sectionUseCasesTitle: "Particulièrement utile pour les textes longs comme :",
  useCases: [
    "Articles et travaux antérieurs",
    "Notes de cours, rapports et documents politiques",
    "Transcriptions YouTube, comptes rendus et entretiens",
    "Livres, sermons, supports de cours et documents professionnels longs",
  ],
  ctaTitle: "Commencez avec les cartes structurées IA",
  ctaBody:
    "Quand un texte long devient une carte mentale qui garde les détails, vous trouvez plus vite l'information utile et gardez une lecture plus facile à reprendre.",
  ctaPrimary: "Créer une carte structurée",
  ctaSecondary: "Voir un exemple",
  faq: [
    {
      question: "Pour quels types de documents est-ce le plus pertinent ?",
      answer:
        "L'outil est particulièrement adapté aux documents longs et complexes : articles, notes de cours, rapports, transcriptions YouTube, livres, comptes rendus, entretiens, sermons, documents politiques et documents professionnels.",
    },
    {
      question: "Quelle différence avec un résumé classique ?",
      answer:
        "Au lieu de réduire le texte en quelques points, Brify relie affirmations, preuves et détails dans une structure exploitable pour la relecture et la préparation de rapports.",
    },
  ],
};

const CONTENT: Record<AiMindMapConvertLocale, PageContent> = {
  ko: KO_CONTENT,
  en: EN_CONTENT,
  fr: FR_CONTENT,
};

export function getAiMindMapConvertContent(locale: string): PageContent {
  if (locale === "en") return CONTENT.en;
  if (locale === "fr") return CONTENT.fr;
  return CONTENT.ko;
}
