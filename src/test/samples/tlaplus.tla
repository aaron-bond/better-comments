(*--algorithm tlaplus
(**
 * Example of a block comment inside PlusCal algorithm
 * ! Alert
 * ? Question
 * * Highlight
 * TODO Some stuff
 *)
begin
    \* * Line comments also work
    \* ? Do they?
    \* ! They really do
    skip;
end algorithm; *)
\* BEGIN TRANSLATION - the hash of the PCal code: PCal-57736ac5c15edfbcebd7f2832422e595
VARIABLE pc

(**
 * Example of a block comment inside TLA+
 * ! Alert
 * ? Question
 * * Highlight
 * TODO Some stuff
 *)

vars == << pc >>

Init == /\ pc = "Lbl_1"

Lbl_1 == /\ pc = "Lbl_1"
         /\ TRUE
         /\ pc' = "Done"

(* Allow infinite stuttering to prevent deadlock on termination. *)
Terminating == pc = "Done" /\ UNCHANGED vars

Next == Lbl_1
           \/ Terminating

Spec == Init /\ [][Next]_vars

Termination == <>(pc = "Done")

\* END TRANSLATION - the hash of the generated TLA code (remove to silence divergence warnings): TLA-c42acd1a2a013bcd259342cfe120880f
