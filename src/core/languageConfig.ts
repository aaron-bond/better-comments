import * as json5 from 'json5';

/**
 * Reads the comment syntax out of a language's language-configuration.json
 * Throws if the content can't be parsed, so the caller can treat the language as unsupported
 * @param content The file's text
 */
export function parseLanguageConfig(content: string): CommentConfig | undefined {
    // use json5, because the config can contains comments
    const config = json5.parse(content);

    return config.comments;
}
