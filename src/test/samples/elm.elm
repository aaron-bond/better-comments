--!(no space)
-- ! (space)
--  !   tab then tab
--  ! tab then space
import Html exposing (..)

--! user status
type UserStatus = Regular | Visitor

{-
! type alias User
* type alias User
? type alias User
TODO typ alias Book
-}
type alias User =
    {
        firstName : String
      , lastName : String
      , age : Int
      , status : UserStatus
    }

tom = {firstName = "tom", lastName = "john", age = 34, status = Visitor }

main =
    text "Hello world!"

{-
    TODO tab TODO
        !double tab
            ?triple tab
                *quadruple tab
-}