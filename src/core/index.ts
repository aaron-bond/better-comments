// The core's public API: everything outside src/core imports from here, and only from here.
//
// src/core holds pure functions on plain values: no vscode, no I/O, and nothing kept between calls.
// Anything that owns state or talks to VS Code lives in src/ as a class (Parser, Configuration) and calls in.
// test/unit/boundary.test.ts enforces both rules.

export { findTags } from './finder';
export { parseLanguageConfig } from './languageConfig';
export { applyLanguage, beginLanguageSwitch, initialLanguageState, LanguageSettings, LanguageState } from './languageState';
export { prepareTag } from './tags';
export { TagSetting } from './types';
