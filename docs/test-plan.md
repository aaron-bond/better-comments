# Better Comments: Testability Plan

## Goal

Get Better Comments to a point where changes can be made with confidence, without breaking anything for the people who use it today.

- **A comprehensive baseline first.** Before any refactor, record what the current code does across every sample, setting and language-switch order we can think of. Speed doesn't matter here; coverage does.
- **Three languages to start: JavaScript, C# and Python.** They're among the most used, and between them they cover JSDoc handling, `//` and `#` line comments, `/* */` and `"""` block comments, and `ignoreFirstLine`. Other languages are added later, once the harness is proven.
- **Refactor incrementally under that baseline.** Each step must leave the baseline output byte-identical, and each can ship on its own.
- **Fast unit tests once the code allows them.** These run in plain Node against a pure core and gradually take over from the baseline as the day-to-day safety net.
- **A few integration tests** in a real VS Code instance that prove the wiring works end to end.
- **CI** that runs all of it on every push and PR.

Behaviour changes, including bug fixes, are made deliberately and one at a time. Each one comes with a reviewed diff to the baseline snapshots.

## Current state (v3.0.2)

| File | Lines | What it does | Testability problem |
|---|---|---|---|
| `src/parser.ts` | 359 | Builds regexes, finds comment ranges, creates decoration types, applies decorations | Mixes pure logic with VS Code calls. `contributions` is read from `vscode.workspace.getConfiguration` in a field initialiser, so `new Parser()` needs a live VS Code. The `Find*` methods take a `vscode.TextEditor` and build `vscode.Range`s. State is held in fields that carry over from one language to the next. |
| `src/configuration.ts` | 72 | Finds each language's `language-configuration.json` through `vscode.extensions.all` and parses it with json5 | Discovery and file reads go through VS Code APIs. The parse step itself is pure but isn't exposed. |
| `src/extension.ts` | 82 | Activation, event wiring, 100 ms debounce | Doesn't return anything, so a test can't see what happened. |

There are no tests, no test runner and no CI. `src/test/index.ts` uses the removed `vscode/lib/testrunner` and is excluded from the build. `src/test/samples/` holds 69 hand-written sample files, one per language, plus one unsupported COBOL file. The repo has `.travis.yml`, but Travis is defunct for OSS.

The project installs, compiles, lints (one warning) and builds the web bundle on Node 24 as it stands. `npm audit` reports 26 advisories. Only one is in production dependencies: json5 2.2.1, CVE-2022-46175.

### Behaviour worth pinning down

These came from reading the code and probing the compiled `Parser` with a stubbed `vscode`. They are current behaviour, so the baseline records them as they are. Any that get fixed are fixed later, deliberately.

1. **JSDoc matching runs in every language by default.** The check is `if (!highlightMultilineComments && !highlightJSDoc) return`, so with the default `multilineComments: true`, `/** … * ! x … */` is highlighted in Python and every other language. `highlightJSDoc` is set to `true` for JS/TS/JSX/TSX/Apex and never reset. That only makes a difference when `multilineComments` is `false`: after visiting a JS-family file, JSDoc matching stays on for every language.
2. **Single-line highlighting can switch off for good.** `highlightSingleLineComments` is set to `false` when the language's `comments` object has neither `lineComment` nor `blockComment`, and nothing sets it back. Confirmed: after such a language, `// ! x` in TypeScript is no longer highlighted. CSS does *not* trigger this (see 3). No built-in language in 1.65.0 or 1.143.1 has such a config, so only third-party language extensions can trigger it. The baseline reaches it with a fixture extension.
3. **Block-only languages use the block opener as a line delimiter.** `setDelimiter` passes `config.lineComment || blockCommentStart`, so in CSS `/* ! alert */` matches as a single-line comment, closing `*/` included.
4. **`highlightMultilineComments` is never reset.** It is set from the setting whenever a language has block comments, and is still `true` after switching to a language without them (TS → YAML). The block regex then runs with empty delimiters. It finds nothing, but it shouldn't run at all. *To fix (Phase 5).*
5. **`textDecoration` is built by joining strings.** Most tags get `""` (an empty string, not undefined), strikethrough gives `"line-through"`, and underline-only gives `" underline"` with a leading space.
6. **Tag escaping is done twice, in two different ways.** `setTags` uses its own character class plus hardcoded `/` escaping, and `escapeRegExp` is used for delimiters. Without the `u` flag, `]`, `}` and `-` are literal outside a class, so they're probably fine. An **empty tag** gives an empty alternative, which may match every comment. All of these need pinning.
7. **Settings changes need a restart**, because tags are read once at construction.
8. **`ignoreFirstLine`** applies to Python, Elixir and Tcl, and only skips a match that starts at line 0, character 0.
9. **Overlapping language switches race.** `SetRegex` is async and changes parser state shared by every editor. Two quick editor switches can overlap, leaving one language's regex applied to the other editor. *To fix, incrementally (Phase 5).*
10. **Only the active editor is decorated.** Other visible editors in a split view are not decorated.
11. **Plain text keeps the previous language's block delimiters.** No plain text language config exists, so `setCommentFormat` isn't called and the delimiters and `highlightMultilineComments` stay as the last language left them. With `highlightPlainText` on, the same generated `.txt` gives 89 ranges fresh, 114 after JavaScript or C#, 99 after Python, and 0 after a language that switched off single-line matching.
12. **The empty tag matches differently with CRLF.** With the `empty-tag` settings, generated C# and JavaScript give 56 ranges with LF and 59 with CRLF. For every other settings variant, LF and CRLF give the same counts. Not yet looked into.

## Potential bugs (to verify)

Suspected from the code and partly reproduced with a stub, but nobody has reported them. Each needs confirming in a real VS Code before we decide whether it's a bug at all. The baseline (Phase 1) records whatever actually happens.

### P1: `lineComment` given as an object

VS Code's `CommentRule` now allows `lineComment: { comment: string; noIndent?: boolean }`, and the built-in Makefile `language-configuration.json` already uses it. `setCommentFormat` only handles a string or an array, so for an object the delimiter becomes `""`. With a stubbed config, the regex then matches tags anywhere in a line:

```
if (a != b) { x = a ? 1 : 2; } // ! real
→ "!" applied to " != b) { … // ! real"
```

To verify:
- Open a Makefile in real VS Code at the pinned version and in current stable, and check whether `!=`, `?` or `*` outside comments get highlighted.
- Check which VS Code version introduced the object form, and whether any popular third-party language extensions use it.

If confirmed, `CommentSyntax` needs to accept the object shape and the config parsing needs to turn it into a plain string.

### P3: Empty tag with `highlightPlainText` may hang

From reading the code; not run. With plain text on, the single-line regex is `(^)+([ \t]*[ \t]*)(<tags>)+(.*)` with the `m` flag. An empty tag string makes that match zero characters on an empty line. `RegExp.exec` with `g` doesn't advance `lastIndex` after a zero-length match, so the `while` loop in `FindSingleLineComments` would never end and the extension host would freeze. This combination is left out of the host matrix on purpose. Check it in Node in a child process with a timeout before deciding anything.

### P2: Stale language-config entries

`UpdateLanguagesDefinitions` clears `commentConfig` but not `languageConfigFiles`. A language from an uninstalled extension may stay "supported" and point at a file that's gone (the read then fails and the language becomes unsupported). It probably doesn't matter in practice. Verify, then decide.

## Future feature: VS Code for the Web

`package.json` declares `"browser": "./out/web/extension.js"`, and the web bundle builds, but it has never been tried in a browser. Treat web support as a **new feature to prove out**, not something to regression-test now. It is outside the baseline and CI work below.

The first thing to check: `Configuration` builds paths with `path.join(extension.extensionPath, …)` and reads them with `vscode.Uri.file(...)`. In the browser, extensions aren't served from `file:` URIs, so every config read may fail and every language end up unsupported. The usual fix is `vscode.Uri.joinPath(extension.extensionUri, language.configuration)`. When this is picked up, it gets its own `@vscode/test-web` smoke test and CI job.

## Strategy

1. **Baseline (golden master).** Run the current, unmodified code against a large matrix of inputs and record the output as snapshots. Run it two ways:
   - in a real VS Code host, which is authoritative and uses the real built-in language configs
   - in Node with a fake `vscode`, which is fast and fed a dump of those same configs

   The two must agree.
2. **Refactor incrementally** towards a functional core and a thin VS Code shell. Every step keeps the snapshots identical. Steps are small enough to release separately.
3. **Unit-test the core** once it exists. Unit tests then take over from the Node baseline for day-to-day work. The real-host baseline stays as a slow, thorough suite.

### Target shape (after the refactor)

- **Core** (`src/core/`): zero `vscode` imports. Strings and plain objects in, plain data out.
- **Adapter** (`src/vscode/`): converts offsets to `vscode.Range`, style objects to `TextEditorDecorationType`, and handles events and settings.

```ts
// src/core/types.ts
export interface CommentSyntax { lineComment?: string | string[]; blockComment?: [string, string]; } // + object form if P1 is confirmed
export interface TagSetting { tag: string; color: string; backgroundColor?: string;
  strikethrough?: boolean; underline?: boolean; bold?: boolean; italic?: boolean; }
export interface Settings { tags: TagSetting[]; multilineComments: boolean; highlightPlainText: boolean; }
export interface TagMatch { tag: string; start: number; end: number; } // document offsets
export interface TagStyle { color: string; backgroundColor?: string; textDecoration?: string;
  fontWeight?: string; fontStyle?: string; }

// src/core/languageRules.ts   → per-language flags (jsdoc, ignoreFirstLine, plaintext)
// src/core/regex.ts           → buildLineRegex / buildBlockRegex / escapeTag
// src/core/finder.ts          → findTags(text, syntax, settings, languageId): TagMatch[]
// src/core/style.ts           → toTagStyle(tag: TagSetting): TagStyle
// src/core/languageConfig.ts  → parseLanguageConfig(rawJson5): CommentSyntax | undefined
```

The current parser carries state from one language to the next (pinned items 1, 2 and 4). A stateless `findTags` would silently change that. So the refactor first moves that state into an explicit object the core takes and returns, and the state stays, with the same values in the same cases. Removing it is a Phase 5 fix, with its own snapshot diff.

## Phase 0: Test tooling only (done)

Only what's needed to run tests. Nothing in `src/` changes, and no production dependency changes.

- Dev dependencies: Mocha 10 (VS Code 1.65's extension host runs Node 14, and Mocha 11 needs 18), `@types/mocha`, ts-node (for the Node suites in Phase 1), `@vscode/test-electron`.
- The dead `src/test/index.ts` is deleted. The samples moved to `test/fixtures/samples/`.
- `tsconfig.json` now has `"include": ["src"]`. Tests have their own `test/tsconfig.json` and compile to `out/test/`, which `.vscodeignore` already excludes. `docs/**` is added to `.vscodeignore`, since the VSIX would otherwise ship this plan.
- **`@vscode/test-electron` is used directly, not `@vscode/test-cli`.** The shim has to be in place before any `out/` module loads and before the extension activates, and `ELECTRON_RUN_AS_NODE` has to be cleared. A small runner of our own makes both easy to guarantee.
  - `test/host/runTests.ts` launches VS Code 1.65.0 (the lowest `engines` allows) and `stable` by default. It disables other extensions and uses a temporary user-data dir.
  - `test/host/index.ts` installs the shim (`test/host/shim.ts`), then runs the Mocha suite in the folder named by `BC_TEST_SUITE`.
- `test/host/integration/harness.test.ts` checks the harness itself. The shim is installed before activation, decoration types are recorded, the real configs are read, and the activated extension's decorations are captured after opening a file and after an edit. If the shim is disabled, these checks fail.
- Scripts so far: `compile-tests` and `test:integration`. Mocha errors when a glob matches no files, so `test:baseline`, `test:baseline:host`, `test:unit` and `test` are added along with their first test files.

Built-in language configs change between VS Code versions, so each version gets its own snapshot set.

## Phase 1: Comprehensive baseline (no source changes)

**Status:** the real-host baseline is in place. Run `npm run test:baseline:host`, and add `-- --update-snapshots` to rewrite. It covers 85 snapshot files per version, each run under 8 histories (680 parser runs), and takes about 10 s per version. The snapshots for 1.65.0 and stable are byte-identical. A one-line change to the compiled parser (dropping `ignoreFirstLine`) failed exactly the 14 Python cases it should. The Node baseline is next.

As built:
- **Snapshot files:** `test/baseline/snapshots/<label>/<settings>/<target>--<input>.json`. Each one records the decoration types once, then lists the results with the histories that produce each. A split between groups shows where carried-over state matters.
- **Shared code:** the matrix (`test/baseline/matrix.ts`) and the input generator (`test/baseline/generate.ts`) will also drive the Node baseline.
- **Settings** are written to the real user settings of the temporary profile, and each case uses a fresh `Parser` that does exactly what `updateDecorations` does.
- **Histories** call only `SetRegex`. That's the only method that changes the carried-over flags.
- **`language-configs.json`** in each label folder is the config dump the Node baseline reads.

### How output is captured

**Node (fake `vscode`).** A Mocha `-r` hook intercepts `require('vscode')` and returns a fake with:
- `Range`, `Position`
- `window.createTextEditorDecorationType`, which records the options and returns an id
- `workspace.getConfiguration`, which returns the settings for the case

The fake editor gives `getText`, `positionAt` (from real line offsets, CRLF-aware) and a `setDecorations` spy.

- **The spy must copy the array** (`[...ranges]`). `ApplyDecorations` empties the same array right after the call, so storing the reference records nothing.
- `Configuration` is replaced by a fake that serves comment syntaxes from `test/fixtures/language-configs.<vscode-version>.json`, a dump taken from the real host (below).

**Real host.** Tests run in the extension host and load the unmodified `out/parser.js` and `out/configuration.js`, so `Configuration` reads the real built-in language configs. Each case opens a real `TextDocument` and passes the parser a plain object, `{ document, setDecorations: spy }`. The parser only ever uses `document.getText`, `document.positionAt` and `setDecorations`. The same suite also writes the language-config dump the Node run uses.

Output is captured through a **`require('vscode')` shim** (see "Spike results"). The test entry file replaces `Module._load` before anything from `out/` is loaded. Modules under `out/` then get an object that inherits from the real API, with a `window` that:
- records every `createTextEditorDecorationType` call and its options
- returns wrapped editors from `activeTextEditor` and `onDidChangeActiveTextEditor`, whose `setDecorations` records the call and then forwards it to the real editor

**End-to-end wiring.** A smaller set of host tests runs through the real activated extension: activation, the debounce, `onDidChangeActiveTextEditor` and `onDidChangeTextDocument`. The extension's `out/extension.js` loads the shimmed modules from the same require cache, so its calls are recorded too, without any change to `src/`. The shim must be installed before the extension activates. The suite asserts that the extension isn't active yet when it starts, then activates it explicitly.

### Spike results (done, 2026-10-26)

Run on VS Code 1.65.0 and 1.143.1 (stable at the time) using `@vscode/test-electron`, with the repo as the development extension and no changes to it.

| Question | Answer |
|---|---|
| Does wrapping the test's `vscode` object affect the extension's modules? | **No.** Each extension gets its own API object, and the parser's decoration types bypassed the wrapper. Hence the module shim. |
| Does the module shim capture decoration types and options? | **Yes**, all 5 default tags, on both versions. |
| Does the unmodified `Configuration` read the real configs for js, cs and py? | **Yes**, and they're identical on both versions. |
| Can the unmodified `Parser` be driven directly with real documents? | **Yes.** Ranges and text were captured for all three samples, identical on both versions. |
| Can the real `TextEditor` be patched to spy on `setDecorations`? | **No.** It's frozen, and the assignment is silently ignored. Wrapping the editor in a Proxy throws. |
| Can end-to-end runs be captured without `src/` changes? | **Yes**, using shim-wrapped editors. Open, edit (with the new tag picked up) and switching to Python were all recorded on both versions. |
| Was the extension active when the suite started? | **No** on both versions (`onStartupFinished` hadn't fired). The suite asserts this rather than assuming it. |

Practical notes:
- **Running from a VS Code terminal:** unset `ELECTRON_RUN_AS_NODE`, which the integrated terminal inherits from the extension host. Otherwise the downloaded VS Code starts as plain Node and fails with `bad option: --disable-extensions`. The test scripts should do this themselves.
- **Linux without a display** (CI) needs `xvfb-run`. Locally the test windows open briefly on screen.
- **Speed:** each version is a one-off ~150–330 MB download. After that, a run takes about 5 s.
- Pass `--disable-extensions`, a temporary `--user-data-dir`, `--no-sandbox` and `--disable-workspace-trust`.

### Snapshot format

One JSON file per case, written so a diff is easy to read:

```json
{
  "case": "typescript/javascript.js/default-settings/after:none",
  "decorationTypes": [{ "tag": "!", "options": { "color": "#FF2D00", "textDecoration": "" } }],
  "applied": [
    { "tag": "!", "ranges": [{ "start": "12:4", "end": "12:30", "text": "// ! this is an alert" }] }
  ]
}
```

Snapshots are written by `--update-snapshots` and otherwise compared exactly. Every snapshot diff is reviewed in the PR.

### Case matrix

The matrix multiplies these dimensions. It will be large (thousands of cases), and that's fine.

**Inputs** (JavaScript, C# and Python only, for now)
- The samples `javascript.js`, `csharp.cs`, `nested.cs` and `test.py`
- A **generated file for each of the three languages**, built from that language's dumped comment syntax. It puts every default tag in every position: start of line, indented, after code, inside a string literal, tag not straight after the delimiter, uppercase/mixed case, single-line block, multi-line block with several tagged lines, JSDoc block, unterminated block, delimiter only, empty file
- The same generated files with **CRLF** line endings
- Custom-tag documents covering:
  - regex metacharacters: `? * + . $ ^ | ( ) [ ] { } \ / -`
  - multi-character tags (`@note`, `FIXME:`) and Unicode (`⚠`)
  - overlapping tags (`*` vs `**`)
  - an empty tag string
- Plaintext files, and an unsupported language (COBOL) as a negative case

**Settings**
- Defaults
- `multilineComments: false`
- `highlightPlainText: true`
- Custom tag sets, including every strikethrough/underline/bold/italic combination for style capture

**Language history.** The parser's state depends on which languages came before, so each case also runs after each of these "priming" histories:
- `none` (fresh parser)
- after each of the other two in-scope languages
- after JavaScript, then the other one (JSDoc flag set, and then another language on top)
- after an unsupported language

Priming histories may use a language outside the three only to reach a state, not as a case under test:
- after a language whose `comments` has neither field (clears `highlightSingleLineComments`, pinned item 2)
- after a language with no block comments (pinned item 4)

**Wiring (host, end to end)**
1. Opening a file decorates it.
2. An edit (`WorkspaceEdit` inserting `// todo new`) updates the decorations, with no stale ranges.
3. Switching TS → Python → TS gives the same results as the matrix's priming histories.
4. Changing `better-comments.tags` through `getConfiguration().update(...)` has no effect until a restart (current behaviour).
5. *Later, once more languages are in scope:* a fixture extension contributes a made-up language with `;;` comments, and that language gets highlighted (covers `vscode.extensions.all` discovery).
6. Fast editor switching (pinned item 9): record the outcome. It's timing-dependent, so assert only the stable parts and run it many times to measure how often it happens.

### Done when

- Every pinned behaviour has at least one case that shows it. P1 (Makefile) is verified separately, as described in its section.
- The Node and real-host baselines agree on every case they share.
- Snapshots exist for VS Code 1.65 and `stable`.

## Phase 1.5: Dependency refresh, guarded by the baseline

Only once the baseline is green, and one change per PR, with the baseline unchanged after each:

1. Bump json5 to `^2.2.3`. This changes the config parser, so check that the language-config dump is identical.
2. Update TypeScript and `@types/vscode`, and change `vsce` to `@vscode/vsce`.
3. Replace TSLint with ESLint + `typescript-eslint`, and fix only what's needed to pass.
4. Update webpack and refresh the lockfile. This clears the dev-dependency advisories.
5. Remove `.travis.yml` and the unused `useJSDocStyle` from `src/typings/typings.d.ts`.

## Phase 2: Incremental refactor

Move the logic one piece at a time, with the baseline identical after every step:

1. Pure helpers (`escapeTag`, regex builders, `toTagStyle`) extracted and called from `Parser`
2. `parseLanguageConfig` extracted from `Configuration`
3. Parser state moved into an explicit object (state kept, see Strategy)
4. `findTags` working on text and offsets, with `Parser` converting to `vscode.Range`
5. `Parser` reduced to a thin adapter

Each step is small enough to review in one sitting and can be released on its own if needed.

## Phase 3: Unit tests and the test seam

- Table-driven unit tests on `src/core`, starting by porting the generated-fixture cases from the baseline. Once these are in place, the Node baseline becomes optional locally. It stays in CI until the unit tests cover the same cases.
- `activate()` returns a small API used only by tests, and the end-to-end wiring tests move onto it:

```ts
export interface BetterCommentsTestApi {
  lastApplied(uri: vscode.Uri): Array<{ tag: string; style: TagStyle; ranges: vscode.Range[] }>;
  whenIdle(): Promise<void>; // resolves after the 100 ms debounce has flushed
}
```

VS Code has no public API for reading back the decorations on an editor. Don't use screenshots or pixel diffs; they are slow and flaky.

## Phase 4: CI

GitHub Actions workflow `.github/workflows/ci.yml`:

| Job | Runs on | Steps |
|---|---|---|
| lint + baseline + unit | ubuntu | `npm ci`, `npm run lint`, `npm test` |
| host baseline + integration | ubuntu (`xvfb-run`), windows, macos; VS Code 1.65 and stable | `npm ci`, `npm run compile`, `npm run test:baseline:host`, `npm run test:integration` |
| package | ubuntu | `npx @vscode/vsce package` to make sure the VSIX builds; upload it as an artifact |

The host baseline is slow, so it can run on PRs and `main` only, not on every push to a branch. Add Dependabot for npm and GitHub Actions. Publishing is gated on a green `main`.

## Phase 5: Behaviour changes, one at a time

Each is its own PR and release, with the snapshot diff reviewed and described in the changelog:

- Pinned 4: reset `highlightMultilineComments` per language
- Pinned 9: make language switches race-free (incrementally, e.g. ignore results from a superseded switch)
- Pinned 1 and 2: decide what the intended behaviour is, then stop the flags carrying over
- Pinned 5: clean `textDecoration`
- Pinned 7: read settings live
- P1 and P2, if verified

## Order of work and size

| # | Work | Size | Done when |
|---|---|---|---|
| 0 | ~~Test tooling, samples moved, dead runner removed~~ (done) | S | Harness checks pass on 1.65.0 and stable; `out/` and the VSIX file list are unchanged |
| 1 | ~~Spike on capture~~ (done); Node and real-host baselines; full case matrix for JS, C# and Python | L | Baselines agree, snapshots committed for 1.65 and stable |
| 1.5 | Dependency refresh, json5, ESLint, one per PR | S each | Baseline unchanged after each |
| 2 | Incremental core extraction | M–L | `src/core` has no `vscode` imports; baseline unchanged throughout |
| 3 | Unit tests, test seam, wiring tests moved to the seam | M | Unit tests cover the generated-fixture cases |
| 4 | GitHub Actions + Dependabot | S | Green on all three OSes |
| 5 | Behaviour fixes one at a time | S each | Snapshot diffs reviewed and released |

## Out of scope for now

- Web support (see "Future feature")
- Visual/screenshot regression testing
- Performance benchmarks (worth adding later: a 10k-line file under N ms in `findTags`)
- Mutation testing
