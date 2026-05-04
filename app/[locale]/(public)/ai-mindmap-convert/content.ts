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
  metaTitle: "AI 마인드맵 변환 | 텍스트·유튜브를 구조맵으로 - Brify",
  metaDescription:
    "긴 텍스트와 유튜브 대본을 AI 마인드맵으로 빠르게 변환하세요. 핵심 흐름, 용어, 하이라이트를 한눈에 정리하고 바로 공유할 수 있습니다.",
  metaKeywords: [
    "ai 마인드맵 변환",
    "텍스트 마인드맵 변환",
    "유튜브 마인드맵 변환",
    "구조맵",
    "브라이피",
  ],
  ogAlt: "AI 마인드맵 변환 - Brify",
  breadcrumbName: "AI 마인드맵 변환",
  heroTitle: "AI 마인드맵 변환",
  heroLead:
    "복잡하고 긴 글, 논문, 판례, 계약서, 유튜브 영상 대본을 붙여넣으면, 내용이 구조화되어 핵심 흐름이 보이는 마인드맵으로 정리됩니다. 단순 요약이 아닙니다. 중요한 상세 정보까지 놓치지 않습니다.",
  heroPrimaryCta: "무료로 시작하기",
  heroSecondaryCta: "샘플 결과 보기",
  imageAlt: "AI 마인드맵 변환 결과 예시 이미지",
  sectionFastTitle: "글을 구조화하면 빠르게 원하는 정보를 얻을 수 있습니다",
  sectionFastParagraphs: [
    "논문, 판례, 계약서처럼 길고 복잡한 문서는 처음부터 끝까지 다시 읽지 않아도, 구조화된 마인드맵에서 필요한 지점을 빠르게 찾을 수 있습니다.",
    "핵심 흐름과 근거, 세부 정보가 함께 정리되기 때문에 비교·검토·복기 속도가 훨씬 빨라집니다.",
  ],
  sectionPracticalTitle: "필요한 정보를 빠르게 찾고, 바로 활용하세요",
  sectionPracticalLead:
    "단순 요약이 아니라, 핵심 흐름과 세부 정보를 함께 정리하는 방식입니다.",
  practicalItems: [
    "핵심 흐름을 트리 구조로 시각화",
    "중요 용어와 상세 정보까지 함께 정리",
    "내 메모/하이라이트를 바로 추가",
    "같은 주제의 여러 자료를 각각 구조화해 핵심 흐름을 비교",
    "공유 링크로 팀과 즉시 검토·협업",
  ],
  sectionUseCasesTitle: "이런 상황에서 특히 유용합니다",
  useCases: [
    "전문 용어가 많은 논문을 빠르게 정리해야 할 때",
    "복잡한 논리 구조를 한눈에 시각화하고 싶을 때",
    "문맥과 뉘앙스가 중요한 텍스트를 분석할 때",
    "외국어 원문의 핵심 흐름을 빠르게 파악하고 싶을 때",
  ],
  ctaTitle: "지금 AI 마인드맵 변환을 시작해보세요",
  ctaBody:
    "긴 텍스트도, 놓치기 쉬운 영상 내용도 구조로 남기면 다시 찾기 쉬워집니다.",
  ctaPrimary: "AI 마인드맵 변환 시작",
  ctaSecondary: "샘플 결과 보기",
  faq: [
    {
      question: "유튜브 링크만 넣으면 자동 추출되나요?",
      answer:
        "Brify는 정책과 안정성을 고려해, 사용자가 복사한 대본 텍스트 기반으로 변환을 진행합니다.",
    },
    {
      question: "모바일에서도 유튜브 대본 복사가 되나요?",
      answer: "유튜브 대본 복사는 데스크톱 환경을 권장합니다.",
    },
  ],
};

const EN_CONTENT: PageContent = {
  metaTitle: "AI Mind Map Converter | Turn Text & YouTube into Structured Maps - Brify",
  metaDescription:
    "Paste long text or YouTube transcripts and turn them into AI mind maps in seconds. Capture the core flow, terminology, and critical details in one clear structure.",
  metaKeywords: [
    "ai mind map converter",
    "text to mind map",
    "youtube transcript to mind map",
    "structured map",
    "brify",
  ],
  ogAlt: "AI Mind Map Converter - Brify",
  breadcrumbName: "AI Mind Map Converter",
  heroTitle: "AI Mind Map Converter",
  heroLead:
    "Paste long-form text, papers, legal opinions, contracts, or YouTube transcripts, and Brify structures them into a mind map that makes the core flow easy to understand. This is not just a summary. It preserves the details that matter.",
  heroPrimaryCta: "Start for Free",
  heroSecondaryCta: "View Sample Output",
  imageAlt: "Example output from AI mind map conversion",
  sectionFastTitle: "Structure your text to find what you need faster",
  sectionFastParagraphs: [
    "With dense documents like papers, case opinions, and contracts, you don't have to reread everything from start to finish. A structured mind map helps you jump straight to the part you need.",
    "Because key flow, evidence, and details are organized together, comparison, review, and recall become much faster.",
  ],
  sectionPracticalTitle: "Find key points fast and put them to work right away",
  sectionPracticalLead:
    "This goes beyond a simple summary. It organizes both the big picture and the details in one clear structure.",
  practicalItems: [
    "Visualize core logic as a clear tree structure",
    "Keep terminology and important details together",
    "Add your own notes and highlights instantly",
    "Compare core flow across multiple sources on the same topic",
    "Share links for fast team review and collaboration",
  ],
  sectionUseCasesTitle: "Especially useful when you need to:",
  useCases: [
    "Process papers with heavy domain terminology",
    "Understand complex argument structures at a glance",
    "Analyze texts where nuance and context matter",
    "Grasp the core flow of foreign-language source material quickly",
  ],
  ctaTitle: "Start converting to AI mind maps now",
  ctaBody:
    "When complex content is structured, it's easier to search, revisit, and reuse what matters.",
  ctaPrimary: "Start AI Conversion",
  ctaSecondary: "View Sample Output",
  faq: [
    {
      question: "Can Brify automatically extract content from a YouTube link?",
      answer:
        "To stay policy-compliant and stable, Brify works with transcript text that users copy and paste.",
    },
    {
      question: "Can I copy YouTube transcripts on mobile?",
      answer: "Desktop is recommended for reliable YouTube transcript copying.",
    },
  ],
};

const FR_CONTENT: PageContent = {
  metaTitle:
    "Convertisseur de Mind Map IA | Transformez textes et YouTube en cartes structurées - Brify",
  metaDescription:
    "Collez un texte long ou une transcription YouTube et transformez-le en mind map IA en quelques secondes. Visualisez clairement la logique principale, les termes clés et les détails importants.",
  metaKeywords: [
    "convertisseur mind map ia",
    "texte vers mind map",
    "transcription youtube vers mind map",
    "carte structurée",
    "brify",
  ],
  ogAlt: "Convertisseur de Mind Map IA - Brify",
  breadcrumbName: "Convertisseur de Mind Map IA",
  heroTitle: "Convertisseur de Mind Map IA",
  heroLead:
    "Collez un texte long, un article académique, une décision de justice, un contrat ou une transcription YouTube. Brify les structure en mind map pour rendre la logique centrale immédiatement lisible. Ce n'est pas un simple résumé : les détails essentiels sont conservés.",
  heroPrimaryCta: "Commencer gratuitement",
  heroSecondaryCta: "Voir un exemple",
  imageAlt: "Exemple de résultat d'une conversion en mind map IA",
  sectionFastTitle:
    "Structurez vos textes pour accéder plus vite aux informations importantes",
  sectionFastParagraphs: [
    "Avec des documents denses comme des articles, des décisions juridiques ou des contrats, vous n'avez pas besoin de tout relire du début à la fin. Une mind map structurée vous permet d'aller directement au bon passage.",
    "Comme la logique principale, les preuves et les détails sont organisés ensemble, la comparaison, la relecture et la mémorisation deviennent beaucoup plus rapides.",
  ],
  sectionPracticalTitle:
    "Repérez les points clés rapidement et exploitez-les immédiatement",
  sectionPracticalLead:
    "Ce n'est pas seulement un résumé. Cette approche organise à la fois la vision d'ensemble et les détails dans une structure claire.",
  practicalItems: [
    "Visualisez la logique principale sous forme d'arborescence claire",
    "Conservez les termes clés et les détails importants ensemble",
    "Ajoutez instantanément vos notes et vos surlignages",
    "Comparez la logique centrale de plusieurs sources sur un même sujet",
    "Partagez un lien pour une relecture et une collaboration rapides",
  ],
  sectionUseCasesTitle: "Particulièrement utile lorsque vous devez :",
  useCases: [
    "Traiter des articles contenant beaucoup de terminologie spécialisée",
    "Comprendre rapidement des structures argumentatives complexes",
    "Analyser des textes où le contexte et la nuance sont essentiels",
    "Saisir vite la logique centrale de documents en langue étrangère",
  ],
  ctaTitle: "Commencez maintenant votre conversion en mind map IA",
  ctaBody:
    "Quand un contenu complexe est structuré, il devient plus facile à retrouver, à relire et à réutiliser.",
  ctaPrimary: "Lancer la conversion IA",
  ctaSecondary: "Voir un exemple",
  faq: [
    {
      question:
        "Brify peut-il extraire automatiquement le contenu d'un lien YouTube ?",
      answer:
        "Pour rester conforme aux politiques et garantir la stabilité, Brify fonctionne à partir de transcriptions copiées/collées par l'utilisateur.",
    },
    {
      question: "Puis-je copier des transcriptions YouTube sur mobile ?",
      answer:
        "Pour copier les transcriptions YouTube de façon fiable, nous recommandons un usage sur ordinateur.",
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
