import { createClient } from "@/utils/supabase/server";
import DeleteAccountForm from "./DeleteAccountForm";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const COPY = {
  ko: {
    title: "계정 설정",
    description: "로그인 계정과 크레딧 상태를 확인하고, 필요한 경우 회원탈퇴를 진행할 수 있습니다.",
    email: "이메일",
    credits: "보유 크레딧",
    freeCredits: "무료 크레딧",
    paidCredits: "유료 크레딧",
    delete: {
      title: "회원탈퇴",
      body: "회원탈퇴를 진행하면 계정, 프로필, 생성한 구조맵, 메모, 용어, 알림 등 개인 데이터가 삭제됩니다. 결제 기록은 회계 및 환불 확인을 위해 개인 식별 정보를 제거한 상태로 보존될 수 있습니다. 이 작업은 되돌릴 수 없습니다.",
      confirmLabel: "탈퇴하려면 DELETE를 입력하세요.",
      confirmPlaceholder: "DELETE",
      button: "회원탈퇴",
      deleting: "탈퇴 처리 중...",
      error: "회원탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    },
  },
  en: {
    title: "Account Settings",
    description: "Review your signed-in account and credit balance, or delete your account if needed.",
    email: "Email",
    credits: "Credits",
    freeCredits: "Free credits",
    paidCredits: "Paid credits",
    delete: {
      title: "Delete account",
      body: "Deleting your account removes your account, profile, structure maps, notes, terms, notifications, and other personal data. Payment records may be retained without personal identifiers for accounting and refund verification. This action cannot be undone.",
      confirmLabel: "Type DELETE to confirm account deletion.",
      confirmPlaceholder: "DELETE",
      button: "Delete account",
      deleting: "Deleting account...",
      error: "We couldn't delete your account. Please try again shortly.",
    },
  },
  fr: {
    title: "Paramètres du compte",
    description: "Consultez votre compte connecté et vos crédits, ou supprimez votre compte si nécessaire.",
    email: "E-mail",
    credits: "Crédits",
    freeCredits: "Crédits gratuits",
    paidCredits: "Crédits payants",
    delete: {
      title: "Supprimer le compte",
      body: "La suppression du compte supprime votre compte, votre profil, vos cartes structurées, notes, termes, notifications et autres données personnelles. Les enregistrements de paiement peuvent être conservés sans identifiants personnels pour la comptabilité et les vérifications de remboursement. Cette action est irréversible.",
      confirmLabel: "Saisissez DELETE pour confirmer la suppression du compte.",
      confirmPlaceholder: "DELETE",
      button: "Supprimer le compte",
      deleting: "Suppression du compte...",
      error: "Impossible de supprimer votre compte. Veuillez réessayer plus tard.",
    },
  },
} as const;

function normalizeLocale(locale: string) {
  return locale === "en" || locale === "fr" ? locale : "ko";
}

export default async function AccountPage({ params }: PageProps) {
  const { locale } = await params;
  const pageLocale = normalizeLocale(locale);
  const copy = COPY[pageLocale];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("credits_free, credits_paid")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const freeCredits = Number(profile?.credits_free ?? 0);
  const paidCredits = Number(profile?.credits_paid ?? 0);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-12">
      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.045]">
        <p className="text-sm font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-200">
          Brify
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          {copy.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-white/62">
          {copy.description}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200 bg-white/86 p-5 dark:border-white/10 dark:bg-white/[0.045]">
          <div className="text-xs font-black uppercase tracking-wide text-slate-400">{copy.email}</div>
          <div className="mt-2 break-all text-base font-bold text-slate-950 dark:text-white">
            {user?.email ?? "-"}
          </div>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white/86 p-5 dark:border-white/10 dark:bg-white/[0.045]">
          <div className="text-xs font-black uppercase tracking-wide text-slate-400">{copy.credits}</div>
          <div className="mt-2 text-base font-bold text-slate-950 dark:text-white">
            {freeCredits + paidCredits}
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-white/45">
            {copy.freeCredits}: {freeCredits} · {copy.paidCredits}: {paidCredits}
          </div>
        </div>
      </section>

      <DeleteAccountForm locale={pageLocale} copy={copy.delete} />
    </main>
  );
}
