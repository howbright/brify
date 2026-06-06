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
  metaTitle: "AI 구조맵 도구 | 대학원생·연구자를 위한 논문 정리 - Brify",
  metaDescription:
    "Brify는 논문과 긴 자료를 읽는 대학원생, 연구자, 리포트를 준비하는 학생을 위한 AI 구조맵 도구입니다. 핵심 흐름과 세부 근거를 구조맵으로 정리하세요.",
  metaKeywords: [
    "ai 구조맵 도구",
    "대학원생 논문 정리",
    "연구자 자료 정리",
    "리포트 준비",
    "논문 정리",
    "긴 자료 정리",
    "구조맵",
    "브라이피",
  ],
  ogAlt: "대학원생과 연구자를 위한 AI 구조맵 도구 - Brify",
  breadcrumbName: "AI 구조맵 도구",
  heroTitle: "논문과 긴 자료를 구조맵으로",
  heroLead:
    "논문, 리서치 자료, 리포트 원문처럼 긴 자료를 붙여넣으면 핵심 흐름과 세부 근거가 한 화면에 보이도록 구조화됩니다. 단순 요약이 아니라 다시 읽고 편집할 수 있는 구조맵으로 남깁니다.",
  heroPrimaryCta: "무료로 시작하기",
  heroSecondaryCta: "샘플 결과 보기",
  imageAlt: "AI 구조맵 결과 예시 이미지",
  sectionFastTitle: "논문 읽기와 자료 검토 시간을 줄이세요",
  sectionFastParagraphs: [
    "자료를 처음부터 끝까지 반복해서 읽지 않아도 됩니다. 구조화된 화면에서 주장, 근거, 세부 정보를 빠르게 찾아볼 수 있습니다.",
    "핵심 흐름과 세부 정보가 함께 정리되기 때문에 논문 읽기, 자료 비교, 리포트 준비 속도가 훨씬 빨라집니다.",
  ],
  sectionPracticalTitle: "공부와 연구 흐름에 맞춘 기능",
  sectionPracticalLead:
    "핵심만 압축하는 요약이 아니라, 근거와 세부 내용을 다시 확인할 수 있게 구조화합니다.",
  practicalItems: [
    "핵심 주장과 하위 근거를 한 번에 파악",
    "중요 용어와 세부 정보까지 함께 정리",
    "원문 맥락을 놓치지 않는 구조 기반 읽기",
    "여러 자료를 같은 기준으로 정리해 비교",
    "공유 링크로 스터디와 공동 연구 리뷰 지원",
  ],
  sectionUseCasesTitle: "이런 역할에 특히 잘 맞습니다",
  useCases: [
    "대학원생이 논문과 선행연구를 빠르게 읽어야 할 때",
    "연구자가 여러 자료의 주장과 근거를 비교해야 할 때",
    "학생이 리포트 작성을 위해 긴 자료를 정리해야 할 때",
    "외국어 논문과 자료의 핵심 흐름을 빠르게 파악해야 할 때",
  ],
  ctaTitle: "지금 AI 구조맵 정리를 시작해보세요",
  ctaBody:
    "논문과 긴 자료를 구조화하면 필요한 정보를 더 빨리 찾고, 읽은 내용을 더 오래 붙잡을 수 있습니다.",
  ctaPrimary: "AI 구조맵 시작",
  ctaSecondary: "샘플 결과 보기",
  faq: [
    {
      question: "어떤 문서에 가장 잘 맞나요?",
      answer:
        "논문, 리서치 자료, 강의자료, 리포트 참고문헌처럼 길고 복잡한 자료에서 특히 효과적입니다. 핵심 흐름과 근거를 함께 정리해 읽는 시간을 줄여줍니다.",
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
    "AI Structure Map Tool | For Graduate Students and Researchers - Brify",
  metaDescription:
    "Brify is an AI structure map tool for graduate students, researchers, and students preparing reports from papers and long materials. Organize core flow and supporting details in editable maps.",
  metaKeywords: [
    "AI structure map tool",
    "graduate student research tool",
    "research paper organization",
    "report preparation",
    "long material analysis",
    "paper structure map",
    "structured map",
    "brify",
  ],
  ogAlt: "AI structure map tool for graduate students and researchers - Brify",
  breadcrumbName: "AI Structure Map Tool",
  heroTitle: "Turn papers and long materials into structure maps",
  heroLead:
    "Paste research papers, source materials, or report references, and Brify structures them so the core flow and supporting details are visible in one screen. This is not just a summary. It creates an editable map you can revisit and share.",
  heroPrimaryCta: "Start for Free",
  heroSecondaryCta: "View Sample Output",
  imageAlt: "Example output from AI structure map conversion",
  sectionFastTitle: "Spend less time rereading papers and sources",
  sectionFastParagraphs: [
    "You do not need to reread dense materials from start to finish. A structured view helps you jump directly to claims, evidence, and details.",
    "Because core flow and supporting details stay connected, paper reading, source comparison, and report preparation move much faster.",
  ],
  sectionPracticalTitle: "Built for study and research workflows",
  sectionPracticalLead:
    "Beyond summarization, it keeps claims, evidence, and details connected so you can review with confidence.",
  practicalItems: [
    "See core claims and supporting evidence together",
    "Keep key terms and critical details in context",
    "Use a structure-first workflow for dense reading",
    "Apply the same review frame across multiple sources",
    "Share links for study groups and research review",
  ],
  sectionUseCasesTitle: "Especially useful for teams who need to:",
  useCases: [
    "Read papers and prior research more quickly",
    "Compare claims and evidence across multiple sources",
    "Prepare reports from long reference materials",
    "Capture the core flow of foreign-language papers fast",
  ],
  ctaTitle: "Start organizing with AI structure maps",
  ctaBody:
    "When papers and long materials are structured, you find key information faster and keep your reading easier to revisit.",
  ctaPrimary: "Start AI Structure Mapping",
  ctaSecondary: "View Sample Output",
  faq: [
    {
      question: "What kinds of documents is this best for?",
      answer:
        "It is especially effective for long, complex materials such as research papers, source documents, lecture notes, and report references.",
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
    "Outil IA de carte structurée | Pour doctorants et chercheurs - Brify",
  metaDescription:
    "Brify est un outil de carte structurée par IA pour les doctorants, chercheurs et étudiants qui préparent des rapports à partir d’articles et de documents longs.",
  metaKeywords: [
    "outil IA de carte structurée",
    "outil pour doctorants",
    "organisation article de recherche",
    "préparation de rapport",
    "analyse de documents longs",
    "carte article scientifique",
    "carte structurée",
    "brify",
  ],
  ogAlt: "Outil IA de carte structurée pour doctorants et chercheurs - Brify",
  breadcrumbName: "Outil IA de carte structurée",
  heroTitle: "Transformez articles et documents longs en cartes structurées",
  heroLead:
    "Collez des articles, matériaux de recherche ou références de rapport, et Brify les structure pour rendre visibles en un écran la logique centrale et les détails d'appui. Ce n'est pas un simple résumé : c'est une carte modifiable à relire et partager.",
  heroPrimaryCta: "Commencer gratuitement",
  heroSecondaryCta: "Voir un exemple",
  imageAlt: "Exemple de résultat de carte structurée par IA",
  sectionFastTitle:
    "Passez moins de temps à relire articles et sources",
  sectionFastParagraphs: [
    "Vous n'avez pas besoin de relire des documents denses du début à la fin. Une vue structurée permet d'aller directement aux affirmations, preuves et détails.",
    "Comme la logique centrale et les détails d'appui restent liés, la lecture d'articles, la comparaison de sources et la préparation de rapports deviennent beaucoup plus rapides.",
  ],
  sectionPracticalTitle:
    "Pensé pour les flux d'étude et de recherche",
  sectionPracticalLead:
    "Au-delà du résumé, l'outil conserve le lien entre affirmations, preuves et détails pour une relecture fiable.",
  practicalItems: [
    "Voir ensemble les affirmations clés et leurs éléments de preuve",
    "Conserver les termes importants et les détails dans leur contexte",
    "Adopter un flux structuré pour les lectures denses",
    "Appliquer le même cadre d'analyse à plusieurs sources",
    "Partager un lien pour accélérer la revue en groupe d'étude ou de recherche",
  ],
  sectionUseCasesTitle: "Particulièrement utile pour les équipes qui doivent :",
  useCases: [
    "Lire plus vite des articles et travaux antérieurs",
    "Comparer affirmations et preuves dans plusieurs sources",
    "Préparer des rapports à partir de références longues",
    "Saisir vite la logique centrale d'articles en langue étrangère",
  ],
  ctaTitle: "Commencez avec les cartes structurées IA",
  ctaBody:
    "Quand les articles et documents longs sont structurés, vous trouvez plus vite l'information utile et gardez une lecture plus facile à reprendre.",
  ctaPrimary: "Créer une carte structurée",
  ctaSecondary: "Voir un exemple",
  faq: [
    {
      question: "Pour quels types de documents est-ce le plus pertinent ?",
      answer:
        "L'outil est particulièrement adapté aux documents longs et complexes : articles de recherche, sources, notes de cours et références de rapport.",
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
