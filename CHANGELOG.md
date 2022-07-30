# Change Log

## [3.0.2] (2022-07-30)
### House Keeping
* Adding Sponsor link to package.json ([c2b4992](https://github.com/aaron-bond/better-comments/commit/c2b4992)), closes [#409](https://github.com/aaron-bond/better-comments/issues/409)

## [3.0.1] (2022-07-30)
### Features
* Enabling Better Comments to run within VSCode for the Web ([3c4a6ac](https://github.com/aaron-bond/better-comments/commit/3c4a6ac)). Massive thanks to _tanhakabir_

## [3.0.0] (2022-04-05)
### Features
* Adding built in support for all languages ([e1373bf](https://github.com/aaron-bond/better-comments/commit/e1373bf)). Massive thanks to _edgardmessias_

### House Keeping
* Version bumped all dependencies
* Language support is now driven from configuration files. This means that if you have an extension which informs VSCode about a language, Better Comments will know about it too!
* Problems are likely to arise with this change, but it allows a lot more users to benefit from Better Comments without needing an explicit update for the extension adding support.

__With version 3.0.0 comes the addition of the support button on the Github page for [Better Comments](https://github.com/sponsors/aaron-bond)__  
__If you feel my work on this extension has earned me a coffee, that's the place to do it!__

_**Thanks!**_


## [2.1.0] (2020-07-13)
### Features
* Adding Bold, Italic, and Underline ([e41ccc4](https://github.com/aaron-bond/better-comments/commit/e41ccc4)), closes [#50](https://github.com/aaron-bond/better-comments/issues/50). Massive thanks to _Fr33maan_
* Adding XML support
* Adding BrightScript support

### Bug Fixes
* Fixing Shaderlab support ([f96049f](https://github.com/aaron-bond/better-comments/commit/f96049f)), closes [#245](https://github.com/aaron-bond/better-comments/issues/245)
* Fixing SASS support ([7decffb](https://github.com/aaron-bond/better-comments/commit/7decffb)), closes [#123](https://github.com/aaron-bond/better-comments/issues/123), [#215](ttps://github.com/aaron-bond/better-comments/issues/215)

## [2.0.5] (2019-05-15)
### Features
* Adding Markdown support ([54e51fb](https://github.com/aaron-bond/better-comments/commit/54e51fb)), closes [#91](https://github.com/aaron-bond/better-comments/issues/91)
* Adding Apex support ([301644e](https://github.com/aaron-bond/better-comments/commit/301644e)), closes [#143](https://github.com/aaron-bond/better-comments/issues/143)
* Adding GenStat support ([a14e24c](https://github.com/aaron-bond/better-comments/commit/a14e24c)), closes [#149](https://github.com/aaron-bond/better-comments/issues/149)
* Adding ColdFusion support ([9e2a4be](https://github.com/aaron-bond/better-comments/commit/9e2a4be)), closes [#135](https://github.com/aaron-bond/better-comments/issues/135)

## [2.0.4] (2019-05-14)
### Bug Fixes
* Fixing Groovy support ([099bcc0](https://github.com/aaron-bond/better-comments/commit/099bcc0)), closes [#150](https://github.com/aaron-bond/better-comments/issues/150)
* Fixing multiline Lua support ([7ca3164](https://github.com/aaron-bond/better-comments/commit/7ca3164)), closes [#151](https://github.com/aaron-bond/better-comments/issues/151)

### Features
* Supporting remote development, closes [#147](https://github.com/aaron-bond/better-comments/issues/147). Thanks _mjbvz_
* Adding Elm support, merges [#146](https://github.com/aaron-bond/better-comments/pull/146). Thanks _ChristianPredebon_

## [2.0.3] (2018-11-04)
### Features
* Adding Stylus support ([a57ad30](https://github.com/aaron-bond/better-comments/commit/a57ad30)), merges [#112](https://github.com/aaron-bond/better-comments/issues/112). Thanks _vednoc_
* Adding ASCIIDoc support ([60a5f5f](https://github.com/aaron-bond/better-comments/commit/60a5f5f)), closes [#107](https://github.com/aaron-bond/better-comments/issues/107)

## [2.0.2] (2018-10-10)
### Bug Fixes
* Fixing single line CSS comments([469a93f](https://github.com/aaron-bond/better-comments/commit/469a93f)), closes [#109](https://github.com/aaron-bond/better-comments/issues/109)
* Fixing support for multiline Haskell comments ([498016a](https://github.com/aaron-bond/better-comments/commit/498016a)), closes [#102](https://github.com/aaron-bond/better-comments/issues/102)

### Features
* Adding D support ([c6a619c](https://github.com/aaron-bond/better-comments/commit/c6a619c)), closes [#99](https://github.com/aaron-bond/better-comments/issues/99)

## [2.0.1] (2018-09-26)
### Bug Fixes
* Fixing issue where JSDoc block comments weren't being detected properly ([7cb9126](https://github.com/aaron-bond/better-comments/commit/7cb9126)), closes [#101](https://github.com/aaron-bond/better-comments/issues/101)

## [2.0.0] (2018-09-20)
### Features
* Block comments for lots and lots of languages. Please raise a bug or feature request if I've missed any!
* Added support for HTML
* Added support for Twig
* Added support for Puppet

### House Keeping
* I decided a major version release was appropriate for this one as it's a pretty huge set of changes in terms of how the extension functions
* It's now possible to add block comment formatting for any new languages as required. Sorry it took so long!

## [1.3.0] (2018-09-13)
### Features
* Adding support for Bibtex/Biblatex ([d1f06b6](https://github.com/aaron-bond/better-comments/commit/d1f06b6)), thanks to _JavierReyes945_, merges [#96](https://github.com/aaron-bond/better-comments/pull/96)
* Adding support for Verilog HDL ([b368b17](https://github.com/aaron-bond/better-comments/commit/b368b17)), closes [#84](https://github.com/aaron-bond/better-comments/issues/84)

### Bug Fixes
* Fixing multiline comment support for SAS and Stata ([4b40bd9](https://github.com/aaron-bond/better-comments/commit/4b40bd9)), closes [#95](https://github.com/aaron-bond/better-comments/issues/95)

## [1.2.9] (2018-09-08)
### Features
* Adding support for PlantUML ([9a446a3](https://github.com/aaron-bond/better-comments/commit/9a446a3)), thanks to _JavierReyes945_, closes [#94](https://github.com/aaron-bond/better-comments/issues/94)

## [1.2.8] (2018-09-03)
### Features
* Added support for Tcl ([52e6d35](https://github.com/aaron-bond/better-comments/commit/52e6d35)), closes [#92](https://github.com/aaron-bond/better-comments/issues/92)

## [1.2.7] (2018-09-02)
### Features
* Adding support for Flax ([71f6326](https://github.com/aaron-bond/better-comments/commit/71f6326)), merges [#76](https://github.com/aaron-bond/better-comments/issues/76)
* Adding support for multiple languages, closes [#89](https://github.com/aaron-bond/better-comments/issues/89)
	* Fortran (modern) ([8762226](https://github.com/aaron-bond/better-comments/commit/8762226))
	* SAS ([145e8d3](https://github.com/aaron-bond/better-comments/commit/145e8d3))
	* STATA ([eb0f367](https://github.com/aaron-bond/better-comments/commit/eb0f367))

### House Keeping
* Updating README to reflect actual styntax better ([71f9019](https://github.com/aaron-bond/better-comments/commit/71f9019)), merges [#77](https://github.com/aaron-bond/better-comments/issues/77)
* Messed up the incrementing of the version on this one with the gdscript merge so just pushing this as 1.2.7 for convenience

## [1.2.5] (2018-06-04)
### Features
* Adding support for COBOL ([7939ca2](https://github.com/aaron-bond/better-comments/commit/7939ca2)), merges [#34](https://github.com/aaron-bond/better-comments/issues/34)

### Bug Fixes
* Fixing plaintext highlight even when setting is false ([7939ca2](https://github.com/aaron-bond/better-comments/commit/7939ca2)), closes [#73](https://github.com/aaron-bond/better-comments/issues/73)

## [1.2.4] (2018-05-31)
### Features
* Adding new property for tags: **backgroundColor** ([3e7a188](https://github.com/aaron-bond/better-comments/commit/3e7a188)), closes [#66](https://github.com/aaron-bond/better-comments/issues/66)
	-  default: `transparent`
* Adding support for: PlainText ([27ff774](https://github.com/aaron-bond/better-comments/commit/27ff774)), closes [#39](https://github.com/aaron-bond/better-comments/issues/39)  
	-  PlainText support must be turned on in the settings: `highlightPlainText`
* Adding support for: Vue.js ([2b14d2e](https://github.com/aaron-bond/better-comments/commit/2b14d2e)), closes [#71](https://github.com/aaron-bond/better-comments/issues/71)
* Adding support for: nim ([73a55f6](https://github.com/aaron-bond/better-comments/commit/73a55f6)), merges [#68](https://github.com/aaron-bond/better-comments/issues/68)
* Adding support for: HiveQL and Pig ([e1653ef](https://github.com/aaron-bond/better-comments/commit/e1653ef)), merges [#63](https://github.com/aaron-bond/better-comments/issues/63)

## [1.2.3] (2018-05-20)
### Features
* Adding support for: Dart ([7490b81](https://github.com/aaron-bond/better-comments/commit/7490b81)), closes [#65](https://github.com/aaron-bond/better-comments/issues/65)
* Adding support for: Matlab ([e35541b](https://github.com/aaron-bond/better-comments/commit/e35541b)), closes [#58](https://github.com/aaron-bond/better-comments/issues/58)

### Bug Fixes
* Fixing support for SCSS ([2b3919f](https://github.com/aaron-bond/better-comments/commit/2b3919f)), closes [#60](https://github.com/aaron-bond/better-comments/issues/60)
* Fixing Python to prevent first line of the file being detected as a comment,  
([438e0a6](https://github.com/aaron-bond/better-comments/commit/438e0a6)), closes [#61](https://github.com/aaron-bond/better-comments/issues/61)


## [1.2.2] (2018-04-15)
### Features
* Adding support for: JSON with comments ([6f0b330](https://github.com/aaron-bond/better-comments/commit/6f0b330)), closes [#51](https://github.com/aaron-bond/better-comments/issues/51)
* Adding support for: AL ([de86410](https://github.com/aaron-bond/better-comments/commit/de86410)), closes [#54](https://github.com/aaron-bond/better-comments/issues/54)
* Adding support for: TypeScript React (.tsx) ([e884b37](https://github.com/aaron-bond/better-comments/commit/e884b37)), closes [#56](https://github.com/aaron-bond/better-comments/issues/56)

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
