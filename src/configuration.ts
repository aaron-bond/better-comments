import * as path from 'path';
import * as vscode from 'vscode';

import * as json5 from 'json5'
import { TextDecoder } from 'util';

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

        for (let extension of vscode.extensions.all) {
            let packageJSON = extension.packageJSON;

            if (packageJSON.contributes && packageJSON.contributes.languages) {
                for (let language of packageJSON.contributes.languages) {
                    if (language.configuration) {
                        let configPath = path.join(extension.extensionPath, language.configuration);
                        this.languageConfigFiles.set(language.id, configPath);
                    }
                }
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
        if (!this.languageConfigFiles.has(languageCode)) {
            return undefined;
        }

        try {
            // Get the filepath from the map
            const filePath = this.languageConfigFiles.get(languageCode) as string;
            const rawContent = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
            const content = new TextDecoder().decode(rawContent);

            // use json5, because the config can contains comments
            const config = json5.parse(content);

            this.commentConfig.set(languageCode, config.comments);

            return config.comments;
        } catch (error) {
            this.commentConfig.set(languageCode, undefined);
            return undefined;
        }
    }
}