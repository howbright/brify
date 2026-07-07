import PublicSidebar from "@/components/landing-v2/PublicSidebar";
import { createClient } from "@/utils/supabase/server";
import type { Metadata } from "next";

type FeaturePageCopy = {
  badge: string;
  title: string;
  description: string;
  sections: Array<{
    eyebrow: string;
    title: string;
    description: string;
    items: string[];
  }>;
  workflowTitle: string;
  workflow: Array<{
    title: string;
    description: string;
  }>;
};

type SidebarCopy = Parameters<typeof PublicSidebar>[0]["copy"];

const SIDEBAR_COPY: Record<string, SidebarCopy> = {
  ko: {
    create: "구조맵 생성",
    newMap: "새 구조맵",
    blankMap: "빈 구조맵",
    blankCreating: "만드는 중",
    brandHome: "홈",
    navFeatures: "Brify 기능",
    navBlog: "블로그",
    navPricing: "요금제",
    navSupport: "문의/피드백",
    myMaps: "내 구조맵",
    billing: "결제/크레딧",
    billingHistory: "결제 내역",
    account: "계정",
    accountSettings: "계정 설정",
    mapTheme: "맵 테마 설정",
    logout: "로그아웃",
    login: "로그인",
    signup: "회원가입",
  },
  en: {
    create: "Create structure map",
    newMap: "New map",
    blankMap: "Blank map",
    blankCreating: "Creating",
    brandHome: "Home",
    navFeatures: "Brify Features",
    navBlog: "Blog",
    navPricing: "Pricing",
    navSupport: "Support",
    myMaps: "My maps",
    billing: "Billing",
    billingHistory: "Billing history",
    account: "Account",
    accountSettings: "Account settings",
    mapTheme: "Map theme",
    logout: "Log out",
    login: "Log in",
    signup: "Sign up",
  },
  fr: {
    create: "Créer la carte",
    newMap: "Nouvelle carte",
    blankMap: "Carte vide",
    blankCreating: "Création",
    brandHome: "Accueil",
    navFeatures: "Fonctionnalités Brify",
    navBlog: "Blog",
    navPricing: "Tarifs",
    navSupport: "Support",
    myMaps: "Mes cartes",
    billing: "Facturation",
    billingHistory: "Historique",
    account: "Compte",
    accountSettings: "Paramètres du compte",
    mapTheme: "Thème de carte",
    logout: "Déconnexion",
    login: "Connexion",
    signup: "Inscription",
  },
};

const COPY: Record<string, FeaturePageCopy> = {
  ko: {
    badge: "논문과 전문 문서를 위한 구조맵",
    title: "Brify 기능",
    description:
      "Brify는 긴 글을 짧게 요약하는 앱이 아니라, 연구자가 논문과 전문 문서를 다시 읽고 검증하고 글쓰기에 활용할 수 있도록 구조맵으로 바꾸는 도구입니다.",
    sections: [
      {
        eyebrow: "Structure Map",
        title: "전문 문서 구조맵 생성",
        description:
          "논문, 연구 보고서, 정책 문서, 강의록처럼 긴 자료의 흐름을 루트, 큰 섹션, 세부 노드로 배치합니다.",
        items: [
          "전체 흐름과 세부 정보를 함께 보존",
          "주장, 근거, 예시, 한계를 노드로 분리",
          "너무 많은 leaf는 의미 단위 parent 아래로 정리",
        ],
      },
      {
        eyebrow: "Source Trace",
        title: "노드에서 원문으로 돌아가기",
        description:
          "AI가 만든 구조를 그대로 믿지 않고, 노드가 원문 어디에 근거하는지 바로 확인할 수 있습니다.",
        items: [
          "선택 노드의 원문 위치 찾기",
          "부모 노드는 하위 leaf 앵커로 fallback",
          "원문 패널에서 문맥을 보며 복사와 검토 가능",
        ],
      },
      {
        eyebrow: "Refine",
        title: "선택 노드 재구조화",
        description:
          "전체를 다시 만들지 않고, 문제가 있는 큰 섹션만 목적에 맞게 다시 다듬을 수 있습니다.",
        items: [
          "상세정보가 부족하면 원문과 기존 구조를 함께 보고 보강",
          "leaf가 너무 많이 나열되면 기존 leaf를 삭제하지 않고 중간 parent 추가",
          "선택 언어와 다른 노드는 구조를 유지한 채 자연스럽게 언어 정리",
        ],
      },
      {
        eyebrow: "Edit",
        title: "연구자가 직접 다루는 편집 기능",
        description:
          "생성 결과를 고정된 이미지로 두지 않고, 자신의 읽기 방식과 글쓰기 목적에 맞게 계속 고칠 수 있습니다.",
        items: [
          "노드 제목 수정, 자식/부모 노드 추가, 삭제",
          "하이라이트, 메모, 이미지 첨부",
          "마크다운 복사와 구조 재활용",
        ],
      },
      {
        eyebrow: "Library",
        title: "읽기 상태와 자료 관리",
        description:
          "여러 논문과 문서를 읽는 작업에서 어떤 자료를 어디까지 봤는지 관리할 수 있습니다.",
        items: [
          "읽는 중, 읽음, 중요 표시",
          "자동 태그 생성",
          "태그와 카테고리로 구조맵 정리",
          "검색, 미니맵, 줌, 레이아웃 변경",
        ],
      },
      {
        eyebrow: "Share",
        title: "공유와 협업",
        description:
          "완성된 구조맵을 링크로 공유해 연구 모임, 수업, 팀 프로젝트에서 함께 확인할 수 있습니다.",
        items: [
          "공유 링크 생성",
          "슬라이드쇼로 주요 흐름 발표",
          "PDF 다운로드와 PNG 저장",
          "상세 구조를 보존한 상태로 다시 열람",
        ],
      },
    ],
    workflowTitle: "Brify를 쓰는 흐름",
    workflow: [
      {
        title: "1. 긴 전문 문서를 붙여넣기",
        description: "논문, 보고서, 강의록, 정책 문서처럼 구조를 잡고 싶은 긴 글을 넣습니다.",
      },
      {
        title: "2. 구조맵으로 전체 흐름 파악",
        description: "큰 섹션과 세부 노드를 한 화면에서 보며 문서의 논리 흐름을 잡습니다.",
      },
      {
        title: "3. 노드에서 원문 확인",
        description: "중요한 노드를 클릭해 실제 원문과 문맥을 확인하고, 인용과 글쓰기 근거를 점검합니다.",
      },
      {
        title: "4. 편집하고 재구조화",
        description: "필요한 부분을 직접 고치고, 특정 섹션만 다시 구조화해 연구자의 작업물로 다듬습니다.",
      },
    ],
  },
  en: {
    badge: "Structure maps for research and professional documents",
    title: "Brify Features",
    description:
      "Brify is not a short-summary app. It turns dense documents into structure maps that researchers can inspect, verify, edit, and reuse while writing.",
    sections: [
      {
        eyebrow: "Structure Map",
        title: "Generate structure maps from long documents",
        description:
          "Turn papers, reports, policy documents, and lecture notes into a root, major sections, and detailed nodes.",
        items: [
          "Preserve both the overall flow and important details",
          "Separate claims, evidence, examples, and limitations",
          "Group long runs of leaf nodes under meaningful parent nodes",
        ],
      },
      {
        eyebrow: "Source Trace",
        title: "Return from a node to the source text",
        description:
          "Do not just trust an AI-generated structure. Check where a node is grounded in the original document.",
        items: [
          "Find the source location for a selected node",
          "Use descendant leaf anchors as fallback for parent nodes",
          "Review and copy source context from the source panel",
        ],
      },
      {
        eyebrow: "Refine",
        title: "Regenerate selected sections",
        description:
          "Refine only the section that needs attention instead of recreating the entire map.",
        items: [
          "Expand details using both the source and the current structure",
          "Add intermediate parent nodes without deleting existing leaves",
          "Clean language while keeping the structure unchanged",
        ],
      },
      {
        eyebrow: "Edit",
        title: "Editable research workspace",
        description:
          "Keep the generated map as a working object, not a fixed image.",
        items: [
          "Edit node titles and add parent or child nodes",
          "Add highlights, notes, and images",
          "Copy structure as Markdown for writing",
        ],
      },
      {
        eyebrow: "Library",
        title: "Manage reading state and materials",
        description:
          "Keep track of what you are reading across many papers and documents.",
        items: [
          "Mark maps as unread, in progress, or read",
          "Generate tags automatically",
          "Organize structure maps by tags and categories",
          "Use search, minimap, zoom, and layout controls",
        ],
      },
      {
        eyebrow: "Share",
        title: "Share and collaborate",
        description:
          "Share completed structure maps with a link for classes, research groups, and team projects.",
        items: [
          "Create share links",
          "Present the main flow as a slideshow",
          "Download as PDF or export as PNG",
          "Reopen maps with detailed structure preserved",
        ],
      },
    ],
    workflowTitle: "How Brify Fits Into Research Work",
    workflow: [
      {
        title: "1. Paste a long professional document",
        description: "Start with a paper, report, lecture note, or policy document.",
      },
      {
        title: "2. See the flow as a structure map",
        description: "Understand the major sections and detailed nodes in one workspace.",
      },
      {
        title: "3. Check the original source",
        description: "Click important nodes to review their source context before citing or writing.",
      },
      {
        title: "4. Edit and refine",
        description: "Adjust the map and regenerate selected sections until it fits your research task.",
      },
    ],
  },
  fr: {
    badge: "Cartes structurées pour documents de recherche",
    title: "Fonctionnalités Brify",
    description:
      "Brify n’est pas une application de résumé court. Il transforme les documents denses en cartes structurées que l’on peut vérifier, modifier et réutiliser pour écrire.",
    sections: [
      {
        eyebrow: "Structure Map",
        title: "Créer une carte structurée d’un long document",
        description:
          "Transformez articles, rapports, documents de politique publique et notes de cours en sections et nœuds détaillés.",
        items: [
          "Conserver le flux global et les détails importants",
          "Séparer thèses, preuves, exemples et limites",
          "Regrouper les longues séries de feuilles sous des parents pertinents",
        ],
      },
      {
        eyebrow: "Source Trace",
        title: "Revenir du nœud au texte source",
        description:
          "Ne vous contentez pas de la structure générée par l’IA. Vérifiez où chaque nœud s’appuie sur le document original.",
        items: [
          "Trouver l’emplacement source d’un nœud sélectionné",
          "Utiliser les ancres des feuilles comme fallback pour les parents",
          "Relire et copier le contexte dans le panneau source",
        ],
      },
      {
        eyebrow: "Refine",
        title: "Restructurer une section sélectionnée",
        description:
          "Affinez uniquement la partie problématique sans recréer toute la carte.",
        items: [
          "Ajouter des détails à partir de la source et de la structure actuelle",
          "Créer des parents intermédiaires sans supprimer les feuilles",
          "Harmoniser la langue sans changer la structure",
        ],
      },
      {
        eyebrow: "Edit",
        title: "Un espace de travail éditable",
        description:
          "La carte générée reste un objet de travail, pas une image figée.",
        items: [
          "Modifier les titres et ajouter des nœuds",
          "Ajouter surlignages, notes et images",
          "Copier la structure en Markdown",
        ],
      },
      {
        eyebrow: "Library",
        title: "Gérer la lecture et les documents",
        description:
          "Suivez votre progression lorsque vous lisez plusieurs articles et documents.",
        items: [
          "Marquer les cartes comme non lues, en cours ou lues",
          "Générer automatiquement des tags",
          "Organiser les cartes par tags et catégories",
          "Utiliser recherche, mini-carte, zoom et disposition",
        ],
      },
      {
        eyebrow: "Share",
        title: "Partager et collaborer",
        description:
          "Partagez les cartes structurées avec un lien pour les cours, groupes de recherche ou projets d’équipe.",
        items: [
          "Créer un lien de partage",
          "Présenter le fil principal en diaporama",
          "Télécharger en PDF ou exporter en PNG",
          "Conserver une structure détaillée à la relecture",
        ],
      },
    ],
    workflowTitle: "Comment Brify s’intègre au travail de recherche",
    workflow: [
      {
        title: "1. Coller un long document",
        description: "Commencez avec un article, un rapport, une note de cours ou un document spécialisé.",
      },
      {
        title: "2. Voir le flux en carte structurée",
        description: "Comprenez les grandes sections et les détails dans un même espace.",
      },
      {
        title: "3. Vérifier la source",
        description: "Cliquez sur les nœuds importants pour relire le contexte original.",
      },
      {
        title: "4. Modifier et affiner",
        description: "Ajustez la carte et restructurez certaines sections selon votre travail.",
      },
    ],
  },
};

function getCopy(locale: string) {
  if (locale === "en" || locale === "fr") return COPY[locale];
  return COPY.ko;
}

function getSidebarCopy(locale: string) {
  if (locale === "en" || locale === "fr") return SIDEBAR_COPY[locale];
  return SIDEBAR_COPY.ko;
}

function normalizeLocale(locale: string) {
  return locale === "en" || locale === "fr" ? locale : "ko";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const pageLocale = normalizeLocale(locale);
  const copy = getCopy(pageLocale);
  const pageUrl = `https://www.brify.app/${pageLocale}/features`;

  return {
    title: `${copy.title} | Brify`,
    description: copy.description,
    alternates: {
      canonical: pageUrl,
      languages: {
        ko: "https://www.brify.app/ko/features",
        en: "https://www.brify.app/en/features",
        fr: "https://www.brify.app/fr/features",
        "x-default": "https://www.brify.app/en/features",
      },
    },
    openGraph: {
      title: `${copy.title} | Brify`,
      description: copy.description,
      url: pageUrl,
      siteName: "Brify",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${copy.title} | Brify`,
      description: copy.description,
    },
  };
}

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = getCopy(locale);
  const sidebarCopy = getSidebarCopy(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950 dark:bg-[#05070d] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(740px_260px_at_18%_8%,rgba(14,165,233,0.18),transparent_72%),radial-gradient(620px_280px_at_82%_4%,rgba(245,158,11,0.13),transparent_70%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,248,251,0))] dark:bg-[radial-gradient(760px_280px_at_18%_8%,rgba(34,211,238,0.2),transparent_72%),radial-gradient(620px_280px_at_82%_4%,rgba(251,191,36,0.12),transparent_70%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(5,7,13,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:28px_28px] opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent_70%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] dark:opacity-45" />
      </div>

      <PublicSidebar
        locale={locale}
        isAuthed={Boolean(user)}
        email={user?.email ?? null}
        copy={sidebarCopy}
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-4 sm:px-6 lg:ml-[264px] lg:w-[calc(100%-264px)] lg:px-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-[#0b1220]/90 md:p-8">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
            {copy.badge}
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600 dark:text-white/68 md:text-lg">
            {copy.description}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {copy.sections.map((section) => (
          <article
            key={section.title}
            className="rounded-3xl border border-slate-200 bg-white/86 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.045]"
          >
            <div className="text-[11px] font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-200">
              {section.eyebrow}
            </div>
            <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">
              {section.title}
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-white/64">
              {section.description}
            </p>
            <ul className="mt-4 space-y-2">
              {section.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm leading-6 text-slate-700 dark:text-white/72"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_70px_-44px_rgba(15,23,42,0.75)] dark:border-white/10 dark:bg-white/[0.06] md:p-8">
        <h2 className="text-2xl font-black md:text-3xl">{copy.workflowTitle}</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {copy.workflow.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"
            >
              <h3 className="text-sm font-black text-cyan-100">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/68">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
      </div>
    </main>
  );
}
