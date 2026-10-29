import * as path from 'path';
import * as vscode from 'vscode';

import { TextDecoder } from 'util';
import { parseLanguageConfig, readLanguageContributions } from './core';

export class Configuration {
    private readonly commentConfig = new Map<string, CommentConfig | undefined>();
    private readonly languageConfigFiles = new Map<string, string>();

    /**
     * Creates a new instance of the Parser class
     */
    public constructor() {
        this.UpdateLanguagesDefinitions();
    }

    /**
     * Generate a map of configuration files by language as defined by extensions
     * External extensions can override default configurations os VSCode
     */
    public UpdateLanguagesDefinitions() {
        this.commentConfig.clear();

        for (const extension of vscode.extensions.all) {
            for (const language of readLanguageContributions(extension.packageJSON)) {
                const configPath = path.join(extension.extensionPath, language.configuration);
                this.languageConfigFiles.set(language.id, configPath);
            }
        }
    }

    /**
     * Gets the configuration information for the specified language
     * @param languageCode 
     * @returns 
     */
    public async GetCommentConfiguration(languageCode: string): Promise<CommentConfig | undefined> {

        // * check if the language config has already been loaded
        if (this.commentConfig.has(languageCode)) {
            return this.commentConfig.get(languageCode);
        }

        // * if no config exists for this language, back out and leave the language unsupported
        const filePath = this.languageConfigFiles.get(languageCode);
        if (filePath === undefined) {
            return undefined;
        }

        try {
            const rawContent = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
            const content = new TextDecoder().decode(rawContent);

            const comments = parseLanguageConfig(content);

            this.commentConfig.set(languageCode, comments);

            return comments;
        } catch {
            this.commentConfig.set(languageCode, undefined);
            return undefined;
        }
    }
}