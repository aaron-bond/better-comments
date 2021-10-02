/** VHDL 2008 style multiline comment
* ! ALERT
* ? Why
* TODO: do something
* // nope
*/

LIBRARY ieee;
USE ieee.std_logic_1164.ALL;

ENTITY logic_and IS
    PORT (
        a : IN  std_logic;
        b : IN  std_logic;
        o : OUT std_logic
        );
END ENTITY logic_and;

ARCHITECTURE rtl OF logic_and IS

BEGIN  -- ARCHITECTURE rtl

    -- single line comments
    -- ! ALERT
    -- ? Why
    -- TODO: do something
    -- // nope
    o <= a AND b;

END ARCHITECTURE rtl;