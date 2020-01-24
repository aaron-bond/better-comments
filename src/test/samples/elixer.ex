@moduledoc """"
Some description
    ! ALERT
"""

["T", "e", "s", "t"] = String.graphemes("Test")

# Contrast this with codepoints which may return
# multiple codepoints for a single character
# ! alert
# ? question
# TODO
["ö"]      = String.graphemes("ö")
["o", "̈"] = String.codepoints("ö")