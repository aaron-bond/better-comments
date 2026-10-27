# Performance benchmark

`npm run perf` measures how long Better Comments takes to decorate a document, for this checkout and for v3.0.2, so a change can be compared with the release before it ships. It's a local tool, separate from the tests: nothing fails when it gets slower. You read the report.

## What it measures

Both layers use the same documents. Each one is a sample from `test/fixtures/samples` (`javascript.js`, `nested.cs` or `test.py`) repeated to about 1k, 5k, 10k, 25k and 50k lines. Each is run with the default tags and again with 20 custom tags.

| Layer | Where | What's timed |
|---|---|---|
| **Node** | Plain Node, with the fake `vscode` from the Node suites | One update, as `extension.ts` runs it (`FindComments` then `ApplyDecorations`; v3.0.2's three `Find*` methods for that build), on alternating copies of the document with and without an edit. Repeated for at least 20 samples and half a second. |
| **Host** | Real VS Code (stable by default), with the build under test as the only Better Comments | **Host update:** the extension's own `updateDecorations`, including the real `getText` and `setDecorations`. **Edit to decorated:** from an edit at the end of the document to the end of the update it triggers; this includes the 100 ms debounce. **Switch to decorated:** from switching back to the document from a plain text tab to the end of its update. **First open:** the same, the first time the document is shown. |

The host layer times the real, unmodified extension. The extension debounces with `setTimeout(updateDecorations, 100)`, so the suite wraps the global `setTimeout` and times each `updateDecorations` callback. Each timed update is tied to the document that was active when it ran, and must have been scheduled after the measurement started.

Neither layer covers what happens after `setDecorations`: the renderer drawing the colours. That's layer 3 (below).

## Running it

```sh
npm run perf                                  # both layers, this checkout and v3.0.2, ~10 min
npm run perf -- --sizes 1000,10000 --iterations 5   # a quicker run
npm run perf -- --builds current,v3.0.2=084a906,old=<commit>
npm run perf -- --skip-host                   # Node layer only, ~30 s
npm run perf:report [results folder]          # rebuild the report from saved results
```

- `label=commit` builds that commit's extension into `.perf/builds/<label>` the first time it's used. It takes the commit's `src/`, `package.json` and `tsconfig.json`, and compiles them with this checkout's TypeScript.
- Results go to `.perf/results/<timestamp>/`: one JSON file per layer and build, plus `report.md` and `combined.json`. `.perf` is gitignored.
- The report includes the range count for each case. If the host and Node counts ever differ, it shows both. That's a cross-check that both layers decorate the same thing.

## Can the Node time stand in for the host?

Yes. In the latest full run (2026-10-27, VS Code 1.143.1, Linux, 60 cases over both builds), a straight line through the Node time predicts each host time closely:

| Host metric | ≈ | R² | Worst miss |
|---|---|---|---|
| Host update | 0.9 ms + 2.9 × Node | 0.952 | 5 ms |
| Edit to decorated | 102 ms + 2.9 × Node | 0.950 | 5 ms |
| Switch to decorated | 132 ms + 6.2 × Node | 0.895 | 17 ms |

The two runs before it gave the same fit to within a few percent, with R² between 0.88 and 0.96. Switching is the noisiest metric, because it includes VS Code showing the editor.

So the ~30 s Node layer is enough for comparing changes. A difference in Node time shows up about 3× larger in the editor, with about 102 ms of fixed delay on top, almost all of it the debounce. The fit is per machine; rerun the full benchmark to recalibrate on another one.

## Results so far

From the same run:

- **Scaling is linear in document size.** With the default tags, JavaScript (the densest sample) takes 6 ms of host update at 10k lines and 30 ms at 50k. Edit to decorated goes from 107 ms to 133 ms over the same range. Python and C# are cheaper because they have fewer ranges.
- **The ranges dominate.** Twenty custom tags that match less of the samples are *faster* than the five defaults that match more. The cost tracks the number of ranges found, not the number of tags.
- **This checkout against v3.0.2: no difference in the editor, about 5% slower in Node.**
  - **In the editor:** edit to decorated is within 1% everywhere. The extension's own update averages 1.4% slower, which is inside the host's run-to-run noise of about ±10%.
  - **In Node:** an update is 3–7% slower at every size, about 0.05–0.5 ms. For example, JavaScript with the default tags takes 2.28 ms against 2.01 ms at 10k lines, and 11.7 ms against 10.7 ms at 50k. By the fit above, that's about 0.15–1.3 ms on an edit that takes 105–135 ms.
  - **Why, and why it was kept:** the time to find the matches is level with v3.0.2. The extra time is in converting them to ranges. `findTags` returns every match at once, so they're all converted after the three scans, where v3.0.2 converted each scan's matches straight away. That ordering alone costs about 2.5%; the rest is unexplained. Going back to per-scan conversion would mean per-scan entry points or a callback in the core API. This was a deliberate trade for a simpler API (PR #573 review).
- **How the refactor got there:**
  - The first version passed matches through nested generators, which made the Node scans 5–30% slower.
  - Plain loops into an array the parser passed in brought it level with v3.0.2.
  - The core now has one entry point, `findTags(text, state, tags)` in `src/core/finder.ts`, which returns the matches. That costs the 3–7% above.

## Layer 3: on-screen latency (not built yet)

What the user sees is edit to decorated, plus the time for the renderer to receive the ranges and paint them. To measure that:

1. Launch the test VS Code with `--remote-debugging-port`.
2. Attach over the Chrome DevTools Protocol, and type with `Input.dispatchKeyEvent`.
3. In the renderer, watch for the decoration's class to appear on the edited line, then wait one more animation frame.

Pairing its results with the same cases would extend the fit above to on-screen time. A short manual session (typing in the 1k, 10k and 50k files and rating each one as smooth, slight lag, or laggy) would then show which on-screen times feel slow.
