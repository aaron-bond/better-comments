{-
    ! Compile to readable JavaScript and reuse existing JavaScript code easily
    -}
module Main where

import Prelude
import Effect.Console (log)

greet :: String -> String
greet name = "Hello, " <> name <> "!"

-- TODO Build real-world applications using functional techniques and expressive types
main = log (greet "World")
