# Manual checks: before and after the refactor

The automated baseline runs each language switch on its own, so it can't show what happens when you move between editors quickly, what the decorations look like, or how the extension feels to use. These checks cover that. Run each one with both builds, and note anything that differs between the two.

- **Before:** v3.0.2 as released (commit `084a906`)
- **After:** the tip of `task/improve-test-coverage`

## Setup

Build both VSIXes:

```sh
# Before
git worktree add ../better-comments-before 084a906
cd ../better-comments-before && npm ci && npx vsce package -o ../better-comments-before.vsix

# After
cd ~/git/better-comments && npm ci && npx vsce package -o ../better-comments-after.vsix
```

Run each build in its own throwaway profile, so your installed copy of Better Comments and your settings aren't involved:

```sh
B=/tmp/bc-manual-before   # or /tmp/bc-manual-after
code --user-data-dir $B/data --extensions-dir $B/ext --install-extension ../better-comments-before.vsix
code --user-data-dir $B/data --extensions-dir $B/ext ~/git/better-comments/test/fixtures/samples
```

Each check says which settings it needs. Put them in that profile's settings (`Ctrl+,`, then the `{}` icon) and **restart VS Code afterwards**. Builds before the pinned 7 fix only read settings at startup.

## Checks

Mark each column ✅ (as expected), ❌ (wrong) or ⚠️ (differs from the other build), and add a note.

| # | Check | Expected | Before | After | Notes |
|---|---|---|---|---|---|
| 1 | **Basic highlighting.** Open `javascript.js`, `csharp.cs`, `nested.cs` and `test.py` in turn. | Each tag's colour shows, and `//// removed code` lines are struck through. In Python, the shebang on line 1 isn't coloured. | | | |
| 2 | **Typing.** In `javascript.js`, type `// ! new alert` on a new line, then delete it. | It's coloured almost straight away. Nothing is left behind after deleting. | | | |
| 3 | **Fast tab switching.** Open `javascript.js`, `test.py`, `csharp.cs` and `plaintext.txt`. Hold `Ctrl+PageDown` for a few seconds, then let go. Repeat 5 times, stopping on a different tab each time. | The tab you stop on is highlighted correctly for its language. For example, `test.py` doesn't colour `//` lines, and `plaintext.txt` shows nothing. | | | Count the wrong results in each build. |
| 4 | **Switching on first open.** Restart VS Code. Open `test.py`, then within a second open `javascript.js` from the explorer. Go back to `test.py`. | Both files are highlighted correctly. | | | Repeat a few times; it's timing-dependent (pinned 9). |
| 5 | **Split view.** Open `javascript.js` and `test.py` side by side. Click between them. | Currently only the active editor gets updated decorations (pinned 10). Note what the inactive one shows. | | | |
| 6 | **Changing language mode.** Open `plaintext.txt`. Use "Change Language Mode" to switch to JavaScript, then back to Plain Text. | Record what happens. The extension doesn't listen for language changes directly, so it may not update until you switch tabs. | | | |
| 7 | **Settings changes** (pinned 7). Add a tag `{ "tag": "@note", "color": "#00FF00" }` and type `// @note hi` *without* restarting. Then restart. | **Before the fix:** not coloured until the restart. **After:** coloured as soon as the setting is saved. | | | |
| 8 | **Plain text keeps the last language's delimiters** (pinned 11). Settings: `"better-comments.highlightPlainText": true`. Open `javascript.js`, then a new untitled file. Type `/* ! in a block */` and `! bare` into it. | Record what's coloured. Then repeat with `test.py` as the previous file, and compare. | | | |
| 9 | **Makefile** (P1). Create a file called `Makefile` containing `if (a != b) { x = a ? 1 : 2; } # ! real`. | **Before:** on a VS Code whose Makefile config uses the object form (1.143 does), `!=` and `?` outside the comment get coloured, from the tag to the end of the line. **After:** only `# ! real` is coloured. Add a line `\tcurl http://example.com` (#566): only after the fix is it left alone. | | | On 1.101.0 the Makefile config is a plain `#`, so both builds give the After result there. |
| 10 | **Large file.** Make a copy of `nested.cs` with its contents pasted 100 times (about 23,000 lines). Scroll and type near the bottom. | No noticeable lag compared with a small file. | | | Rough feel only; `npm run perf` measures this (see [performance.md](performance.md)). |
| 11 | **Empty tag with plain text** (P3). Settings: `"better-comments.highlightPlainText": true` and a tag `{ "tag": "", "color": "#ABCDEF" }`. Restart, then press `Ctrl+N`. | **Before:** the extension host freezes (expected; this is the bug). **After:** only once the P3 fix is in. Nothing freezes, and typing works. | | | Run 11 and 12 last in the Before profile. You'll need to close the window and remove the setting. |
| 12 | **Empty tag with a Makefile** (P3, the second route). Settings: a tag `{ "tag": "", "color": "#ABCDEF" }`, with `highlightPlainText` off. Restart, then open the `Makefile` from check 9. | **Before:** on a VS Code whose Makefile config uses the object form (1.143 does), the extension host freezes. **After:** nothing freezes (since 3.1.0), and since the P1 fix the empty tag colours only `#` comments. | | | On 1.101.0, the oldest supported version, the Makefile config is a plain `#`, so neither build freezes there. |

## Results

Write a short summary here after each round: date, the VS Code version, and any differences between the two builds.
