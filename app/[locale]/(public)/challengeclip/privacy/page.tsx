type Params = { locale: string };

type PolicySection = {
  title: string;
  body: string[];
};

type PolicyCopy = {
  badge: string;
  title: string;
  effectiveDate: string;
  intro: string;
  highlights: string[];
  sections: PolicySection[];
};

const CONTACT_EMAIL = "support@harudrive.store";

const KO_COPY: PolicyCopy = {
  badge: "ChallengeClip",
  title: "ChallengeClip 개인정보 처리방침",
  effectiveDate: "시행일: 2026년 6월 18일",
  intro:
    "본 개인정보 처리방침은 ChallengeClip 모바일 앱이 사용자 및 기기 데이터를 어떻게 처리하는지 설명합니다.",
  highlights: [
    "촬영한 영상과 챌린지 기록은 기본적으로 사용자의 기기 안에 저장됩니다.",
    "ChallengeClip은 사용자의 영상을 자체 서버에 업로드하거나 판매하지 않습니다.",
    "Pro 구매는 Google Play 결제 시스템을 통해 처리됩니다.",
  ],
  sections: [
    {
      title: "1. 처리하는 정보",
      body: [
        "ChallengeClip은 사용자가 챌린지 진행 영상을 만들 수 있도록 챌린지 이름, 목표 일수, 클립 기록, 앱 설정 등 앱 사용 중 생성한 정보를 기기에 저장합니다.",
        "사용자가 카메라 또는 가져오기 기능을 사용할 경우 영상 파일, 녹음된 오디오, 영상 편집 결과가 사용자의 기기에 저장될 수 있습니다.",
      ],
    },
    {
      title: "2. 권한 사용",
      body: [
        "카메라 권한은 앱 안에서 챌린지 클립을 촬영하기 위해 사용됩니다.",
        "마이크 권한은 사용자가 원본 소리를 포함한 영상을 녹화할 수 있도록 사용됩니다.",
        "선택한 영상 접근 권한은 사용자가 기기에서 직접 선택한 영상을 챌린지 클립으로 가져오기 위해 사용됩니다.",
      ],
    },
    {
      title: "3. 정보 이용 목적",
      body: [
        "앱은 사용자가 챌린지 클립을 저장, 편집, 내보내기, 공유할 수 있도록 데이터를 사용합니다.",
        "ChallengeClip은 사용자의 영상이나 챌린지 기록을 광고 목적으로 사용하지 않습니다.",
      ],
    },
    {
      title: "4. 결제",
      body: [
        "ChallengeClip Pro는 Google Play 결제 시스템을 통해 제공되는 일회성 인앱 상품입니다.",
        "카드번호 및 결제 수단 정보는 Google Play에서 처리하며, ChallengeClip은 사용자의 전체 결제 수단 정보를 수집하거나 저장하지 않습니다.",
      ],
    },
    {
      title: "5. 제3자 제공 및 공유",
      body: [
        "ChallengeClip은 사용자의 영상을 자체 서버에 업로드하거나 제3자에게 판매하지 않습니다.",
        "사용자가 운영체제의 공유 기능을 사용해 영상을 다른 앱으로 공유하는 경우, 해당 공유는 사용자의 선택에 따라 이루어지며 공유 대상 앱의 정책이 적용됩니다.",
      ],
    },
    {
      title: "6. 보관 및 삭제",
      body: [
        "챌린지 기록과 영상 파일은 기본적으로 사용자의 기기에 보관됩니다.",
        "사용자는 앱 안에서 챌린지나 클립을 삭제할 수 있으며, 앱을 삭제하면 기기에 저장된 앱 데이터도 운영체제 정책에 따라 삭제될 수 있습니다.",
      ],
    },
    {
      title: "7. 아동의 개인정보",
      body: [
        "ChallengeClip은 아동을 주된 대상으로 하지 않습니다.",
        "보호자가 아동의 개인정보 관련 문의를 해야 하는 경우 아래 연락처로 문의할 수 있습니다.",
      ],
    },
    {
      title: "8. 보안",
      body: [
        "ChallengeClip은 앱 데이터가 사용자의 기기 안에서 처리되도록 설계되어 있습니다.",
        "다만 사용자가 직접 영상을 내보내거나 다른 앱으로 공유하는 경우, 공유 이후의 보안과 처리는 해당 저장 위치 또는 공유 대상 앱의 정책을 따릅니다.",
      ],
    },
    {
      title: "9. 문의",
      body: [
        `개인정보 처리방침 또는 ChallengeClip의 데이터 처리에 관한 문의는 ${CONTACT_EMAIL}으로 연락해 주세요.`,
      ],
    },
    {
      title: "10. 변경",
      body: [
        "본 개인정보 처리방침은 앱 기능 또는 법적 요구사항의 변경에 따라 업데이트될 수 있으며, 변경 사항은 이 페이지에 게시됩니다.",
      ],
    },
  ],
};

const EN_COPY: PolicyCopy = {
  badge: "ChallengeClip",
  title: "ChallengeClip Privacy Policy",
  effectiveDate: "Effective date: June 18, 2026",
  intro:
    "This Privacy Policy explains how the ChallengeClip mobile app handles user and device data.",
  highlights: [
    "Your recorded videos and challenge records are stored primarily on your device.",
    "ChallengeClip does not upload or sell your videos to our own servers.",
    "Pro purchases are processed through Google Play Billing.",
  ],
  sections: [
    {
      title: "1. Information We Process",
      body: [
        "ChallengeClip stores information you create in the app, such as challenge names, goal days, clip records, and app settings, so you can create progress videos.",
        "When you use the camera or import feature, video files, recorded audio, and edited video outputs may be stored on your device.",
      ],
    },
    {
      title: "2. Permissions",
      body: [
        "Camera permission is used to record challenge clips inside the app.",
        "Microphone permission is used when you record videos with original sound.",
        "Selected media access is used only when you choose a video from your device to import as a challenge clip.",
      ],
    },
    {
      title: "3. How We Use Information",
      body: [
        "The app uses your data to let you save, edit, export, and share challenge clips.",
        "ChallengeClip does not use your videos or challenge records for advertising purposes.",
      ],
    },
    {
      title: "4. Payments",
      body: [
        "ChallengeClip Pro is a one-time in-app product provided through Google Play Billing.",
        "Payment method details such as full card numbers are processed by Google Play. ChallengeClip does not collect or store your full payment method information.",
      ],
    },
    {
      title: "5. Sharing and Third Parties",
      body: [
        "ChallengeClip does not upload your videos to our own servers or sell them to third parties.",
        "If you use your device's sharing feature to send a video to another app, that sharing is initiated by you and the receiving app's policies apply.",
      ],
    },
    {
      title: "6. Retention and Deletion",
      body: [
        "Challenge records and video files are stored primarily on your device.",
        "You can delete challenges or clips inside the app. If you uninstall the app, app data stored on your device may be deleted according to your operating system's behavior.",
      ],
    },
    {
      title: "7. Children's Privacy",
      body: [
        "ChallengeClip is not primarily directed to children.",
        "If a parent or guardian has questions about a child's personal information, they may contact us using the email address below.",
      ],
    },
    {
      title: "8. Security",
      body: [
        "ChallengeClip is designed so app data is processed on your device.",
        "If you export or share videos to another app or location, the security and handling of that exported content are governed by the destination you choose.",
      ],
    },
    {
      title: "9. Contact",
      body: [
        `For questions about this Privacy Policy or ChallengeClip's data practices, contact us at ${CONTACT_EMAIL}.`,
      ],
    },
    {
      title: "10. Changes",
      body: [
        "We may update this Privacy Policy when app features or legal requirements change. Updates will be posted on this page.",
      ],
    },
  ],
};

const FR_COPY: PolicyCopy = {
  badge: "ChallengeClip",
  title: "Politique de confidentialite de ChallengeClip",
  effectiveDate: "Date d'entree en vigueur : 18 juin 2026",
  intro:
    "Cette politique explique comment l'application mobile ChallengeClip traite les donnees utilisateur et appareil.",
  highlights: [
    "Les videos enregistrees et les donnees de defi sont principalement stockees sur votre appareil.",
    "ChallengeClip ne televerse pas vos videos sur nos propres serveurs et ne les vend pas.",
    "Les achats Pro sont traites par Google Play Billing.",
  ],
  sections: EN_COPY.sections,
};

function getCopy(locale: string): PolicyCopy {
  if (locale === "ko") return KO_COPY;
  if (locale === "fr") return FR_COPY;
  return EN_COPY;
}

export default async function ChallengeClipPrivacyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  const copy = getCopy(locale);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 pb-16 pt-28 sm:px-6 md:pt-32">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-54px_rgba(15,23,42,0.45)] sm:p-8 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100">
            {copy.badge}
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-white/58">
            {copy.effectiveDate}
          </p>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 dark:text-white/72">
            {copy.intro}
          </p>
          <div className="mt-6 grid gap-3">
            {copy.highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/72"
              >
                {highlight}
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          {copy.sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-white/[0.04]"
            >
              <h2 className="text-lg font-bold tracking-[-0.02em]">
                {section.title}
              </h2>
              <div className="mt-3 flex flex-col gap-2 text-[15px] leading-7 text-slate-700 dark:text-white/72">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
