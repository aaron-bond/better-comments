* ! this is a comment
/* ? also this is */

DATA CLASS;
     INPUT NAME $ 1-8 SEX $ 10 AGE 12-13 HEIGHT 15-16 WEIGHT 18-22;
CARDS;
JOHN       M    12    59   99.5
JAMES      M    12    57   83.0
ALFRED     M    14    69   112.5
ALICE      F    13    56   84.0

PROC MEANS;
     VAR AGE HEIGHT WEIGHT;
PROC PLOT;
     PLOT WEIGHT*HEIGHT;
ENDSAS;
;