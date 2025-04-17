'use client';

import LoginForm from '@/components/LoginForm';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function Login() {
  // const t = useTranslations('login');

  return (
    <div className="max-w-(--breakpoint-xl) px-4 py-8 mx-auto sm:py-16 lg:py-24 pt-20 sm:pt-24 lg:pt-32">
      <div className="lg:grid lg:gap-20 lg:items-center lg:grid-cols-12">
        <div className="hidden col-span-6 mr-auto lg:block">
          <Link href="/" className="inline-flex items-center mb-10 text-3xl font-black uppercase tracking-tight">
            <Image
              src="/images/logo.png"
              className="mr-3 h-12"
              alt="Brify Logo"
              width={300}
              height={300}
            />
          </Link>

          <div className="space-y-8">
            {[
              {
                title: 'Get started quickly',
                description:
                  'Integrate with developer-friendly APIs or choose pre-built solutions.',
              },
              {
                title: 'Support any business model',
                description:
                  'Host code that you don’t want to share with the world in private.',
              },
              {
                title: 'Join millions of businesses',
                description:
                  ' is trusted by ambitious startups and enterprises of every size.',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start">
                <div className="w-5 h-5 mr-3 mt-1 border border-primary rounded-full bg-primary" />
                <div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
