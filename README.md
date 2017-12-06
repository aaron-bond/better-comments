# Better Comments

The Better Comments extension will help you create more human-friendly comments in your code.
With this extension, you will be able to categorise your annotations into:
* Alerts
* Queries
* TODOs
* Removed code will also be styled to make it clear the code shouldn't be there!

![Annotated code](images/better-comments.PNG)

## Configuration

This extension can be configured in User Settings or Workspace settings.
The default settings are:

`better-comments.multilineComments`: `true`

`better-comments.tags`

	`tag`: '!'
	`color`: '#FF2D00'
	`strikethrough`: false

	`tag`: '?'
	`color`: '#3498DB'
	`strikethrough`: false

	`tag`: '//'
	`color`: '#474747'
	`strikethrough`: true

	`tag`: 'todo'
	`color`: '#FF8C00'
	`strikethrough`: false

	`tag`: '*'
	`color`: '#98C379'
	`strikethrough`: false