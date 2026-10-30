import { property } from './unknown';

export interface LanguageContribution {
    id: string;
    // The path of its language-configuration.json, relative to the extension
    configuration: string;
}

/**
 * The languages an extension's package.json contributes that have a language configuration. The manifest is
 * another extension's, so it's read as unknown: entries without a string id and configuration are skipped, as is
 * a languages value that isn't a list. Up to 3.1.1 some of these shapes threw, which stopped every language loading.
 * @param packageJSON An extension's packageJSON
 */
export function* readLanguageContributions(packageJSON: unknown): Generator<LanguageContribution> {
    const languages = property(property(packageJSON, 'contributes'), 'languages');

    if (!Array.isArray(languages)) return;

    const entries: unknown[] = languages;
    for (const language of entries) {
        const configuration = property(language, 'configuration');
        if (!configuration || typeof configuration !== 'string') continue;

        // An id that isn't a string could never be looked up
        const id = property(language, 'id');
        if (typeof id === 'string') {
            yield { id, configuration };
        }
    }
}
