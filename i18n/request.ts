import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

async function loadMessages(locale: string) {
  const [base, maps] = await Promise.all([
    import(`../messages/${locale}/base.json`),
    import(`../messages/${locale}/maps.json`)
  ]);

  return {
    ...base.default,
    ...maps.default
  };
}
 
export default getRequestConfig(async ({requestLocale}) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
 
  return {
    locale,
    messages: await loadMessages(locale)
  };
});
