'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { i18nConfig } from '@/lib/i18n/config';

// Initialize i18next for client side if not already initialized
if (!i18n.isInitialized) {
    i18n
        .use(initReactI18next)
        .init({
            lng: i18nConfig.defaultLocale,
            fallbackLng: i18nConfig.defaultLocale,
            supportedLngs: i18nConfig.locales,
            resources: {
                en: {
                    common: require('@/public/locales/en/common.json'),
                    dashboard: require('@/public/locales/en/dashboard.json'),
                },
                bn: {
                    common: require('@/public/locales/bn/common.json'),
                    dashboard: require('@/public/locales/bn/dashboard.json'),
                },
            },
            interpolation: {
                escapeValue: false,
            },
        });
}

export function LanguageSwitcher() {
    const { t, i18n } = useTranslation('common');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        document.documentElement.lang = lng;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Globe className="h-4 w-4" />
                    <span className="sr-only">{t('language')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                    English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('bn')}>
                    বাংলা (Bengali)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
