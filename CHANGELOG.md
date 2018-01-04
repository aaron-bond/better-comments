# Change Log

## [1.1.4] (2018-01-04)
#### Features
* Adding activation event and new comment type for VB.NET ("vb") ([]()), closes [21]

## [1.1.3] (2017-12-22)
#### Features
* Adding activation event for React ("javascriptreact") ([e54ae83](https://github.com/aaron-bond/better-comments/commit/e54ae83)), closes [#19]

## [1.1.2] (2017-12-16)
#### Bug Fixes
* Fixed wrong delimiter for Lua ([4bb1e2f](https://github.com/aaron-bond/better-comments/commit/4bb1e2f)), closes [#17]

## [1.1.1] (2017-12-12) : Accidental Increment
#### Bug Fixes
* Fixing issue with options configuration ([0a00618](https://github.com/aaron-bond/better-comments/commit/0a00618)), closes [#16]

## [1.0.0] (2017-12-06)
#### Bug Fixes
* Fixing support for JSDoc style block comments ([69a36bf](https://github.com/aaron-bond/better-comments/commit/69a36bf)), closes [#13]

#### Features
* Adding support for MANY languages ([0e7eab9](https://github.com/aaron-bond/better-comments/commit/0e7eab9d352780bfb303caf090e186c15bdcc77b)), closes [#8], [#9]
* Adding customisable comment annotation indicators, closes [#11]

## [0.1.3] (2017-07-17)
#### Bug Fixes
* Fixing an issue where multi-line comments would not be detected if preceded by some indentation ([c36821b](https://github.com/aaron-bond/better-comments/commit/c36821b))

#### Features
* Adding language support for `Go`

Thanks to **pwebly** for both of these additions :)

## [0.1.2] (2017-07-14)
#### Bug Fixes
* Fixing issue with `TODO` and `:` in multiline comments ([5f4d049](https://github.com/aaron-bond/better-comments/commit/5f4d049)), closes [#5](https://github.com/aaron-bond/better-comments/issues/5)

## [0.1.1] (2017-07-12)
#### Features
* Adding language support for `C` (thanks to _TheWhoAreYouPerson_) ([6f3b852](https://github.com/aaron-bond/better-comments/commit/6f3b852))
* Adding support for multiline comments (special thanks to _kurozael_ for the suggestion and help implementing) ([cc82fca](https://github.com/aaron-bond/better-comments/commit/cc82fca))
	 - Also adding contribution point for this: **multilineComments**: set this to false to disable

## [0.1.0] (2017-06-15)
#### Features
* Adding new comment type contribution point: **highlightColor** ([07bd22f](https://github.com/aaron-bond/better-comments/commit/07bd22f))

#### Bug Fixes
* Fixing issue where comment format conflicts with linters expecting a space after initial `//` (special thanks to _TobiasBales_)

#### House Keeping
* Added TravisCI config to run unit tests on check in ([bd4b7b2](https://github.com/aaron-bond/better-comments/commit/bd4b7b2))
* Updated README and demo image to show new comment type ([0cbbccb](https://github.com/aaron-bond/better-comments/commit/0cbbccb))

## [0.0.3] (2017-06-09)
Initial release to VSCode marketplace
