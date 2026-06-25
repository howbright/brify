import type { Metadata } from "next";
import Link from "next/link";

const CONTACT_EMAIL = "support@harudrive.store";

const sections = [
  {
    title: "1. Information We Process",
    body: [
      "ChallengeClip stores information you create in the app, such as challenge names, goal days, clip records, and app settings, so you can create progress videos.",
      "When you use the camera or import feature, video files, recorded audio, and edited video outputs may be stored on your device.",
      "If you choose to save an exported video to your gallery, the exported video may be saved to your device's media library, such as Movies/ChallengeClip.",
      "For Pro purchase verification and entitlement management, ChallengeClip may send a device identifier, Google Play purchase verification data, entitlement status, and Pro feature usage events to our server.",
    ],
  },
  {
    title: "2. Permissions",
    body: [
      "Camera permission is used to record challenge clips inside the app.",
      "Microphone permission is used when you record videos with original sound.",
      "The Android photo picker or selected media access is used only when you choose a video from your device to import as a challenge clip.",
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
      "We use Google Play purchase tokens and order-related information only to verify Pro access, process entitlement changes, prevent abuse, and support refunds or revocations.",
    ],
  },
  {
    title: "5. Sharing and Third Parties",
    body: [
      "ChallengeClip does not upload your videos to our own servers or sell them to third parties.",
      "Purchase verification data is processed through Google Play and our entitlement server.",
      "If you use your device's sharing feature to send a video to another app, that sharing is initiated by you and the receiving app's policies apply.",
    ],
  },
  {
    title: "6. Retention and Deletion",
    body: [
      "Challenge records and video files are stored primarily on your device.",
      "Server-side device identifier, purchase verification, entitlement, and Pro feature usage records may be retained as needed to provide Pro access, handle refunds, prevent abuse, and comply with legal obligations.",
      "Exported videos that you save to the gallery may remain in your device's media library even if you later delete the app, depending on your device and operating system settings.",
      "You can delete challenges or clips inside the app. If you uninstall the app, app data stored on your device may be deleted according to your operating system's behavior.",
      "You can request deletion of server-side ChallengeClip data at https://www.brify.app/challengeclip/data-deletion.",
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
      "ChallengeClip uses HTTPS to transmit data between the app and our entitlement server.",
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
];

export const metadata: Metadata = {
  title: "ChallengeClip Privacy Policy",
  description:
    "Privacy Policy for the ChallengeClip mobile app.",
};

export default function ChallengeClipPrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f8faf7] px-4 py-10 text-[#101418] sm:px-6">
      <article className="mx-auto max-w-3xl">
        <header className="border-b border-[#d8ded7] pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#456052]">
            ChallengeClip
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-[#5f6b64]">
            Effective date: June 18, 2026
          </p>
          <p className="mt-6 text-base leading-8 text-[#3f4a44]">
            This Privacy Policy explains how the ChallengeClip mobile app
            handles user and device data.
          </p>
        </header>

        <section className="mt-8 rounded-lg border border-[#d8ded7] bg-white p-5">
          <h2 className="text-lg font-bold">Summary</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-[#3f4a44]">
            <li>
              Your recorded videos and challenge records are stored primarily
              on your device.
            </li>
            <li>
              ChallengeClip does not upload or sell your videos to our own
              servers.
            </li>
            <li>
              Pro purchases are processed through Google Play Billing and
              verified through our entitlement server.
            </li>
            <li>
              You can request deletion of server-side ChallengeClip data at{" "}
              <Link
                className="font-semibold text-[#1f7a52] underline underline-offset-4"
                href="/challengeclip/data-deletion"
              >
                our data deletion request page
              </Link>
              .
            </li>
          </ul>
        </section>

        <div className="mt-6 space-y-5">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-lg border border-[#d8ded7] bg-white p-5"
            >
              <h2 className="text-lg font-bold">{section.title}</h2>
              <div className="mt-3 space-y-2 text-[15px] leading-7 text-[#3f4a44]">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
