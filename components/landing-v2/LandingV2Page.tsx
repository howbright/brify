"use client";

import { createClient } from "@/utils/supabase/client";
import type { Database } from "@/app/types/database.types";
import DraftMapCard from "@/app/[locale]/(main)/video-to-map/DraftMapCard";
import MetadataDialog from "@/app/[locale]/(main)/video-to-map/MetadataDialog";
import OutputLanguageSelect from "@/app/[locale]/(main)/video-to-map/OutputLanguageSelect";
import type { MapDraft, MapJobStatus } from "@/app/[locale]/(main)/video-to-map/types";
import YoutubeScriptDialog from "@/app/[locale]/(main)/video-to-map/YoutubeScriptDialog";
import { useMapDraftStatusPolling } from "@/app/hooks/useMapDraftStatusPolling";
import LanguageSelector from "@/components/LanguageSelector";
import { getMapStructurePreview } from "@/components/maps/mapStructurePreview";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type MapRow = Database["public"]["Tables"]["maps"]["Row"];
type SupportedLocale = "ko" | "en" | "fr";
type SourceType = "manual" | "file";
type PendingLandingInput = {
  text: string;
  sourceType: SourceType;
  fileName?: string | null;
  savedAt: number;
};
type BalanceResponse = {
  total: number;
  paid: number;
  free: number;
  paidRaw?: number;
};
type MapCreditEstimate = {
  normalizedLength: number;
  requiredCredits: number;
  baseCredits: number;
  highQuality: boolean;
  highQualityMinChars: number;
  highQualitySurchargeCredits: number;
  chunkCount: number;
  targetChunkChars: number;
  maxChunkChars: number;
  overlapChars: number;
  sourceText: string;
};
type RecentMapPreview = Pick<
  MapRow,
  | "id"
  | "title"
  | "short_title"
  | "channel_name"
  | "tags"
  | "description"
  | "summary"
  | "map_status"
  | "notes_count"
  | "terms_count"
  | "mind_elixir"
  | "updated_at"
  | "created_at"
>;

type LandingV2PageProps = {
  locale: string;
  isAuthed: boolean;
  email?: string | null;
  shouldResume: boolean;
};

const PENDING_INPUT_KEY = "brify.pendingLandingInput.v1";
const MAX_CHARS = 200_000;
const CHARS_PER_CHUNK = 50_000;
const MAP_CREATE_TIMEOUT_MS = 45_000;
const MIN_TEXTAREA_HEIGHT = 108;
const MAX_TEXTAREA_HEIGHT = 520;
const MS_PER_CHAR = 50696 / 18857;
const PROGRESS_CAP = 97;
const DRAFT_SELECT_FIELDS =
  "id,created_at,updated_at,title,youtube_title,short_title,channel_name,source_url,source_type,tags,description,summary,thumbnail_url,map_status,credits_charged";
const FALLBACK_EXAMPLE_MAP_URL =
  "https://www.brify.app/ko/share/cca46ecc-6a50-41ed-9d95-1bfa4426c755";
const FALLBACK_EXAMPLE_IMAGE_URL = "/images/sampleimage.png";

const EXAMPLE_MAPS = [
  {
    title: "60분 강의를 구조맵으로",
    category: "Lecture",
    description: "긴 강의의 주장, 근거, 예시를 한눈에 훑는 결과물",
    accent: "from-sky-500 to-cyan-400",
    image: FALLBACK_EXAMPLE_IMAGE_URL,
    href: FALLBACK_EXAMPLE_MAP_URL,
  },
  {
    title: "설교 원고 구조화",
    category: "Sermon",
    description: "본문 흐름, 핵심 메시지, 적용 포인트를 분리한 맵",
    accent: "from-amber-400 to-orange-500",
    image: FALLBACK_EXAMPLE_IMAGE_URL,
    href: FALLBACK_EXAMPLE_MAP_URL,
  },
  {
    title: "성경 묵상 노트",
    category: "Devotion",
    description: "본문 관찰과 묵상 포인트를 가지 구조로 정리",
    accent: "from-emerald-400 to-teal-500",
    image: FALLBACK_EXAMPLE_IMAGE_URL,
    href: FALLBACK_EXAMPLE_MAP_URL,
  },
  {
    title: "보고서 핵심 정리",
    category: "Report",
    description: "복잡한 문서의 목차와 결론을 빠르게 파악",
    accent: "from-rose-400 to-fuchsia-500",
    image: FALLBACK_EXAMPLE_IMAGE_URL,
    href: FALLBACK_EXAMPLE_MAP_URL,
  },
  {
    title: "회의록 실행 항목",
    category: "Meeting",
    description: "논의 흐름과 할 일을 같은 화면에서 정리",
    accent: "from-indigo-500 to-blue-500",
    image: FALLBACK_EXAMPLE_IMAGE_URL,
    href: FALLBACK_EXAMPLE_MAP_URL,
  },
  {
    title: "책 챕터 독서노트",
    category: "Book",
    description: "장별 핵심 개념과 하위 내용을 보관 가능한 맵으로",
    accent: "from-lime-400 to-green-500",
    image: FALLBACK_EXAMPLE_IMAGE_URL,
    href: FALLBACK_EXAMPLE_MAP_URL,
  },
] as const;

const COPY = {
  ko: {
    login: "로그인",
    signup: "회원가입",
    headline: "논문과 긴 자료를 구조맵으로 정리하세요.",
    subhead: "",
    textareaPlaceholder: "여기에 붙여넣기",
    uploadDoc: "문서 업로드",
    youtubeHelp: "유튜브 영상대본 복사하는 방법",
    trySample: "예시 넣기",
    moreActions: "더보기",
    create: "구조맵 만들기",
    creating: "구조 분석 중",
    draftsTitle: "생성 중인 구조맵",
    editMetadata: "정보 수정",
    charCount: "글자",
    outputLanguage: "결과 언어",
    creditStatus: "내 크레딧 {current}개 · 이번 생성에 {required}개 사용",
    creditLoading: "크레딧 확인 중",
    createOptionsTitle: "구조맵 만들기",
    createOptionsBody: "결과 언어와 사용 크레딧을 확인해 주세요.",
    requiredCredits: "이번 생성에 필요한 크레딧 {required}개",
    cancel: "취소",
    uploadHint: "DOCX/PDF/PPTX를 끌어다 놓거나 업로드하세요.",
    dropReady: "여기에 놓으면 문서 텍스트를 추출합니다.",
    unsupportedFile: "현재는 DOCX, PDF, PPTX 파일만 지원합니다.",
    empty: "먼저 구조맵으로 만들 글을 입력해 주세요.",
    tooLarge: "입력은 최대 200,000자까지 가능합니다.",
    authTitle: "구조맵을 만들 준비가 되었어요",
    authBody:
      "계정을 만들면 방금 입력한 글을 구조맵으로 변환하고, 저장하고 다시 볼 수 있어요.",
    continueLogin: "로그인하고 계속하기",
    continueSignup: "회원가입하고 계속하기",
    resumeTitle: "방금 입력한 글이 남아 있어요",
    resumeBody: "로그인 전에 입력한 글로 바로 구조맵 생성을 이어갈 수 있습니다.",
    resumeCta: "이 글로 구조맵 만들기",
    discard: "지우기",
    loadingSteps: [
      "긴 글의 흐름을 읽고 있어요",
      "핵심 주제와 세부 내용을 나누는 중입니다",
      "구조맵으로 배치하고 있어요",
      "완성되는 대로 바로 열어드릴게요",
    ],
    processingTitle: "구조맵을 만들고 있어요",
    processingBullets: [
      "긴 글을 구조 단위로 나누고 있어요.",
      "완료되면 바로 구조맵 화면에서 편집할 수 있어요.",
      "제목, 태그, 설명은 지금 저장해도 됩니다.",
    ],
    examplesTitle: "구조맵 예시",
    examplesSubhead: "긴 글이 어떤 구조로 바뀌는지 먼저 보여줍니다.",
    myMapsTitle: "내 구조맵",
    myMapsEmpty: "아직 만든 구조맵이 없습니다.",
    myMapsLogin: "로그인하면 최근에 만든 구조맵이 여기에 보입니다.",
    myMapsLoading: "내 구조맵을 불러오고 있어요.",
    noSummary: "요약이 아직 없습니다.",
    noTag: "태그 없음",
    notesCount: "주석 {count}",
    termsCount: "용어 {count}",
    statusProcessing: "생성 중",
    statusFailed: "실패",
    openMap: "열기",
    brandHome: "홈",
    navBlog: "블로그",
    navPricing: "요금제",
    navSupport: "문의/피드백",
    newMap: "새 구조맵",
    newFromText: "글로 만들기",
    blankMap: "빈 구조맵",
    blankCreating: "만드는 중",
    myMaps: "내 구조맵",
    billing: "결제/크레딧",
    billingHistory: "결제 내역",
    account: "계정",
    logout: "로그아웃",
    viewExample: "예시 보기",
    preparing: "링크 준비 중",
    flowTitle: "첫 사용 흐름",
    flow: ["붙여넣기", "계정으로 저장", "구조맵 편집"],
    fileExtracting: "문서에서 텍스트를 추출하고 있어요.",
    fileExtracted: "문서 텍스트를 입력창에 넣었습니다.",
    fileFailed: "문서 텍스트를 추출하지 못했습니다.",
    missingApiBase: "NEXT_PUBLIC_API_BASE_URL이 설정되어 있지 않습니다.",
    loginRequired: "로그인 후 다시 시도해 주세요.",
    createFailed: "구조맵 생성 요청에 실패했습니다.",
    readyFailed: "구조맵 준비 상태를 확인하지 못했습니다.",
    timedOut: "구조맵 생성이 오래 걸리고 있어요. 잠시 후 내 구조맵 목록에서 확인해 주세요.",
    insufficientCredits: "사용 가능한 크레딧이 부족합니다.",
    insufficientCreditsDetail: "보유 크레딧이 부족합니다. 충전 후 다시 시도해 주세요.",
    goBilling: "크레딧 충전하기",
  },
  en: {
    login: "Log in",
    signup: "Sign up",
    headline: "Turn papers and long materials into structure maps.",
    subhead: "",
    textareaPlaceholder: "Paste here",
    uploadDoc: "Upload document",
    youtubeHelp: "YouTube transcript",
    trySample: "Use sample",
    moreActions: "More",
    create: "Create structure map",
    creating: "Structuring",
    draftsTitle: "Maps in progress",
    editMetadata: "Edit details",
    charCount: "chars",
    outputLanguage: "Output language",
    creditStatus: "{current} credits available · {required} will be used",
    creditLoading: "Checking credits",
    createOptionsTitle: "Create structure map",
    createOptionsBody: "Confirm the output language and credits.",
    requiredCredits: "{required} credits will be used",
    cancel: "Cancel",
    uploadHint: "Drop or upload a DOCX/PDF/PPTX file.",
    dropReady: "Drop it here to extract the document text.",
    unsupportedFile: "Only DOCX, PDF, or PPTX files are supported for now.",
    empty: "Paste some text first.",
    tooLarge: "Input can be up to 200,000 characters.",
    authTitle: "Your structure map is ready to start",
    authBody:
      "Create an account to turn this text into a map, save it, and revisit it later.",
    continueLogin: "Log in and continue",
    continueSignup: "Sign up and continue",
    resumeTitle: "Your previous text is still here",
    resumeBody: "Continue creating a structure map from the text you entered before signing in.",
    resumeCta: "Create from this text",
    discard: "Discard",
    loadingSteps: [
      "Reading the flow of the text",
      "Separating key ideas and details",
      "Arranging the structure map",
      "Opening it as soon as it is ready",
    ],
    processingTitle: "Creating your structure map",
    processingBullets: [
      "Splitting the long text into structure units.",
      "You can edit the map as soon as it is ready.",
      "You can save title, tags, and description now.",
    ],
    examplesTitle: "Structure map examples",
    examplesSubhead: "Show what long text becomes before asking people to start.",
    myMapsTitle: "My structure maps",
    myMapsEmpty: "No structure maps yet.",
    myMapsLogin: "Log in to see your recent structure maps here.",
    myMapsLoading: "Loading your structure maps.",
    noSummary: "No summary yet.",
    noTag: "No tags",
    notesCount: "Notes {count}",
    termsCount: "Terms {count}",
    statusProcessing: "Creating",
    statusFailed: "Failed",
    openMap: "Open",
    brandHome: "Home",
    navBlog: "Blog",
    navPricing: "Pricing",
    navSupport: "Support",
    newMap: "New map",
    newFromText: "From text",
    blankMap: "Blank map",
    blankCreating: "Creating",
    myMaps: "My maps",
    billing: "Billing",
    billingHistory: "Billing history",
    account: "Account",
    logout: "Log out",
    viewExample: "View example",
    preparing: "Link coming soon",
    flowTitle: "First-use flow",
    flow: ["Paste", "Save with account", "Edit the map"],
    fileExtracting: "Extracting text from the document.",
    fileExtracted: "Document text was added to the input.",
    fileFailed: "Could not extract text from the document.",
    missingApiBase: "NEXT_PUBLIC_API_BASE_URL is not configured.",
    loginRequired: "Please log in and try again.",
    createFailed: "Failed to create the structure map.",
    readyFailed: "Failed to check map readiness.",
    timedOut: "The map is taking longer than expected. Check your map list shortly.",
    insufficientCredits: "You do not have enough credits.",
    insufficientCreditsDetail: "You do not have enough credits. Add credits and try again.",
    goBilling: "Add credits",
  },
  fr: {
    login: "Connexion",
    signup: "Inscription",
    headline: "Transformez articles et documents longs en cartes structurées.",
    subhead: "",
    textareaPlaceholder: "Collez ici",
    uploadDoc: "Importer un document",
    youtubeHelp: "Transcription YouTube",
    trySample: "Essayer un exemple",
    moreActions: "Plus",
    create: "Créer la carte",
    creating: "Structuration",
    draftsTitle: "Cartes en cours",
    editMetadata: "Modifier les détails",
    charCount: "caractères",
    outputLanguage: "Langue de sortie",
    creditStatus: "{current} crédits disponibles · {required} utilisés",
    creditLoading: "Vérification des crédits",
    createOptionsTitle: "Créer la carte",
    createOptionsBody: "Confirmez la langue de sortie et les crédits.",
    requiredCredits: "{required} crédits seront utilisés",
    cancel: "Annuler",
    uploadHint: "Déposez ou importez un DOCX/PDF/PPTX.",
    dropReady: "Déposez-le ici pour extraire le texte.",
    unsupportedFile: "Seuls les fichiers DOCX, PDF ou PPTX sont pris en charge pour le moment.",
    empty: "Collez d'abord un texte.",
    tooLarge: "La limite est de 200 000 caractères.",
    authTitle: "Votre carte est prête à démarrer",
    authBody:
      "Créez un compte pour transformer ce texte en carte, l'enregistrer et le revoir plus tard.",
    continueLogin: "Se connecter et continuer",
    continueSignup: "S'inscrire et continuer",
    resumeTitle: "Votre texte précédent est encore là",
    resumeBody: "Continuez la création avec le texte saisi avant la connexion.",
    resumeCta: "Créer avec ce texte",
    discard: "Effacer",
    loadingSteps: [
      "Lecture du fil du texte",
      "Séparation des idées clés et des détails",
      "Organisation de la carte",
      "Ouverture dès que la carte est prête",
    ],
    processingTitle: "Création de votre carte",
    processingBullets: [
      "Découpage du long texte en unités de structure.",
      "Vous pourrez modifier la carte dès qu'elle sera prête.",
      "Vous pouvez déjà enregistrer le titre, les tags et la description.",
    ],
    examplesTitle: "Exemples de cartes",
    examplesSubhead: "Montrez d'abord ce que devient un long texte.",
    myMapsTitle: "Mes cartes",
    myMapsEmpty: "Aucune carte pour le moment.",
    myMapsLogin: "Connectez-vous pour voir vos cartes récentes ici.",
    myMapsLoading: "Chargement de vos cartes.",
    noSummary: "Aucun résumé pour le moment.",
    noTag: "Aucun tag",
    notesCount: "Notes {count}",
    termsCount: "Termes {count}",
    statusProcessing: "Création",
    statusFailed: "Échec",
    openMap: "Ouvrir",
    brandHome: "Accueil",
    navBlog: "Blog",
    navPricing: "Tarifs",
    navSupport: "Support",
    newMap: "Nouvelle carte",
    newFromText: "Depuis un texte",
    blankMap: "Carte vide",
    blankCreating: "Création",
    myMaps: "Mes cartes",
    billing: "Facturation",
    billingHistory: "Historique",
    account: "Compte",
    logout: "Déconnexion",
    viewExample: "Voir l'exemple",
    preparing: "Lien à venir",
    flowTitle: "Premier usage",
    flow: ["Coller", "Enregistrer", "Modifier"],
    fileExtracting: "Extraction du texte du document.",
    fileExtracted: "Le texte du document a été ajouté.",
    fileFailed: "Impossible d'extraire le texte.",
    missingApiBase: "NEXT_PUBLIC_API_BASE_URL n'est pas configuré.",
    loginRequired: "Connectez-vous puis réessayez.",
    createFailed: "Impossible de créer la carte.",
    readyFailed: "Impossible de vérifier l'état de la carte.",
    timedOut: "La création prend plus de temps que prévu. Consultez bientôt votre liste.",
    insufficientCredits: "Crédits insuffisants.",
    insufficientCreditsDetail: "Crédits insuffisants. Ajoutez des crédits puis réessayez.",
    goBilling: "Ajouter des crédits",
  },
} as const;

function normalizeLocale(locale: string): SupportedLocale {
  return locale === "ko" || locale === "fr" ? locale : "en";
}

function loadPendingInput(): PendingLandingInput | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_INPUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingLandingInput;
    if (!parsed?.text?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePendingInput(input: PendingLandingInput) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_INPUT_KEY, JSON.stringify(input));
}

function clearPendingInput() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_INPUT_KEY);
}

function deriveTitle(text: string, fallback: string) {
  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) return fallback;
  return firstLine.length > 80 ? `${firstLine.slice(0, 80)}...` : firstLine;
}

function normalizeForBilling(raw: string) {
  return (raw ?? "")
    .replace(
      /\[(?:음악|박수|웃음|기도|찬양|간주|BGM|Music|SFX|Applause|Laugh).*?\]/gi,
      ""
    )
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getChunkCount(length: number) {
  if (!length) return 1;
  return Math.max(1, Math.ceil(length / CHARS_PER_CHUNK));
}

function getCreditsForChunkCount(chunkCount: number) {
  if (chunkCount <= 1) return 1;
  if (chunkCount <= 3) return 2;
  return 3;
}

function getCreditInfo(text: string) {
  const cleaned = normalizeForBilling(text);
  const length = cleaned.length;
  const chunkCount = getChunkCount(length);
  return {
    cleaned,
    length,
    chunkCount,
    credits: getCreditsForChunkCount(chunkCount),
    tooLarge: length > MAX_CHARS,
  };
}

function coerceMapCreditEstimate(
  json: unknown,
  sourceText: string
): MapCreditEstimate {
  const data =
    json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const requiredCredits = Number(data.requiredCredits);
  const chunkCount = Number(data.chunkCount);
  const normalizedLength = Number(data.normalizedLength ?? 0);

  if (!Number.isFinite(requiredCredits) || requiredCredits < 1) {
    throw new Error("INVALID_CREDIT_ESTIMATE");
  }

  return {
    sourceText,
    normalizedLength: Number.isFinite(normalizedLength) ? normalizedLength : 0,
    requiredCredits,
    baseCredits: Number(data.baseCredits ?? requiredCredits),
    highQuality: Boolean(data.highQuality),
    highQualityMinChars: Number(data.highQualityMinChars ?? 3000),
    highQualitySurchargeCredits: Number(data.highQualitySurchargeCredits ?? 0),
    chunkCount: Number.isFinite(chunkCount) && chunkCount > 0 ? chunkCount : 1,
    targetChunkChars: Number(data.targetChunkChars ?? CHARS_PER_CHUNK),
    maxChunkChars: Number(data.maxChunkChars ?? CHARS_PER_CHUNK),
    overlapChars: Number(data.overlapChars ?? 0),
  };
}

function getApiMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function templateCopy(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function formatMapDate(value: string | null | undefined, locale: SupportedLocale) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function getRecentMapTitle(map: RecentMapPreview) {
  const title = map.short_title?.trim() || map.title?.trim() || "Untitled map";
  const channel = map.channel_name?.trim();
  return channel ? `${title} [${channel}]` : title;
}

function getRecentMapTopBorderClass(status: RecentMapPreview["map_status"]) {
  if (status === "done") {
    return "border-t-2 border-t-slate-300 dark:border-t-slate-500/80";
  }
  if (status === "failed") {
    return "border-t-2 border-t-rose-400 dark:border-t-rose-300/90";
  }
  return "border-t-2 border-t-blue-400 dark:border-t-sky-300/90";
}

function getFileExtension(name: string) {
  const index = name.lastIndexOf(".");
  if (index < 0) return "";
  return name.slice(index + 1).toLowerCase();
}

function detectSourceType(sourceUrl?: string | null, fallback: SourceType = "manual") {
  if (!sourceUrl) return fallback;
  const lowered = sourceUrl.toLowerCase();
  if (lowered.includes("youtube.com") || lowered.includes("youtu.be")) {
    return "youtube" as const;
  }
  return "website" as const;
}

function withCacheBuster(url: string) {
  try {
    const nextUrl = new URL(url);
    nextUrl.searchParams.set("t", Date.now().toString());
    return nextUrl.toString();
  } catch {
    return url;
  }
}

function coerceMapStatus(status?: string | null): MapJobStatus {
  if (
    status === "done" ||
    status === "failed" ||
    status === "queued" ||
    status === "idle" ||
    status === "processing_structure" ||
    status === "processing_metadata"
  ) {
    return status;
  }
  return "processing_structure";
}

export default function LandingV2Page({
  locale,
  isAuthed,
  email,
  shouldResume,
}: LandingV2PageProps) {
  const safeLocale = normalizeLocale(locale);
  const copy = COPY[safeLocale];
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [text, setText] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("manual");
  const [fileName, setFileName] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [resumeInput, setResumeInput] = useState<PendingLandingInput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progressNow, setProgressNow] = useState(Date.now());
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const [generationCharCount, setGenerationCharCount] = useState(0);
  const [recentMaps, setRecentMaps] = useState<RecentMapPreview[]>([]);
  const [isLoadingRecentMaps, setIsLoadingRecentMaps] = useState(false);
  const [isCreatingBlank, setIsCreatingBlank] = useState(false);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [creditEstimate, setCreditEstimate] = useState<MapCreditEstimate | null>(null);
  const [isEstimatingCredits, setIsEstimatingCredits] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [pendingCreditInput, setPendingCreditInput] =
    useState<PendingLandingInput | null>(null);
  const [outputLang, setOutputLang] = useState("auto");
  const [drafts, setDrafts] = useState<MapDraft[]>([]);
  const [createdMapId, setCreatedMapId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<MapDraft | null>(null);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [showYoutubeDialog, setShowYoutubeDialog] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState<number | null>(null);
  const [savingMetaId, setSavingMetaId] = useState<string | null>(null);
  const [pendingAutoOpenMapId, setPendingAutoOpenMapId] = useState<string | null>(null);
  const [highlightedDraftId, setHighlightedDraftId] = useState<string | null>(null);
  const draftsSectionRef = useRef<HTMLElement | null>(null);

  useMapDraftStatusPolling(drafts, setDrafts, { refreshMs: 1000 });

  const nextPath = `/${safeLocale}?resume=1`;
  const loginHref = `/${safeLocale}/login?next=${encodeURIComponent(nextPath)}`;
  const signupHref = `/${safeLocale}/signup?next=${encodeURIComponent(nextPath)}`;
  const trimmedText = text.trim();
  const charCount = trimmedText.length;
  const creditInfo = useMemo(() => getCreditInfo(text), [text]);
  const currentTextEstimate =
    creditEstimate?.sourceText === trimmedText ? creditEstimate : null;
  const requiredCredits = currentTextEstimate?.requiredCredits ?? creditInfo.credits;
  const pendingRequiredCredits = pendingCreditInput
    ? creditEstimate?.sourceText === pendingCreditInput.text
      ? creditEstimate.requiredCredits
      : getCreditInfo(pendingCreditInput.text).credits
    : requiredCredits;
  const generationExpectedMs =
    generationCharCount > 0
      ? Math.max(1, Math.round(generationCharCount * MS_PER_CHAR))
      : null;
  const generationProgress =
    isGenerating && generationStartedAt && generationExpectedMs
      ? Math.min(
          PROGRESS_CAP,
          Math.max(
            1,
            Math.floor(((progressNow - generationStartedAt) / generationExpectedMs) * 100)
          )
        )
      : null;
  const canCreate =
    charCount > 0 &&
    !isGenerating &&
    !isExtractingFile &&
    !isEstimatingCredits &&
    !creditInfo.tooLarge;
  const route = (path: string) => `/${safeLocale}${path}`;

  useEffect(() => {
    const pending = loadPendingInput();
    if (!pending) return;
    setResumeInput(pending);
    setText(pending.text);
    setSourceType(pending.sourceType ?? "manual");
    setFileName(pending.fileName ?? null);
  }, []);

  useEffect(() => {
    setCreditEstimate((estimate) =>
      estimate?.sourceText === trimmedText ? estimate : null
    );
  }, [trimmedText]);

  useEffect(() => {
    if (!isGenerating) {
      setLoadingStep(0);
      setGenerationStartedAt(null);
      setGenerationCharCount(0);
      return;
    }
    const timer = window.setInterval(() => {
      setLoadingStep((step) => (step + 1) % copy.loadingSteps.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [copy.loadingSteps.length, isGenerating]);

  useEffect(() => {
    if (!isGenerating) return;
    const timer = window.setInterval(() => setProgressNow(Date.now()), 800);
    return () => window.clearInterval(timer);
  }, [isGenerating]);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthed) {
      setRecentMaps([]);
      setIsLoadingRecentMaps(false);
      return;
    }

    setIsLoadingRecentMaps(true);

    (async () => {
      const { data, error: mapsError } = await supabase
        .from("maps")
        .select(
          "id,title,short_title,channel_name,tags,description,summary,map_status,notes_count,terms_count,mind_elixir,updated_at,created_at"
        )
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(8);

      if (cancelled) return;
      setRecentMaps(mapsError ? [] : ((data ?? []) as RecentMapPreview[]));
      setIsLoadingRecentMaps(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthed, supabase]);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthed) {
      setCurrentCredits(0);
      setIsLoadingCredits(false);
      return;
    }

    setIsLoadingCredits(true);

    (async () => {
      try {
        const response = await fetch("/api/billing/balance", {
          method: "GET",
          cache: "no-store",
        });

        if (cancelled) return;
        if (!response.ok) {
          setCurrentCredits(0);
          return;
        }

        const data: BalanceResponse = await response.json();
        setCurrentCredits(Number(data.total ?? 0));
      } catch {
        if (!cancelled) setCurrentCredits(0);
      } finally {
        if (!cancelled) setIsLoadingCredits(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  useEffect(() => {
    if (!pendingAutoOpenMapId) return;
    const targetDraft = drafts.find((draft) => draft.id === pendingAutoOpenMapId);
    if (!targetDraft || targetDraft.status !== "done") return;
    setPendingAutoOpenMapId(null);
    router.push(`/${safeLocale}/maps/${pendingAutoOpenMapId}`);
  }, [drafts, pendingAutoOpenMapId, router, safeLocale]);

  useEffect(() => {
    if (!highlightedDraftId) return;
    const timer = window.setTimeout(() => {
      setHighlightedDraftId(null);
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [highlightedDraftId]);

  const saveUnauthedInputAndOpenAuth = (pendingInput: PendingLandingInput) => {
    savePendingInput(pendingInput);
    setResumeInput(pendingInput);
    setAuthOpen(true);
  };

  const estimateCreditsForText = async (sourceText: string) => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!base) throw new Error(copy.missingApiBase);

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      throw new Error(copy.loginRequired);
    }

    const response = await fetch(`${base}/maps/estimate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        extracted_text: sourceText,
      }),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const rawMessage =
        json && typeof json === "object"
          ? (json as { message?: unknown; error?: unknown }).message ??
            (json as { message?: unknown; error?: unknown }).error
          : undefined;
      const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
      throw new Error(typeof message === "string" ? message : copy.createFailed);
    }

    return coerceMapCreditEstimate(json, sourceText);
  };

  const prepareCreateMap = async (override?: PendingLandingInput) => {
    setError(null);
    setNotice(null);

    const generationText = (override?.text ?? trimmedText).trim();
    const generationSourceType = override?.sourceType ?? sourceType;
    const generationFileName = override?.fileName ?? fileName;

    if (!generationText) {
      setError(copy.empty);
      return;
    }

    const nextCreditInfo = getCreditInfo(generationText);
    if (nextCreditInfo.tooLarge) {
      setError(copy.tooLarge);
      return;
    }

    const pendingInput = {
      text: generationText,
      sourceType: generationSourceType,
      fileName: generationFileName,
      savedAt: Date.now(),
    };

    if (!isAuthed) {
      saveUnauthedInputAndOpenAuth(pendingInput);
      return;
    }

    setIsEstimatingCredits(true);
    try {
      const estimate = await estimateCreditsForText(generationText);
      setCreditEstimate(estimate);

      if (currentCredits < estimate.requiredCredits) {
        setError(copy.insufficientCreditsDetail);
        return;
      }

      setPendingCreditInput(pendingInput);
      setShowCreditDialog(true);
    } catch (estimateError) {
      const message = getApiMessage(estimateError, copy.createFailed);
      setError(message === "INVALID_CREDIT_ESTIMATE" ? copy.createFailed : message);
    } finally {
      setIsEstimatingCredits(false);
    }
  };

  const createMap = async (override?: PendingLandingInput) => {
    setError(null);
    setNotice(null);

    const generationText = (override?.text ?? trimmedText).trim();
    const generationSourceType = override?.sourceType ?? sourceType;
    const generationFileName = override?.fileName ?? fileName;

    if (!generationText) {
      setError(copy.empty);
      return;
    }

    if (getCreditInfo(generationText).tooLarge) {
      setError(copy.tooLarge);
      return;
    }

    let estimate =
      creditEstimate?.sourceText === generationText ? creditEstimate : null;

    if (!estimate) {
      try {
        estimate = await estimateCreditsForText(generationText);
        setCreditEstimate(estimate);
      } catch (estimateError) {
        const message = getApiMessage(estimateError, copy.createFailed);
        setError(message === "INVALID_CREDIT_ESTIMATE" ? copy.createFailed : message);
        return;
      }
    }

    if (currentCredits < estimate.requiredCredits) {
      setShowCreditDialog(false);
      setError(copy.insufficientCreditsDetail);
      return;
    }

    const base = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!base) {
      setError(copy.missingApiBase);
      return;
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (sessionError || !accessToken || !isAuthed) {
      saveUnauthedInputAndOpenAuth({
        text: generationText,
        sourceType: generationSourceType,
        fileName: generationFileName,
        savedAt: Date.now(),
      });
      return;
    }

    setGenerationStartedAt(Date.now());
    setGenerationCharCount(normalizeForBilling(generationText).length);
    setProgressNow(Date.now());
    setIsGenerating(true);
    setShowCreditDialog(false);

    try {
      const title = deriveTitle(generationText, "Brify structure map");
      const sourceUrl = undefined;
      const sourceTypeForPayload = detectSourceType(
        sourceUrl,
        generationSourceType
      );
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => {
        controller.abort();
      }, MAP_CREATE_TIMEOUT_MS);

      const response = await fetch(`${base}/maps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title,
          extracted_text: generationText,
          source_type: sourceTypeForPayload,
          source_url: sourceUrl,
          schema_version: 1,
          output_language: outputLang || "auto",
        }),
        signal: controller.signal,
      }).finally(() => {
        window.clearTimeout(timeoutId);
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const rawMessage = json?.message || json?.error;
        const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
        const normalized = String(message ?? "").toLowerCase();
        if (
          json?.code === "INSUFFICIENT_CREDITS" ||
          normalized.includes("not enough available credits")
        ) {
          throw new Error(copy.insufficientCredits);
        }
        throw new Error(typeof message === "string" ? message : copy.createFailed);
      }

      const mapId = typeof json?.id === "string" ? json.id : "";
      if (!mapId) throw new Error(copy.createFailed);

      clearPendingInput();
      setResumeInput(null);
      setPendingCreditInput(null);
      setIsGenerating(false);
      setText("");
      setSourceType("manual");
      setFileName(null);
      router.push(`/${safeLocale}/maps/${mapId}`);
    } catch (generationError) {
      setError(getApiMessage(generationError, copy.createFailed));
      setIsGenerating(false);
    }
  };

  const handleSaveMetadata = async (meta: {
    sourceType: "youtube" | "manual";
    sourceUrl?: string;
    title: string;
    youtubeTitle?: string;
    channelName?: string;
    thumbnailUrl?: string;
    tags: string[];
    description?: string;
  }) => {
    setError(null);

    try {
      const targetId = createdMapId ?? editingDraft?.id;
      const shouldAutoOpenWhenReady = Boolean(createdMapId && !editingDraft);
      if (!targetId) throw new Error(copy.createFailed);

      setSavingMetaId(targetId);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (sessionError || !accessToken) {
        throw new Error(copy.loginRequired);
      }

      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) throw new Error(copy.missingApiBase);

      const response = await fetch(`${base}/maps/${targetId}/metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: meta.title,
          youtube_title: meta.youtubeTitle,
          description: meta.description,
          tags: meta.tags ?? [],
          thumbnail_url: meta.thumbnailUrl,
          channel_name: meta.channelName,
          source_type: meta.sourceType,
          source_url: meta.sourceUrl,
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const rawMessage = json?.message || json?.error;
        const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
        throw new Error(typeof message === "string" ? message : copy.createFailed);
      }

      let latestDraft: MapDraft | null = null;
      try {
        const { data, error: refreshError } = await supabase
          .from("maps")
          .select(DRAFT_SELECT_FIELDS)
          .eq("id", targetId)
          .single();

        if (refreshError) throw refreshError;
        if (data) {
          latestDraft = {
            id: data.id,
            createdAt: new Date(data.created_at).getTime(),
            updatedAt: data.updated_at
              ? new Date(data.updated_at).getTime()
              : undefined,
            sourceUrl: data.source_url ?? undefined,
            sourceType: (data as { source_type?: string | null }).source_type
              ? ((data as { source_type?: string | null })
                  .source_type as MapDraft["sourceType"])
              : undefined,
            title: data.title ?? meta.title,
            youtubeTitle:
              (data as { youtube_title?: string | null }).youtube_title ?? undefined,
            shortTitle: data.short_title ?? undefined,
            channelName: data.channel_name ?? undefined,
            thumbnailUrl: data.thumbnail_url
              ? withCacheBuster(data.thumbnail_url)
              : undefined,
            tags: Array.isArray(data.tags) ? data.tags : [],
            description: data.description ?? undefined,
            summary: (data as { summary?: string | null }).summary ?? undefined,
            status: coerceMapStatus(data.map_status),
            creditsCharged:
              typeof data.credits_charged === "number"
                ? data.credits_charged
                : undefined,
          };
        }
      } catch (refreshError) {
        console.error("Failed to refresh draft from DB:", refreshError);
      }

      setDrafts((prev) => {
        const fallbackDraft: MapDraft = {
          id: targetId,
          createdAt: Date.now(),
          sourceUrl: meta.sourceUrl,
          sourceType: meta.sourceType,
          title: meta.title || "Brify structure map",
          youtubeTitle: meta.youtubeTitle,
          channelName: meta.channelName,
          thumbnailUrl: meta.thumbnailUrl
            ? withCacheBuster(meta.thumbnailUrl)
            : undefined,
          tags: meta.tags ?? [],
          description: meta.description,
          status: "processing_structure",
        };
        const nextDraft = latestDraft ?? fallbackDraft;
        const exists = prev.some((draft) => draft.id === targetId);

        if (!exists) return [nextDraft, ...prev];

        return prev.map((draft) =>
          draft.id === targetId
            ? { ...draft, ...nextDraft }
            : draft.parentMapId === targetId
            ? {
                ...draft,
                title: nextDraft.title,
                channelName: nextDraft.channelName,
                thumbnailUrl: nextDraft.thumbnailUrl,
                sourceUrl: nextDraft.sourceUrl,
                sourceType: nextDraft.sourceType,
              }
            : draft
        );
      });

      if (shouldAutoOpenWhenReady) {
        setPendingAutoOpenMapId(targetId);
      }

      setShowMetadataDialog(false);
      setCreatedMapId(null);
      setEditingDraft(null);
      setSavingMetaId(null);
      setHighlightedDraftId(targetId);
    } catch (metadataError) {
      setError(getApiMessage(metadataError, copy.createFailed));
      setSavingMetaId(null);
    }
  };

  const handleSubmit = () => {
    void prepareCreateMap();
  };

  const handleTextareaResizeStart = (
    event: ReactPointerEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight =
      textareaRef.current?.getBoundingClientRect().height ?? MIN_TEXTAREA_HEIGHT;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextHeight = Math.min(
        MAX_TEXTAREA_HEIGHT,
        Math.max(MIN_TEXTAREA_HEIGHT, startHeight + moveEvent.clientY - startY)
      );
      setTextareaHeight(nextHeight);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handleUseSample = () => {
    const sample =
      safeLocale === "ko"
        ? "생성형 AI 시대에도 사람들이 직접 구조를 붙잡고 수정할 수 있는 도구는 필요하다.\n\n첫째, 긴 글은 요약만으로 충분하지 않다. 핵심 흐름, 근거, 예시, 세부 내용을 분리해 보아야 한다.\n\n둘째, 구조맵은 읽는 사람의 사고 과정을 시각화한다. 사용자는 노드를 옮기고, 주석을 달고, 다시 볼 수 있다.\n\n셋째, Brify의 가치는 일회성 답변이 아니라 보관 가능한 지식 구조를 만드는 데 있다."
        : "Even in the age of generative AI, people still need tools that let them hold, revise, and share the structure of long ideas.\n\nFirst, summaries are not always enough. Readers need to see claims, reasons, examples, and details separately.\n\nSecond, a structure map visualizes the thinking process. Users can move nodes, add notes, and return to the map later.\n\nThird, Brify's value is not a one-time answer. It is a saved knowledge structure.";
    setText(sample);
    setSourceType("manual");
    setFileName(null);
    setError(null);
    setNotice(null);
  };

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setNotice(copy.fileExtracting);
    setIsExtractingFile(true);

    try {
      const extension = getFileExtension(file.name);
      if (extension !== "docx" && extension !== "pdf" && extension !== "pptx") {
        throw new Error(copy.unsupportedFile);
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/${extension}/extract`, {
        method: "POST",
        body: formData,
      });
      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json?.success) {
        throw new Error(
          typeof json?.error === "string" ? json.error : copy.fileFailed
        );
      }

      const extractedText =
        typeof json.extractedText === "string" ? json.extractedText.trim() : "";
      if (!extractedText) throw new Error(copy.fileFailed);

      setText(extractedText);
      setSourceType("file");
      setFileName(file.name);
      setNotice(copy.fileExtracted);
    } catch (fileError) {
      setError(getApiMessage(fileError, copy.fileFailed));
      setNotice(null);
    } finally {
      setIsExtractingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDropFile = (file: File | null) => {
    setIsDraggingFile(false);
    void handleFileSelected(file);
  };

  const handleResume = () => {
    const pending = resumeInput ?? loadPendingInput();
    if (!pending) return;
    setText(pending.text);
    setSourceType(pending.sourceType ?? "manual");
    setFileName(pending.fileName ?? null);
    void prepareCreateMap(pending);
  };

  const discardResume = () => {
    clearPendingInput();
    setResumeInput(null);
    setNotice(null);
  };

  const startBlankMap = async () => {
    if (isCreatingBlank) return;
    if (!isAuthed) {
      router.push(loginHref);
      return;
    }

    setIsCreatingBlank(true);
    try {
      const response = await fetch("/api/maps/blank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: copy.blankMap }),
      });
      if (response.status === 401) {
        router.push(loginHref);
        return;
      }
      const json = await response.json().catch(() => ({}));
      if (!response.ok || typeof json?.id !== "string") {
        throw new Error("blank_map_create_failed");
      }
      router.push(route(`/maps/${json.id}`));
    } catch (blankError) {
      console.error("Failed to create blank map:", blankError);
    } finally {
      setIsCreatingBlank(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch(`/auth/signout?locale=${safeLocale}`, {
        method: "POST",
        cache: "no-store",
      });
    } finally {
      router.replace(route(""));
      router.refresh();
    }
  };

  const publicNavItems = [
    { label: copy.brandHome, href: route(""), icon: "lucide:home" },
    { label: copy.navBlog, href: route("/blog"), icon: "lucide:newspaper" },
    { label: copy.navPricing, href: route("/pricing"), icon: "lucide:badge-dollar-sign" },
    { label: copy.navSupport, href: route("/support"), icon: "lucide:message-circle" },
  ];

  const authedNavItems = [
    { label: copy.myMaps, href: route("/maps"), icon: "lucide:folder-open" },
    { label: copy.billing, href: route("/billing"), icon: "lucide:wallet" },
    { label: copy.billingHistory, href: route("/billing/history"), icon: "lucide:receipt" },
  ];

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950 dark:bg-[#05070d] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(740px_260px_at_18%_8%,rgba(14,165,233,0.18),transparent_72%),radial-gradient(620px_280px_at_82%_4%,rgba(245,158,11,0.13),transparent_70%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,248,251,0))] dark:bg-[radial-gradient(760px_280px_at_18%_8%,rgba(34,211,238,0.2),transparent_72%),radial-gradient(620px_280px_at_82%_4%,rgba(251,191,36,0.12),transparent_70%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(5,7,13,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:28px_28px] opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent_70%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] dark:opacity-45" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-slate-200 bg-white/86 px-3 py-4 shadow-[16px_0_60px_-48px_rgba(15,23,42,0.7)] backdrop-blur-xl lg:flex dark:border-white/10 dark:bg-[#080d16]/88">
        <a
          href={route("")}
          className="mb-4 flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-slate-100 dark:hover:bg-white/8"
        >
          <Image
            src="/images/newlogo.png"
            alt="Brify"
            width={36}
            height={36}
            className="h-9 w-9"
          />
          <span className="text-[21px] font-black tracking-normal text-slate-950 dark:text-white">
            Brify
          </span>
        </a>

        <div className="mb-3 flex flex-col gap-1">
          {isAuthed ? (
            <>
              <button
                type="button"
                onClick={() => router.push(route(""))}
                className="flex h-11 items-center gap-3 rounded-2xl bg-slate-950 px-3 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
              >
                <Icon icon="lucide:plus" className="h-4 w-4" />
                {copy.newMap}
              </button>
              <button
                type="button"
                onClick={() => void startBlankMap()}
                disabled={isCreatingBlank}
                className="flex h-10 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:opacity-55 dark:text-white/62 dark:hover:bg-white/8 dark:hover:text-white"
              >
                <Icon icon="lucide:file-plus-2" className="h-4 w-4" />
                {isCreatingBlank ? copy.blankCreating : copy.blankMap}
              </button>
            </>
          ) : (
            <a
              href={signupHref}
              className="flex h-11 items-center gap-3 rounded-2xl bg-slate-950 px-3 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              <Icon icon="lucide:plus" className="h-4 w-4" />
              {copy.create}
            </a>
          )}
        </div>

        <nav className="flex flex-col gap-1">
          {publicNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex h-10 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-white/60 dark:hover:bg-white/8 dark:hover:text-white"
            >
              <Icon icon={item.icon} className="h-4 w-4" />
              {item.label}
            </a>
          ))}
        </nav>

        {isAuthed ? (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
            <div className="mb-2 px-3 text-[11px] font-black uppercase tracking-normal text-slate-400 dark:text-white/32">
              {copy.account}
            </div>
            <div className="flex flex-col gap-1">
              {authedNavItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex h-10 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-white/60 dark:hover:bg-white/8 dark:hover:text-white"
                >
                  <Icon icon={item.icon} className="h-4 w-4" />
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-auto border-t border-slate-200 pt-3 dark:border-white/10">
          {isAuthed && email ? (
            <div className="mb-2 truncate px-3 text-xs font-semibold text-slate-500 dark:text-white/45">
              {email}
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-2 px-1">
            <LanguageSelector compact />
            <ThemeToggle />
          </div>
          {isAuthed ? (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="mt-2 flex h-10 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-white/50 dark:hover:bg-white/8 dark:hover:text-white"
            >
              <Icon icon="lucide:log-out" className="h-4 w-4" />
              {copy.logout}
            </button>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <a
                href={loginHref}
                className="inline-flex h-10 items-center justify-center rounded-2xl text-sm font-black text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-white/58 dark:hover:bg-white/8 dark:hover:text-white"
              >
                {copy.login}
              </a>
              <a
                href={signupHref}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100"
              >
                {copy.signup}
              </a>
            </div>
          )}
        </div>
      </aside>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-4 pb-20 pt-4 sm:px-6 lg:ml-[264px] lg:w-[calc(100%-264px)] lg:px-8">
        <div className="mb-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/86 px-3 py-2 shadow-sm backdrop-blur lg:hidden dark:border-white/10 dark:bg-[#0d1422]/88">
          <a href={route("")} className="flex items-center gap-2">
            <Image
              src="/images/newlogo.png"
              alt="Brify"
              width={30}
              height={30}
              className="h-7 w-7"
            />
            <span className="text-lg font-black text-slate-950 dark:text-white">Brify</span>
          </a>
          <div className="flex items-center gap-1">
            <LanguageSelector compact />
            <ThemeToggle />
            {isAuthed ? (
              <a
                href={route("/maps")}
                className="inline-flex h-8 items-center rounded-xl px-2 text-xs font-black text-slate-600 dark:text-white/62"
              >
                {copy.myMaps}
              </a>
            ) : (
              <a
                href={signupHref}
                className="inline-flex h-8 items-center rounded-xl bg-slate-950 px-3 text-xs font-black text-white dark:bg-cyan-400 dark:text-slate-950"
              >
                {copy.signup}
              </a>
            )}
          </div>
        </div>

        <section className="flex flex-col items-center pt-5 text-center sm:pt-7">
          <h1 className="max-w-2xl text-[17px] font-bold leading-7 tracking-normal text-slate-700 sm:text-[19px] dark:text-white/76">
            {copy.headline}
          </h1>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              if (!isGenerating && !isExtractingFile) setIsDraggingFile(true);
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              if (!isGenerating && !isExtractingFile) setIsDraggingFile(true);
            }}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
              setIsDraggingFile(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (isGenerating || isExtractingFile) return;
              handleDropFile(event.dataTransfer.files?.[0] ?? null);
            }}
            className={[
              "mt-4 w-full max-w-3xl rounded-[28px] border bg-white px-4 py-3 text-left shadow-[0_24px_70px_-50px_rgba(15,23,42,0.68)] transition dark:bg-[#0d1422] dark:shadow-[0_32px_90px_-58px_rgba(0,0,0,0.9)]",
              isDraggingFile
                ? "border-cyan-400 ring-4 ring-cyan-300/20 dark:border-cyan-300/80"
                : "border-slate-200 dark:border-white/12",
            ].join(" ")}
          >
            {isDraggingFile ? (
              <div className="mb-2 rounded-2xl bg-cyan-50 px-3 py-2 text-sm font-black text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-200">
                {copy.dropReady}
              </div>
            ) : null}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setError(null);
                  setNotice(null);
                }}
                placeholder={copy.textareaPlaceholder}
                style={textareaHeight ? { height: textareaHeight } : undefined}
                className="min-h-[108px] max-h-[520px] w-full resize-none border-0 bg-transparent px-1 py-1 pr-8 text-[15px] leading-6 text-slate-900 outline-none placeholder:text-slate-400 sm:min-h-[118px] dark:text-white dark:placeholder:text-white/34"
              />
              <button
                type="button"
                onPointerDown={handleTextareaResizeStart}
                aria-label="Resize input"
                className="absolute bottom-1 right-0 inline-flex h-7 w-7 cursor-ns-resize items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 dark:text-white/24 dark:hover:bg-white/8 dark:hover:text-white/50"
              >
                <Icon icon="lucide:grip" className="h-3.5 w-3.5 rotate-45" />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                className="hidden"
                onChange={(event) => {
                  void handleFileSelected(event.target.files?.[0] ?? null);
                }}
              />
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating || isExtractingFile}
                  aria-label={copy.uploadHint}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-55 dark:text-white/56 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <Icon icon="lucide:paperclip" className="h-4.5 w-4.5" />
                </button>
                <div className="pointer-events-none absolute bottom-11 left-1/2 z-30 w-max max-w-[240px] -translate-x-1/2 translate-y-1 rounded-xl bg-slate-950 px-3 py-2 text-center text-xs font-bold leading-5 text-white opacity-0 shadow-[0_16px_34px_-22px_rgba(15,23,42,0.9)] transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 dark:bg-white dark:text-slate-950">
                  {copy.uploadHint}
                </div>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsToolMenuOpen((open) => !open)}
                  disabled={isGenerating || isExtractingFile}
                  title={copy.moreActions}
                  aria-label={copy.moreActions}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-55 dark:text-white/56 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <Icon icon="lucide:plus" className="h-4.5 w-4.5" />
                </button>
                {isToolMenuOpen ? (
                  <div className="absolute left-0 top-11 z-20 w-64 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_20px_55px_-30px_rgba(15,23,42,0.75)] dark:border-white/12 dark:bg-[#111827]">
                    <button
                      type="button"
                      onClick={() => {
                        handleUseSample();
                        setIsToolMenuOpen(false);
                      }}
                      className="flex h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-white/66 dark:hover:bg-white/8 dark:hover:text-white"
                    >
                      <Icon icon="lucide:wand-2" className="h-4 w-4" />
                      {copy.trySample}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowYoutubeDialog(true);
                        setIsToolMenuOpen(false);
                      }}
                      className="flex h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-white/66 dark:hover:bg-white/8 dark:hover:text-white"
                    >
                      <Icon icon="lucide:youtube" className="h-4 w-4" />
                      {copy.youtubeHelp}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="ml-auto text-xs font-semibold text-slate-400 dark:text-white/36">
                {charCount > 0 ? `${charCount.toLocaleString()} ${copy.charCount}` : ""}
              </div>
            </div>

            <div className="mt-1 min-h-5 text-sm">
              {fileName ? (
                <span className="mr-3 inline-flex items-center gap-1.5 text-slate-500 dark:text-white/48">
                  <Icon icon="lucide:file-text" className="h-3.5 w-3.5" />
                  {fileName}
                </span>
              ) : null}
              {notice ? (
                <span className="ml-0 block font-semibold text-cyan-700 dark:text-cyan-300 sm:ml-2 sm:inline">
                  {notice}
                </span>
              ) : null}
            </div>

            {error ? (
              <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-400/22 dark:bg-rose-500/10 dark:text-rose-200">
                <div className="flex items-start gap-2">
                  <Icon icon="lucide:circle-alert" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
                {error === copy.insufficientCredits ? (
                  <a
                    href={`/${safeLocale}/billing`}
                    className="mt-2 inline-flex text-sm font-black underline underline-offset-4"
                  >
                    {copy.goBilling}
                  </a>
                ) : null}
              </div>
            ) : null}

            {resumeInput && shouldResume && isAuthed && !isGenerating ? (
              <div className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 dark:border-cyan-300/20 dark:bg-cyan-400/10">
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  {copy.resumeTitle}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-white/62">
                  {copy.resumeBody}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleResume}
                    className="inline-flex h-9 items-center rounded-xl bg-cyan-600 px-3 text-sm font-black text-white transition hover:bg-cyan-500"
                  >
                    {copy.resumeCta}
                  </button>
                  <button
                    type="button"
                    onClick={discardResume}
                    className="inline-flex h-9 items-center rounded-xl px-3 text-sm font-bold text-slate-500 transition hover:bg-white/70 dark:text-white/55 dark:hover:bg-white/10"
                  >
                    {copy.discard}
                  </button>
                </div>
              </div>
            ) : null}

            {isGenerating ? (
              <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-4 dark:bg-white/[0.05]">
                <div className="flex items-center gap-3">
                  <Icon icon="lucide:loader-circle" className="h-5 w-5 animate-spin text-cyan-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {copy.creating}
                      </div>
                      {generationProgress !== null ? (
                        <div className="shrink-0 text-sm font-black tabular-nums text-cyan-700 dark:text-cyan-300">
                          {generationProgress}%
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-white/52">
                      {copy.loadingSteps[loadingStep]}
                    </div>
                    {generationProgress !== null ? (
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/12">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-[width] duration-700 ease-out"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canCreate}
            className="mt-4 inline-flex h-12 min-w-[190px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 text-[16px] font-black text-white shadow-[0_20px_42px_-26px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
          >
            {isGenerating ? (
              <Icon icon="lucide:loader-circle" className="h-5 w-5 animate-spin" />
            ) : isEstimatingCredits ? (
              <Icon icon="lucide:loader-circle" className="h-5 w-5 animate-spin" />
            ) : (
              <Icon icon="lucide:git-branch" className="h-5 w-5" />
            )}
            {isGenerating
              ? copy.creating
              : isEstimatingCredits
              ? copy.creditLoading
              : copy.create}
          </button>
        </section>

        {drafts.length > 0 ? (
          <section ref={draftsSectionRef} className="pt-8">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-[20px] font-black tracking-normal text-slate-950 dark:text-white">
                {copy.draftsTitle}
              </h2>
            </div>
            <div className="grid gap-3">
              {drafts
                .filter((draft) => draft.visible !== false)
                .map((draft) => (
                  <DraftMapCard
                    key={draft.id}
                    draft={draft}
                    highlighted={highlightedDraftId === draft.id}
                    isSavingMetadata={savingMetaId === draft.id}
                    onEditMetadata={(nextDraft) => {
                      if (nextDraft.kind && nextDraft.kind !== "map") return;
                      setCreatedMapId(null);
                      setEditingDraft(nextDraft);
                      setShowMetadataDialog(true);
                    }}
                    onOpen={(nextDraft) => {
                      if (nextDraft.kind && nextDraft.kind !== "map") return;
                      router.push(`/${safeLocale}/maps/${nextDraft.id}`);
                    }}
                  />
                ))}
            </div>
          </section>
        ) : null}

        <section className="pt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-black tracking-normal text-slate-950 dark:text-white">
                {copy.examplesTitle}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-white/52">
                {copy.examplesSubhead}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXAMPLE_MAPS.map((example) => (
              <a
                key={example.title}
                href={example.href}
                aria-label={`${copy.viewExample}: ${example.title}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white/88 shadow-[0_16px_42px_-34px_rgba(15,23,42,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_54px_-36px_rgba(15,23,42,0.65)] dark:border-white/10 dark:bg-[#0d1422]/88"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-white/[0.04]">
                  <Image
                    src={example.image}
                    alt={example.title}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                    className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/72 via-slate-950/26 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate rounded-full bg-white/92 px-3 py-1.5 text-[13px] font-black text-slate-950 shadow-[0_12px_24px_-16px_rgba(15,23,42,0.75)] backdrop-blur dark:bg-[#0f172a]/90 dark:text-white">
                      {example.title}
                    </span>
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/92 text-slate-950 shadow-[0_12px_24px_-16px_rgba(15,23,42,0.75)] backdrop-blur transition group-hover:bg-cyan-400 dark:bg-[#0f172a]/90 dark:text-white dark:group-hover:bg-cyan-400 dark:group-hover:text-slate-950">
                      <Icon icon="lucide:arrow-up-right" className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/10" />
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="pt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-[22px] font-black tracking-normal text-slate-950 dark:text-white">
              {copy.myMapsTitle}
            </h2>
            {isAuthed ? (
              <a
                href={`/${safeLocale}/maps`}
                className="inline-flex items-center gap-1.5 text-sm font-black text-slate-600 transition hover:text-slate-950 dark:text-white/56 dark:hover:text-white"
              >
                {copy.openMap}
                <Icon icon="lucide:arrow-right" className="h-4 w-4" />
              </a>
            ) : null}
          </div>

          {!isAuthed ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/68 px-5 py-6 text-sm font-semibold text-slate-500 dark:border-white/14 dark:bg-white/[0.04] dark:text-white/48">
              {copy.myMapsLogin}
            </div>
          ) : isLoadingRecentMaps ? (
            <>
              <div className="mb-3 text-sm font-semibold text-slate-500 dark:text-white/48">
                {copy.myMapsLoading}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white/72 dark:border-white/10 dark:bg-white/[0.06]"
                  />
                ))}
              </div>
            </>
          ) : recentMaps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/68 px-5 py-6 text-sm font-semibold text-slate-500 dark:border-white/14 dark:bg-white/[0.04] dark:text-white/48">
              {copy.myMapsEmpty}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {recentMaps.slice(0, 6).map((map) => {
                const title = getRecentMapTitle(map);
                const summary = (map.summary ?? map.description ?? "").trim();
                const structurePreview = getMapStructurePreview(
                  map.mind_elixir,
                  5
                );
                const visibleTags = Array.isArray(map.tags)
                  ? map.tags.slice(0, 3)
                  : [];
                const remainingTagCount = Math.max(
                  (Array.isArray(map.tags) ? map.tags.length : 0) -
                    visibleTags.length,
                  0
                );
                const statusBadge =
                  map.map_status === "failed"
                    ? {
                        text: copy.statusFailed,
                        dotCls: "bg-rose-500 dark:bg-rose-300",
                        textCls: "text-rose-700 dark:text-rose-200",
                      }
                    : map.map_status === "processing_structure" ||
                      map.map_status === "processing_metadata" ||
                      map.map_status === "queued" ||
                      map.map_status === "idle"
                    ? {
                        text: copy.statusProcessing,
                        dotCls: "bg-blue-500 dark:bg-blue-300",
                        textCls: "text-blue-700 dark:text-blue-200",
                      }
                    : null;

                return (
                  <a
                    key={map.id}
                    href={`/${safeLocale}/maps/${map.id}`}
                    className={`group relative flex min-w-0 flex-col rounded-2xl border border-slate-300 bg-white px-3 py-3 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.18)] transition hover:border-slate-400 hover:bg-slate-50/70 hover:shadow-[0_18px_34px_-24px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(13,20,32,0.98),rgba(8,14,24,1))] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_22px_48px_-34px_rgba(2,6,23,0.94)] dark:hover:border-sky-300/22 dark:hover:bg-[linear-gradient(180deg,rgba(18,28,43,0.99),rgba(11,18,29,1))] ${getRecentMapTopBorderClass(
                      map.map_status
                    )}`}
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-[14px] font-semibold leading-5 text-slate-900 transition group-hover:text-blue-700 dark:text-white/94 dark:group-hover:text-blue-200">
                          {title}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                          {statusBadge ? (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium ${statusBadge.textCls}`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${statusBadge.dotCls}`}
                              />
                              {statusBadge.text}
                            </span>
                          ) : null}
                          <span className="text-[11px] font-medium text-slate-500 dark:text-white/52">
                            {formatMapDate(
                              map.updated_at ?? map.created_at,
                              safeLocale
                            )}
                          </span>
                        </div>
                      </div>
                      <Icon
                        icon="lucide:arrow-up-right"
                        className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-blue-600 dark:text-white/38 dark:group-hover:text-blue-200"
                      />
                    </div>

                    <div className="mt-3 min-w-0">
                      <div className="min-w-0">
                        {structurePreview ? (
                          <div className="min-w-0">
                            {structurePreview.rootTopic ? (
                              <p className="inline-flex max-w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-semibold leading-5 text-slate-800 shadow-[0_8px_18px_-16px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-white/[0.065] dark:text-white/82">
                                <span className="line-clamp-1">
                                {structurePreview.rootTopic}
                                </span>
                              </p>
                            ) : null}
                            {structurePreview.childTopics.length ? (
                              <div className="relative ml-2 mt-2 flex min-w-0 flex-col gap-1.5 pl-4 before:absolute before:bottom-2 before:left-0 before:top-0 before:w-px before:bg-slate-200 dark:before:bg-white/12">
                                {structurePreview.childTopics.map(
                                  (topic, index) => (
                                    <span
                                      key={`${topic}-${index}`}
                                      className="relative block max-w-full truncate rounded-md border border-slate-200/80 bg-white px-2 py-1 text-[10px] font-medium leading-4 text-slate-600 shadow-[0_8px_16px_-18px_rgba(15,23,42,0.28)] before:absolute before:left-[-16px] before:top-1/2 before:h-px before:w-4 before:bg-slate-200 dark:border-white/10 dark:bg-white/[0.045] dark:text-white/68 dark:before:bg-white/12"
                                    >
                                      {topic}
                                    </span>
                                  )
                                )}
                                {structurePreview.remainingChildCount > 0 ? (
                                  <span className="relative block text-[10px] font-medium leading-4 text-slate-500 before:absolute before:left-[-16px] before:top-1/2 before:h-px before:w-4 before:bg-slate-200 dark:text-white/54 dark:before:bg-white/12">
                                    +{structurePreview.remainingChildCount}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : summary ? (
                          <p className="line-clamp-2 text-[12px] leading-5 text-slate-600 dark:text-white/68">
                            {summary}
                          </p>
                        ) : (
                          <p className="text-[12px] leading-5 text-slate-400 dark:text-white/38">
                            {copy.noSummary}
                          </p>
                        )}
                        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                          {visibleTags.length ? (
                            <>
                              {visibleTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="max-w-[110px] truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium leading-4 text-slate-600 dark:bg-white/[0.06] dark:text-white/70"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {remainingTagCount > 0 ? (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-white/[0.06] dark:text-white/60">
                                  +{remainingTagCount}
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-500 dark:text-white/50">
                              {copy.noTag}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md border border-blue-200/80 bg-blue-50/85 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-300/14 dark:bg-blue-400/10 dark:text-blue-200/88">
                            <Icon
                              icon="mdi:note-text-outline"
                              className="h-3.5 w-3.5 shrink-0"
                            />
                            <span>
                              {templateCopy(copy.notesCount, {
                                count: map.notes_count ?? 0,
                              })}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md border border-sky-200/80 bg-sky-50/85 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:border-sky-300/14 dark:bg-sky-400/10 dark:text-sky-200/88">
                            <Icon
                              icon="mdi:book-outline"
                              className="h-3.5 w-3.5 shrink-0"
                            />
                            <span>
                              {templateCopy(copy.termsCount, {
                                count: map.terms_count ?? 0,
                              })}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {authOpen ? (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/62 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/20 bg-white p-6 shadow-[0_34px_100px_-36px_rgba(0,0,0,0.7)] dark:bg-[#0d1422]">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-400/12 dark:text-cyan-300">
              <Icon icon="lucide:git-branch" className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black tracking-normal text-slate-950 dark:text-white">
              {copy.authTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/58">
              {copy.authBody}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <a
                href={signupHref}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
              >
                {copy.continueSignup}
              </a>
              <a
                href={loginHref}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/14 dark:text-white/76 dark:hover:bg-white/8"
              >
                {copy.continueLogin}
              </a>
              <button
                type="button"
                onClick={() => setAuthOpen(false)}
                className="mt-1 inline-flex h-10 items-center justify-center rounded-xl text-sm font-bold text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
              >
                {copy.discard}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCreditDialog ? (
        <div
          className="fixed inset-0 z-[520] flex items-center justify-center bg-slate-950/58 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={copy.createOptionsTitle}
          onMouseDown={(event) => {
            if (event.target !== event.currentTarget) return;
            setShowCreditDialog(false);
            setPendingCreditInput(null);
          }}
        >
          <div className="w-full max-w-md rounded-[28px] border border-white/20 bg-white p-5 shadow-[0_34px_100px_-36px_rgba(0,0,0,0.7)] dark:bg-[#0d1422]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-normal text-slate-950 dark:text-white">
                  {copy.createOptionsTitle}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-white/55">
                  {copy.createOptionsBody}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreditDialog(false);
                  setPendingCreditInput(null);
                }}
                aria-label={copy.cancel}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <Icon icon="lucide:x" className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-2 text-xs font-black uppercase tracking-normal text-slate-400 dark:text-white/35">
                  {copy.outputLanguage}
                </div>
                <OutputLanguageSelect
                  value={outputLang}
                  onChange={setOutputLang}
                  disabled={isGenerating}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/62">
                {isLoadingCredits
                  ? copy.creditLoading
                  : isAuthed
                  ? templateCopy(copy.creditStatus, {
                      current: currentCredits.toLocaleString(),
                      required: pendingRequiredCredits,
                    })
                  : templateCopy(copy.requiredCredits, {
                      required: pendingRequiredCredits,
                    })}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreditDialog(false);
                  setPendingCreditInput(null);
                }}
                className="inline-flex h-10 items-center rounded-2xl px-4 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-white"
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  void createMap(pendingCreditInput ?? undefined);
                }}
                className="inline-flex h-10 items-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
              >
                {copy.create}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showMetadataDialog ? (
        <MetadataDialog
          mapId={editingDraft?.id ?? createdMapId ?? undefined}
          initial={{
            sourceType: editingDraft?.sourceType,
            sourceUrl: editingDraft?.sourceUrl ?? "",
            title: editingDraft?.title ?? "",
            youtubeTitle: editingDraft?.youtubeTitle ?? "",
            channelName: editingDraft?.channelName ?? fileName ?? "",
            tags: editingDraft?.tags ?? [],
            description: editingDraft?.description ?? "",
            thumbnailUrl: editingDraft?.thumbnailUrl ?? "",
          }}
          onClose={() => {
            setShowMetadataDialog(false);
            setEditingDraft(null);
            setCreatedMapId(null);
            setSavingMetaId(null);
          }}
          onSave={handleSaveMetadata}
          isProcessing={isGenerating}
          processingTitle={copy.processingTitle}
          processingMessage={copy.loadingSteps[loadingStep]}
          processingBullets={[...copy.processingBullets]}
          processingPercent={generationProgress}
          showYoutubeTitleSync={false}
        />
      ) : null}

      <YoutubeScriptDialog
        open={showYoutubeDialog}
        onClose={() => setShowYoutubeDialog(false)}
      />
    </main>
  );
}
