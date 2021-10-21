{- 
   ! Don't repeat yourself!

   Repetition is error-prone
-}

let user = "bill"
in  { home       = "/home/${user}"
    , privateKey = "/home/${user}/.ssh/id_ed25519"
    , publicKey  = "/home/${user}/.ssh/id_ed25519.pub"
    }

-- TODO Change the name "bill" to "jane"
