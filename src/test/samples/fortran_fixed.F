c     euclid.f (FORTRAN 77)
c     Find greatest common divisor using the Euclidean algorithm
c! From https://en.wikibooks.org/wiki/Fortran/Fortran_examples#FORTRAN_77
C* Fortran is case insensitive, you can use 'C' and 'c' interchangeably
C TODO: Improve program indentation
      PROGRAM EUCLID
      PRINT *, 'A?'
      READ *, NA
C? This type of comment also works
      IF (NA.LE.0) THEN
            PRINT *, 'A must be a positive integer.'
            STOP
      END IF
      PRINT *, 'B?'
      READ *, NB
      IF (NB.LE.0) THEN
            PRINT *, 'B must be a positive integer.'
            STOP
      END IF
      PRINT *, 'The GCD of', NA, ' and', NB, ' is', NGCD(NA, NB), '.'
      STOP
      END

C* Define a fucntion for the greatest common divisor
      FUNCTION NGCD(NA, NB)
      IA = NA
      IB = NB
1     IF (IB.NE.0) THEN
            ITEMP = IA
            IA = IB
            IB = MOD(ITEMP, IB)
            GOTO 1
      END IF
      NGCD = IA
      RETURN
      END