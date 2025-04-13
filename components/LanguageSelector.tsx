'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Dropdown } from 'flowbite-react';
import { Icon } from '@iconify/react'; 

const locales = [
    { code: 'en', label: 'English' },
    { code: 'ko', label: '한국어' },
    { code: 'ja', label: '日本語' },
    { code: 'zh-CN', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' }
  ];

export default function LanguageSelector() {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();
  const current = locales.find((l) => l.code === currentLocale);
  const localeCodes = locales.map(l => l.code).join('|');

  const handleLocaleChange = (locale: string) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;

    const pathWithoutLocale = pathname.replace(new RegExp(`^/(${localeCodes})`), '');
    const newPath = `/${locale}${pathWithoutLocale || '/'}`;

    router.push(newPath);
  };

  return (
    <div className='hover:bg-gray-200 px-2 rounded-md mr-4 h-9 flex justify-center items-center'>
    <Dropdown
      label={
        <span className="inline-flex items-center text-sm text-gray-800 dark:text-gray-300">
         <Icon icon="ic:baseline-language" className="mr-1 text-lg" />
          {current?.label || currentLocale}
        </span>
      }
      inline
      placement="bottom-end"
      className="z-50"
    >
      {locales.map((locale) => (
        <Dropdown.Item key={locale.code} as="button" onClick={() => handleLocaleChange(locale.code)}>
          <span className="inline-flex items-center">
            {locale.label}
          </span>
        </Dropdown.Item>
      ))}
    </Dropdown>
    </div>
  );
}
