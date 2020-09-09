/**
* multi-line comment
* ! Alert
* ? question
* TODO: do something
* // nope
*/

module mux (
    input wire a,       // first input
    input wire b,       // second input
    input wire sel,     // select signal
    output reg o        // output
);

// single line comments
// ! Alert
// ? Why
// TODO: do some more
//// nothing
always_comb
begin : MUX
    if (sel == 1'b0)
        o = a;  // first input
    else
        o = b;  // second input
    end
end

endmodule