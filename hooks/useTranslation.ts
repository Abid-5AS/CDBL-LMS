'use client';

import { useTranslation as useTranslationOrg } from 'react-i18next';

export function useTranslation(ns?: string) {
    return useTranslationOrg(ns);
}
