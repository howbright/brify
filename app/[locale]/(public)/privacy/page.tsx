type Params = { locale: string };

type PrivacyCopy = {
  title: string;
  intro: string;
  section1Title: string;
  section1Body: string;
  section2Title: string;
  section2Body: string;
  section3Title: string;
  section3Body: string;
  section4Title: string;
  section4Body: string;
  section5Title: string;
  section5Body: string;
  section6Title: string;
  section6Body: string;
  section7Title: string;
  section7Body: string;
};

const KO_COPY: PrivacyCopy = {
  title: "개인정보 처리방침",
  intro: "본 방침은 Brify가 개인정보를 어떻게 수집, 이용, 보호하는지 설명합니다.",
  section1Title: "1. 수집하는 정보",
  section1Body:
    "매직링크 또는 소셜 로그인(구글, 애플) 가입 시 이메일 주소를 수집합니다. 또한 서비스 개선을 위해 기본 사용 데이터를 수집할 수 있습니다.",
  section2Title: "2. 정보 이용 목적",
  section2Body:
    "이메일은 로그인 인증과 로그인 링크 발송에 사용됩니다. 사용 데이터는 서비스 성능과 안정성 개선을 위한 분석에 사용됩니다.",
  section3Title: "3. 제3자 서비스",
  section3Body:
    "Brify는 인증을 위한 Supabase, 결제를 위한 LemonSqueezy 등 제3자 서비스를 사용합니다. 해당 서비스 제공자는 각자의 정책에 따라 데이터를 저장하거나 처리할 수 있습니다.",
  section4Title: "4. 보관 기간",
  section4Body:
    "계정이 활성화되어 있는 동안 또는 서비스 제공에 필요한 기간 동안 데이터를 보관합니다. 언제든지 계정 삭제를 요청할 수 있습니다.",
  section5Title: "5. 보안",
  section5Body:
    "암호화 저장 및 접근 제어 등 합리적인 보안 조치를 통해 개인정보를 보호합니다.",
  section6Title: "6. 이용자 권리",
  section6Body:
    "이용자는 개인정보 열람, 수정, 삭제를 요청할 수 있습니다. 문의: support@harudrive.store",
  section7Title: "7. 방침 변경",
  section7Body:
    "본 방침은 필요 시 변경될 수 있으며, 변경 사항은 본 페이지에 업데이트됩니다.",
};

const EN_COPY: PrivacyCopy = {
  title: "Privacy Policy",
  intro: "This policy describes how we collect, use, and protect your personal information.",
  section1Title: "1. Information We Collect",
  section1Body:
    "We collect your email address when you sign up via magic link or social login (Google, Apple). We also collect basic usage data to improve the service.",
  section2Title: "2. How We Use Information",
  section2Body:
    "Your email is used to authenticate you and send login links. Usage data is used to analyze and improve the performance and reliability of the service.",
  section3Title: "3. Third-Party Services",
  section3Body:
    "We use third-party providers (such as Supabase for authentication and LemonSqueezy for payments). These providers may store or process your data according to their policies.",
  section4Title: "4. Data Retention",
  section4Body:
    "We retain your data for as long as your account is active or as needed to provide you the service. You may request account deletion at any time.",
  section5Title: "5. Security",
  section5Body:
    "We take reasonable measures to protect your personal information, including encrypted storage and access controls.",
  section6Title: "6. Your Rights",
  section6Body:
    "You have the right to access, modify, or delete your data. Contact us at support@harudrive.store for assistance.",
  section7Title: "7. Changes to This Policy",
  section7Body:
    "We may update this policy from time to time. Changes will be posted on this page with updated effective dates.",
};

const FR_COPY: PrivacyCopy = {
  title: "Politique de confidentialité",
  intro:
    "Cette politique explique comment Brify collecte, utilise et protège vos informations personnelles.",
  section1Title: "1. Informations que nous collectons",
  section1Body:
    "Nous collectons votre adresse e-mail lors de l'inscription via lien magique ou connexion sociale (Google, Apple). Nous collectons aussi des données d'usage de base pour améliorer le service.",
  section2Title: "2. Utilisation des informations",
  section2Body:
    "Votre e-mail sert à vous authentifier et à envoyer les liens de connexion. Les données d'usage servent à analyser et améliorer la performance et la fiabilité du service.",
  section3Title: "3. Services tiers",
  section3Body:
    "Nous utilisons des prestataires tiers (comme Supabase pour l'authentification et LemonSqueezy pour les paiements). Ces prestataires peuvent stocker ou traiter vos données selon leurs propres politiques.",
  section4Title: "4. Durée de conservation",
  section4Body:
    "Nous conservons vos données tant que votre compte est actif ou aussi longtemps que nécessaire pour fournir le service. Vous pouvez demander la suppression du compte à tout moment.",
  section5Title: "5. Sécurité",
  section5Body:
    "Nous mettons en place des mesures raisonnables pour protéger vos données personnelles, y compris le stockage chiffré et le contrôle d'accès.",
  section6Title: "6. Vos droits",
  section6Body:
    "Vous avez le droit d'accéder, de modifier ou de supprimer vos données. Contact: support@harudrive.store",
  section7Title: "7. Modifications de cette politique",
  section7Body:
    "Nous pouvons mettre à jour cette politique de temps à autre. Les changements seront publiés sur cette page.",
};

function getCopy(locale: string): PrivacyCopy {
  if (locale === "ko") return KO_COPY;
  if (locale === "fr") return FR_COPY;
  return EN_COPY;
}

export default async function PrivacyPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const copy = getCopy(locale);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-bold">{copy.title}</h1>
      <p>{copy.intro}</p>

      <h2 className="text-lg font-semibold">{copy.section1Title}</h2>
      <p>{copy.section1Body}</p>

      <h2 className="text-lg font-semibold">{copy.section2Title}</h2>
      <p>{copy.section2Body}</p>

      <h2 className="text-lg font-semibold">{copy.section3Title}</h2>
      <p>{copy.section3Body}</p>

      <h2 className="text-lg font-semibold">{copy.section4Title}</h2>
      <p>{copy.section4Body}</p>

      <h2 className="text-lg font-semibold">{copy.section5Title}</h2>
      <p>{copy.section5Body}</p>

      <h2 className="text-lg font-semibold">{copy.section6Title}</h2>
      <p>{copy.section6Body}</p>

      <h2 className="text-lg font-semibold">{copy.section7Title}</h2>
      <p>{copy.section7Body}</p>
    </div>
  );
}
