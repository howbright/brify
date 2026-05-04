import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

function mergeMessages(base: unknown, override: unknown): unknown {
  if (
    typeof base !== 'object' ||
    base === null ||
    Array.isArray(base) ||
    typeof override !== 'object' ||
    override === null ||
    Array.isArray(override)
  ) {
    return override ?? base;
  }

  const merged: Record<string, unknown> = {...(base as Record<string, unknown>)};
  for (const key of Object.keys(override as Record<string, unknown>)) {
    merged[key] = mergeMessages(
      (base as Record<string, unknown>)[key],
      (override as Record<string, unknown>)[key]
    );
  }
  return merged;
}
 
export default getRequestConfig(async ({requestLocale}) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const defaultMessages = (await import('../messages/en.json')).default;
  const localeMessages = (await import(`../messages/${locale}.json`)).default;
 
  return {
    locale,
    messages:
      locale === routing.defaultLocale
        ? defaultMessages
        : (mergeMessages(defaultMessages, localeMessages) as Record<string, unknown>)
  };
});
