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
  metaTitle: "AI 문서 구조화 도구 | 긴 문서 판단을 더 빠르고 정확하게 - Brify",
  metaDescription:
    "보고서, 논문, 판례, 계약서 같은 긴 문서를 구조화해 핵심 흐름과 세부 근거를 빠르게 파악하세요. 판단 속도와 정확도를 함께 높여줍니다.",
  metaKeywords: [
    "ai 문서 구조화 도구",
    "문서 구조화",
    "긴 문서 분석",
    "보고서 검토",
    "논문 정리",
    "판례 검토",
    "계약서 검토",
    "문서 판단",
    "구조맵",
    "브라이피",
  ],
  ogAlt: "AI 문서 구조화 도구 - Brify",
  breadcrumbName: "AI 문서 구조화 도구",
  heroTitle: "AI 문서 구조화 도구",
  heroLead:
    "보고서, 논문, 판례, 계약서처럼 긴 문서를 붙여넣으면 핵심 흐름과 세부 근거가 한 화면에 보이도록 구조화됩니다. 단순 요약이 아니라 판단에 필요한 맥락까지 함께 정리합니다.",
  heroPrimaryCta: "무료로 시작하기",
  heroSecondaryCta: "샘플 결과 보기",
  imageAlt: "AI 문서 구조화 결과 예시 이미지",
  sectionFastTitle: "긴 문서 검토 시간을 줄이고 핵심을 더 빨리 잡으세요",
  sectionFastParagraphs: [
    "문서를 처음부터 끝까지 반복해서 읽지 않아도 됩니다. 구조화된 화면에서 쟁점, 근거, 세부 정보를 빠르게 찾아볼 수 있습니다.",
    "핵심 흐름과 세부 정보가 함께 정리되기 때문에 비교, 검토, 보고 준비 속도가 훨씬 빨라집니다.",
  ],
  sectionPracticalTitle: "판단 책임자를 위한 실무 중심 기능",
  sectionPracticalLead:
    "핵심만 압축하는 요약이 아니라, 판단 근거를 다시 확인할 수 있게 구조화합니다.",
  practicalItems: [
    "핵심 쟁점과 하위 근거를 한 번에 파악",
    "중요 용어와 세부 정보까지 함께 정리",
    "원문 맥락을 놓치지 않는 구조 기반 검토",
    "여러 문서를 같은 기준으로 정리해 비교",
    "공유 링크로 팀 리뷰와 협업 속도 향상",
  ],
  sectionUseCasesTitle: "이런 역할에 특히 잘 맞습니다",
  useCases: [
    "리서치/전략/정책 보고서를 빠르게 검토해야 할 때",
    "법무/컴플라이언스 문서의 쟁점과 근거를 점검할 때",
    "전문 용어가 많은 문서를 정확히 이해해야 할 때",
    "외국어 문서의 핵심 흐름을 빠르게 파악해야 할 때",
  ],
  ctaTitle: "지금 AI 문서 구조화를 시작해보세요",
  ctaBody:
    "긴 문서를 구조화하면 필요한 정보를 더 빨리 찾고, 더 정확하게 판단할 수 있습니다.",
  ctaPrimary: "AI 문서 구조화 시작",
  ctaSecondary: "샘플 결과 보기",
  faq: [
    {
      question: "어떤 문서에 가장 잘 맞나요?",
      answer:
        "보고서, 논문, 판례, 계약서처럼 길고 복잡한 문서에서 특히 효과적입니다. 핵심 흐름과 근거를 함께 정리해 검토 시간을 줄여줍니다.",
    },
    {
      question: "단순 요약과 무엇이 다른가요?",
      answer:
        "핵심 문장만 줄이는 방식이 아니라, 쟁점-근거-세부 정보를 연결된 구조로 정리해 실제 판단과 재검토에 바로 활용할 수 있습니다.",
    },
  ],
};

const EN_CONTENT: PageContent = {
  metaTitle:
    "AI Document Structuring Tool | Faster, More Accurate Decisions on Long Documents - Brify",
  metaDescription:
    "Structure long documents like reports, research papers, legal opinions, and contracts to see core flow and supporting details quickly. Improve both review speed and decision quality.",
  metaKeywords: [
    "AI document structuring tool",
    "document structuring",
    "long document analysis",
    "report review",
    "research paper analysis",
    "legal document review",
    "contract review",
    "decision support",
    "structured map",
    "brify",
  ],
  ogAlt: "AI Document Structuring Tool - Brify",
  breadcrumbName: "AI Document Structuring Tool",
  heroTitle: "AI Document Structuring Tool",
  heroLead:
    "Paste reports, papers, legal opinions, or contracts, and Brify structures them so the core flow and supporting details are visible in one screen. This is not just a summary. It is built for real review and decision work.",
  heroPrimaryCta: "Start for Free",
  heroSecondaryCta: "View Sample Output",
  imageAlt: "Example output from AI document structuring",
  sectionFastTitle: "Cut review time and capture the core issues faster",
  sectionFastParagraphs: [
    "You do not need to reread dense documents from start to finish. A structured view helps you jump directly to the points that matter.",
    "Because core flow and supporting details stay connected, comparison, review, and reporting move much faster.",
  ],
  sectionPracticalTitle: "Built for document decision-makers",
  sectionPracticalLead:
    "Beyond summarization, it keeps issues and evidence connected so teams can review with confidence.",
  practicalItems: [
    "See core issues and supporting evidence together",
    "Keep key terms and critical details in context",
    "Use a structure-first workflow for high-stakes review",
    "Apply the same review frame across multiple documents",
    "Share links for faster team review and alignment",
  ],
  sectionUseCasesTitle: "Especially useful for teams who need to:",
  useCases: [
    "Review strategy, policy, or research documents quickly",
    "Check legal or compliance documents with clear traceability",
    "Understand terminology-heavy documents accurately",
    "Capture the core flow of foreign-language materials fast",
  ],
  ctaTitle: "Start AI document structuring now",
  ctaBody:
    "When long documents are structured, teams find key information faster and make better decisions with less friction.",
  ctaPrimary: "Start AI Conversion",
  ctaSecondary: "View Sample Output",
  faq: [
    {
      question: "What kinds of documents is this best for?",
      answer:
        "It is especially effective for long, complex documents such as reports, research papers, legal opinions, and contracts.",
    },
    {
      question: "How is this different from a basic summary?",
      answer:
        "Instead of compressing text into short bullets, it keeps issues, evidence, and details connected in a structure you can actually review and act on.",
    },
  ],
};

const FR_CONTENT: PageContent = {
  metaTitle:
    "Outil IA de structuration de documents | Décidez plus vite sur les documents longs - Brify",
  metaDescription:
    "Structurez des documents longs comme des rapports, articles de recherche, avis juridiques et contrats pour voir rapidement la logique centrale et les détails clés. Gagnez en vitesse de relecture et en qualité de décision.",
  metaKeywords: [
    "outil IA de structuration de documents",
    "structuration de documents",
    "analyse de documents longs",
    "revue de rapport",
    "analyse d'article de recherche",
    "revue de document juridique",
    "revue de contrat",
    "aide à la décision",
    "carte structurée",
    "brify",
  ],
  ogAlt: "Outil IA de structuration de documents - Brify",
  breadcrumbName: "Outil IA de structuration de documents",
  heroTitle: "Outil IA de structuration de documents",
  heroLead:
    "Collez des rapports, articles, avis juridiques ou contrats, et Brify les structure pour rendre visibles en un écran la logique centrale et les détails d'appui. Ce n'est pas un simple résumé : c'est conçu pour la relecture et la décision.",
  heroPrimaryCta: "Commencer gratuitement",
  heroSecondaryCta: "Voir un exemple",
  imageAlt: "Exemple de résultat de structuration de documents par IA",
  sectionFastTitle:
    "Réduisez le temps de relecture et identifiez plus vite les points clés",
  sectionFastParagraphs: [
    "Vous n'avez pas besoin de relire des documents denses du début à la fin. Une vue structurée permet d'aller directement aux passages importants.",
    "Comme la logique centrale et les détails d'appui restent liés, la comparaison, la relecture et la préparation de décision deviennent beaucoup plus rapides.",
  ],
  sectionPracticalTitle:
    "Pensé pour les responsables de décision documentaire",
  sectionPracticalLead:
    "Au-delà du résumé, l'outil conserve le lien entre enjeux et preuves pour une relecture fiable.",
  practicalItems: [
    "Voir ensemble les enjeux clés et leurs éléments de preuve",
    "Conserver les termes importants et les détails dans leur contexte",
    "Adopter un flux de relecture structuré pour les cas sensibles",
    "Appliquer le même cadre d'analyse à plusieurs documents",
    "Partager un lien pour accélérer la revue d'équipe",
  ],
  sectionUseCasesTitle: "Particulièrement utile pour les équipes qui doivent :",
  useCases: [
    "Relire rapidement des documents de stratégie, politique ou recherche",
    "Vérifier des documents juridiques ou conformité avec traçabilité",
    "Comprendre avec précision des documents riches en terminologie",
    "Saisir vite la logique centrale de documents en langue étrangère",
  ],
  ctaTitle: "Commencez maintenant la structuration IA de vos documents",
  ctaBody:
    "Quand les documents longs sont structurés, les équipes trouvent plus vite l'information utile et décident avec plus de fiabilité.",
  ctaPrimary: "Lancer la conversion IA",
  ctaSecondary: "Voir un exemple",
  faq: [
    {
      question: "Pour quels types de documents est-ce le plus pertinent ?",
      answer:
        "L'outil est particulièrement adapté aux documents longs et complexes : rapports, articles de recherche, avis juridiques et contrats.",
    },
    {
      question: "Quelle différence avec un résumé classique ?",
      answer:
        "Au lieu de réduire le texte en quelques points, Brify relie les enjeux, les preuves et les détails dans une structure exploitable pour la relecture et la décision.",
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
