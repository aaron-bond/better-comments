#!/usr/bin/env bash
# ! The shebang above is not a comment (#364), but this line is
set -euo pipefail

# TODO: take the name as an argument
name="world"
echo "Hello, ${name}" # ? after a command

# * highlighted
#! no space after the delimiter
