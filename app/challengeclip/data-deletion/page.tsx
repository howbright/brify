import type { Metadata } from "next";

const CONTACT_EMAIL = "hello@brify.app";

export const metadata: Metadata = {
  title: "ChallengeClip Data Deletion Request",
  description:
    "How to request deletion of ChallengeClip app data associated with your device.",
};

export default function ChallengeClipDataDeletionPage() {
  return (
    <main className="min-h-screen bg-[#f8faf7] px-4 py-10 text-[#101418] sm:px-6">
      <article className="mx-auto max-w-3xl">
        <header className="border-b border-[#d8ded7] pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#456052]">
            ChallengeClip
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Data Deletion Request
          </h1>
          <p className="mt-3 text-sm text-[#5f6b64]">
            Effective date: June 25, 2026
          </p>
          <p className="mt-6 text-base leading-8 text-[#3f4a44]">
            This page explains how ChallengeClip users can request deletion of
            data associated with their app device ID and Google Play Pro
            purchase verification records.
          </p>
        </header>

        <section className="mt-8 rounded-lg border border-[#d8ded7] bg-white p-5">
          <h2 className="text-lg font-bold">How to Request Deletion</h2>
          <div className="mt-3 space-y-2 text-[15px] leading-7 text-[#3f4a44]">
            <p>
              Email us at{" "}
              <a
                className="font-semibold text-[#1f7a52] underline underline-offset-4"
                href={`mailto:${CONTACT_EMAIL}?subject=ChallengeClip%20Data%20Deletion%20Request`}
              >
                {CONTACT_EMAIL}
              </a>{" "}
              with the subject line “ChallengeClip Data Deletion Request”.
            </p>
            <p>
              If possible, include the Device ID shown in the app support
              dialog. This helps us find the correct server-side records.
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-[#d8ded7] bg-white p-5">
          <h2 className="text-lg font-bold">Data We Can Delete</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-[#3f4a44]">
            <li>ChallengeClip server device identifier records</li>
            <li>Google Play Pro entitlement status associated with that Device ID</li>
            <li>Pro feature usage event records associated with that Device ID</li>
          </ul>
        </section>

        <section className="mt-5 rounded-lg border border-[#d8ded7] bg-white p-5">
          <h2 className="text-lg font-bold">Data Stored on Your Device</h2>
          <div className="mt-3 space-y-2 text-[15px] leading-7 text-[#3f4a44]">
            <p>
              Challenge records, clips, edited videos, and exported videos are
              stored primarily on your device. You can delete challenges or
              clips inside the app. You can also delete app data by uninstalling
              the app or clearing the app storage in Android settings.
            </p>
            <p>
              Videos exported to your device gallery may need to be deleted
              separately from your device media library.
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-[#d8ded7] bg-white p-5">
          <h2 className="text-lg font-bold">Data We May Retain</h2>
          <p className="mt-3 text-[15px] leading-7 text-[#3f4a44]">
            We may retain limited purchase, refund, fraud prevention, security,
            or legal compliance records where required or permitted by
            applicable law. We do not store full payment card numbers.
          </p>
        </section>

        <section className="mt-5 rounded-lg border border-[#d8ded7] bg-white p-5">
          <h2 className="text-lg font-bold">Response Time</h2>
          <p className="mt-3 text-[15px] leading-7 text-[#3f4a44]">
            We will review deletion requests and respond within a reasonable
            time after receiving the information needed to identify the relevant
            records.
          </p>
        </section>
      </article>
    </main>
  );
}
