'use client';

import { useLocale } from 'next-intl';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';

const locales = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English (US)', flag: '🇺🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'zh', label: '中文 (繁體)', flag: '🇨🇳' },
];

export default function LanguageSelector() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center text-gray-800 dark:text-gray-300 hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-2.5 lg:px-5 py-2.5 mr-2 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800"
      >
        <span className="mr-2 w-5 h-5 text-xl">
          {locales.find((l) => l.code === currentLocale)?.flag}
        </span>
        {locales.find((l) => l.code === currentLocale)?.label || currentLocale}
        <svg
          className="ml-1 w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 bg-white dark:bg-gray-700 rounded shadow divide-y divide-gray-100 dark:divide-gray-600">
          <ul className="py-1 text-sm text-gray-700 dark:text-gray-300" role="menu">
            {locales.map((locale) => (
              <li key={locale.code}>
                <Link
                  href={pathname}
                  locale={locale.code}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                  role="menuitem"
                >
                  <span className="inline-flex items-center">
                    <span className="text-lg mr-2">{locale.flag}</span>
                    {locale.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
