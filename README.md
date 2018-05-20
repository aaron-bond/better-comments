# Better Comments

The Better Comments extension will help you create more human-friendly comments in your code.  
With this extension, you will be able to categorise your annotations into:
* Alerts
* Queries
* TODOs
* Highlights
* Commented out code can also be styled to make it clear the code shouldn't be there
* Any other comment styles you'd like can be specified in the settings

![Annotated code](images/better-comments.PNG)

## Configuration

This extension can be configured in User Settings or Workspace settings.


`'better-comments.multilineComments': true`  
 This setting will control whether multiline comments are styled using the annotation tags.
 When false, multiline comments will be presented without decoration.

`'better-comments.highlightPlainText': false`  
This setting will control whether comments in a plain text file are styled using the annotation tags.
When true, the tags (defaults: `! * ? //`) will be detected if they're the first character on a line.

`better-comments.tags`  
The tags are the characters or sequences used to mark a comment for decoration.
The default 5 can be modifed to change the colors, and more can be added.
```javascript
[{
  `tag`: '!',
  `color`: '#FF2D00',
  `strikethrough`: false,
  `backgroundColor`: 'transparent'
},{
  `tag`: '?',
  `color`: '#3498DB',
  `strikethrough`: false,
  `backgroundColor`: 'transparent'
},{
  `tag`: '//',
  `color`: '#474747',
  `strikethrough`: true,
  `backgroundColor`: 'transparent'
},{
  `tag`: 'todo',
  `color`: '#FF8C00',
  `strikethrough`: false,
  `backgroundColor`: 'transparent'
},{
  `tag`: '*',
  `color`: '#98C379',
  `strikethrough`: false,
  `backgroundColor`: 'transparent'
}]
```

## Supported Languages

* Ada
* AL
* C
* Clojure
* CoffeeScript
* CSS
* C++
* C#
* Dart
* Dockerfile
* Elixir
* Erlang
* F#
* Go
* GraphQL
* Groovy
* Haskell
* Haxe
* Kotlin
* Java
* JavaScript
* JavaScript React
* JSON with comments
* Julia
* LaTex
* Less
* Lisp
* Lua
* Makefile
* MATLAB
* Objective-C
* Objective-C++
* Pascal
* Perl
* Perl 6
* PHP
* PL/SQL
* PowerShell
* Python
* R
* Racket
* Rust
* Ruby
* Sass
* Scala
* SCSS
* ShaderLab
* ShellScript
* SQL
* Swift
* Terraform
* TypeScript
* TypeScript React
* Visual Basic
* YAML