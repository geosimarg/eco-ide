import { defineStore } from 'pinia';
import { ref } from 'vue';
import { logger } from '@/utils/logger';

import { useConfigStore } from './config';
import { useGlobalConfigStore } from './globalConfig';

export const useI18nStore = defineStore('i18n', () => {
    const currentLocale = ref('pt-BR');
    const translations = ref<Record<string, any>>({});
    const availableLocales = ref([
        { code: 'pt-BR', name: 'Português (Brasil)' },
        { code: 'en-US', name: 'English (US)' },
        { code: 'es', name: 'Español' }
    ]);

    async function initLocale() {
        const configStore = useConfigStore();
        const globalConfigStore = useGlobalConfigStore();

        // 1. Carregar config global primeiro
        await globalConfigStore.loadConfig();

        // Prioridade: Projeto -> Global -> pt-BR
        let localeToLoad = 'pt-BR';

        if (configStore.config.locale) {
            localeToLoad = configStore.config.locale;
            logger.log('Usando idioma do projeto:', localeToLoad);
        } else if (globalConfigStore.config.locale) {
            localeToLoad = globalConfigStore.config.locale;
            logger.log('Usando idioma global:', localeToLoad);
        }

        await loadLocale(localeToLoad, false);
    }

    async function loadLocale(locale: string, save = true) {
        try {
            const module = await import(`../locales/${locale}.json`);
            translations.value = module.default;
            currentLocale.value = locale;
            logger.log(`Locale alterado para: ${locale}`);

            if (save) {
                // Salvar globalmente
                const globalConfigStore = useGlobalConfigStore();
                globalConfigStore.setLocale(locale);

                // Salvar no projeto se houver um aberto
                const configStore = useConfigStore();
                if (configStore.workspacePath) {
                    configStore.config.locale = locale;
                    await configStore.saveConfig();
                }
            }
        } catch (e) {
            logger.error(`Erro ao carregar locale ${locale}:`, e);
            if (locale !== 'pt-BR') {
                await loadLocale('pt-BR', false);
            }
        }
    }

    function t(key: string, args?: Record<string, string | number>): string {
        const keys = key.split('.');
        let value: any = translations.value;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Retorna a chave se não encontrar
            }
        }

        let text = typeof value === 'string' ? value : key;

        if (args) {
            Object.entries(args).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, String(v));
            });
        }

        return text;
    }

    return {
        currentLocale,
        translations,
        availableLocales,
        initLocale,
        loadLocale,
        t
    };
});
