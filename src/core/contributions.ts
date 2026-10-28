import { property } from './unknown';

export interface LanguageContribution {
    id: string;
    // The path of its language-configuration.json, relative to the extension
    configuration: string;
}

/**
 * The languages an extension's package.json contributes that have a language configuration. The manifest is
 * another extension's, so it's read as unknown: entries without a string id and configuration are skipped, and
 * the shapes that reading it has always thrown for still throw, at the same entry.
 * @param packageJSON An extension's packageJSON
 */
export function* readLanguageContributions(packageJSON: unknown): Generator<LanguageContribution> {
    const languages = property(property(packageJSON, 'contributes'), 'languages');

    // ? for...of over a string gives characters, and none of them has a configuration
    if (!languages || typeof languages === 'string') return;
    if (!Array.isArray(languages)) {
        throw new TypeError('contributes.languages is not a list');
    }

    const entries: unknown[] = languages;
    for (const language of entries) {
        if (language === null || language === undefined) {
            throw new TypeError('A contributed language is null');
        }

        const configuration = property(language, 'configuration');
        if (!configuration) continue;
        // ? path.join has always thrown for a configuration that isn't a string
        if (typeof configuration !== 'string') {
            throw new TypeError('A contributed language\'s configuration is not a string');
        }

        // An id that isn't a string could never be looked up
        const id = property(language, 'id');
        if (typeof id === 'string') {
            yield { id, configuration };
        }
    }
}
