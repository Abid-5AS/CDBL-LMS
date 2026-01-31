import { i18nConfig } from './config';

export function getOptions(lng = i18nConfig.defaultLocale, ns = 'common') {
    return {
        // debug: true,
        supportedLngs: i18nConfig.locales,
        fallbackLng: i18nConfig.defaultLocale,
        lng,
        fallbackNS: 'common',
        defaultNS: 'common',
        ns,
    };
}
