# Change Log

## [1.2.1] (2018-03-20)
### Features
* Adding support for: Terraform ([c5edd8d](https://github.com/aaron-bond/better-comments/commit/c5edd8d)), closes [#48](https://github.com/aaron-bond/better-comments/issues/48)

### Bug Fixes
* Fixing logic to run the decorations properly when switching back from an unsupported language ([756e0e0](https://github.com/aaron-bond/better-comments/commit/756e0e0)), closes [#47](https://github.com/aaron-bond/better-comments/issues/47)
* Fixing decoration of strikethrough on multiline comments to start in the correct location ([c4372e7](https://github.com/aaron-bond/better-comments/commit/c4372e7)), closes [#46](https://github.com/aaron-bond/better-comments/issues/46)

## [1.2.0] (2018-03-19)
### Features
* Adding support for: Clojure, Racket, Lisp ([88e0720](https://github.com/aaron-bond/better-comments/commit/88e0720)), merges [#40](https://github.com/aaron-bond/better-comments/pull/40)
* Adding support for: Yaml ([e9f40a0](https://github.com/aaron-bond/better-comments/commit/e9f40a0)), merges [#37](https://github.com/aaron-bond/better-comments/pull/37)
* Adding support for: Pascal ([655f61f](https://github.com/aaron-bond/better-comments/commit/655f61f)), closes [#41](https://github.com/aaron-bond/better-comments/pull/37)

### Bug Fixes
* Fixing crash when unsupported language is opened in the window ([e9f40a0](https://github.com/aaron-bond/better-comments/commit/e9f40a0)), closes [#35](https://github.com/aaron-bond/better-comments/issues/35)

## [1.1.9] (2018-02-11)
### Features
* Adding support for Julia ([1b24ce1](https://github.com/aaron-bond/better-comments/commit/1b24ce1))

## [1.1.8] (2018-01-23)
### Features
* Adding support for GraphQL ([bcfcefa](https://github.com/aaron-bond/better-comments/commit/bcfcefa)), closes [#28](https://github.com/aaron-bond/better-comments/issues/28)

### Bug Fixes
* Expanding non-JSDoc block comment detection ([dccd467](https://github.com/aaron-bond/better-comments/commit/dccd467)), closes [#20](https://github.com/aaron-bond/better-comments/issues/20)

## [1.1.7] (2018-01-07)
### Bug Fixes
* Fixing comment detection when tabs are used to start the comment ([2f08fb9](https://github.com/aaron-bond/better-comments/commit/2f08fb9)), closes [#25](https://github.com/aaron-bond/better-comments/issues/25), thanks to _bekorn_

## [1.1.6] (2018-01-15)
### Features
* Adding multiple new languages ([586f325](https://github.com/aaron-bond/better-comments/commit/586f325)), thanks to _Jooseppi12_

## [1.1.5] (2018-01-14)
#### Bug Fixes
* Fixing multiline comment detection with non-English characters ([deff42b](https://github.com/aaron-bond/better-comments/commit/deff42b)), closes [#24](https://github.com/aaron-bond/better-comments/issues/24)

## [1.1.4] (2018-01-04)
#### Features
* Adding activation event and new comment type for VB.NET ("vb") ([45199a9](https://github.com/aaron-bond/better-comments/commit/45199a9)), closes [#21](https://github.com/aaron-bond/better-comments/issues/21)

## [1.1.3] (2017-12-22)
#### Features
* Adding activation event for React ("javascriptreact") ([e54ae83](https://github.com/aaron-bond/better-comments/commit/e54ae83)), closes [#19](https://github.com/aaron-bond/better-comments/issues/19)

## [1.1.2] (2017-12-16)
#### Bug Fixes
* Fixed wrong delimiter for Lua ([4bb1e2f](https://github.com/aaron-bond/better-comments/commit/4bb1e2f)), closes [#17](https://github.com/aaron-bond/better-comments/issues/17)

## [1.1.1] (2017-12-12) : Accidental Increment
#### Bug Fixes
* Fixing issue with options configuration ([0a00618](https://github.com/aaron-bond/better-comments/commit/0a00618)), closes [#16](https://github.com/aaron-bond/better-comments/issues/16)

## [1.0.0] (2017-12-06)
#### Bug Fixes
* Fixing support for JSDoc style block comments ([69a36bf](https://github.com/aaron-bond/better-comments/commit/69a36bf)), closes [#13](https://github.com/aaron-bond/better-comments/issues/13)

#### Features
* Adding support for MANY languages ([0e7eab9](https://github.com/aaron-bond/better-comments/commit/0e7eab9d352780bfb303caf090e186c15bdcc77b)), closes [#8](https://github.com/aaron-bond/better-comments/issues/8), [#9](https://github.com/aaron-bond/better-comments/issues/9)
* Adding customisable comment annotation indicators, closes [#11](https://github.com/aaron-bond/better-comments/issues/11)

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
