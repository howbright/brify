// app/privacy/page.tsx

export default function PrivacyPage() {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
  
        <p>This policy describes how we collect, use, and protect your personal information.</p>
  
        <h2 className="text-lg font-semibold">1. Information We Collect</h2>
        <p>We collect your email address when you sign up via magic link or social login (Google, Apple). We also collect basic usage data to improve the service.</p>
  
        <h2 className="text-lg font-semibold">2. How We Use Information</h2>
        <p>Your email is used to authenticate you and send login links. Usage data is used to analyze and improve the performance and reliability of the service.</p>
  
        <h2 className="text-lg font-semibold">3. Third-Party Services</h2>
        <p>We use third-party providers (such as Supabase for authentication and LemonSqueezy for payments). These providers may store or process your data according to their policies.</p>
  
        <h2 className="text-lg font-semibold">4. Data Retention</h2>
        <p>We retain your data for as long as your account is active or as needed to provide you the service. You may request account deletion at any time.</p>
  
        <h2 className="text-lg font-semibold">5. Security</h2>
        <p>We take reasonable measures to protect your personal information, including encrypted storage and access controls.</p>
  
        <h2 className="text-lg font-semibold">6. Your Rights</h2>
        <p>You have the right to access, modify, or delete your data. Contact us at support@harudrive.store for assistance.</p>
  
        <h2 className="text-lg font-semibold">7. Changes to This Policy</h2>
        <p>We may update this policy from time to time. Changes will be posted on this page with updated effective dates.</p>
      </div>
    );
  }
  