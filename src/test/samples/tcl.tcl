#!/usr/bin/tclsh

# ! switch_cmd.tcl

set domain x
switch $domain {

    x { puts "x" }
    y { puts "y" }
    z { puts "z" }
    default { puts "unknown" }
}

proc power {base p} {
    set result 1
    while {$p > 0} {
        set result [expr $result * $base]
        set p [expr $p - 1]
    }
    return $result
}

set a 10
set b 20

if {$a == 10} {

# ? if expression_1 is true then it will go to expression_2
if {$b == 20} {
        # * if expression_2 is true then it will print the below string
        puts "value of a is 10 and b is 20"
    }
}

o/p: value of a is 10 and b is 20