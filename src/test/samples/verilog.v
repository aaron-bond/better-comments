/**********************************************************************
 * Date: Aug. 15, 2006
 * File: Mux_2_to_1b.v   (440 Examples)
 * ! ALERT
 * ? question
 * TODO: Some TODO
 * Behavioral Model of a  2 to 1 MUX (16-bit inputs) 
 **********************************************************************/

// ********************************************************
  module mux_2to1(Y, A, B, sel);
// ********************************************************
// ! alert
// ? question
// TODO: Some TODO
//// Commented out code

     output [15:0] Y;
     input  [15:0] A, B;
     input  sel;
     reg    [15:0] Y;
     always @(A or B or sel) 
       if (sel == 1'b0) 
         Y = A;
       else 
         Y = B;
  endmodule