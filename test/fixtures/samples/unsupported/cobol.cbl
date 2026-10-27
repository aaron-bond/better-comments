      $ SET SOURCEFORMAT"FREE"
IDENTIFICATION DIVISION.
PROGRAM-ID.  PerformFormat3.
AUTHOR.  Michael Coughlan.
* Demonstrates the use of the PERFORM..UNTIL.
* The PERFORM..UNTIL is most often used to process a 
* stream of data where the length of the stream can not 
* be determined in advance.
* Pay particular attention to the way the number stream is 
* processed in this program.
* Note how the ON SIZE ERROR can be used to detect when the
* result of a computation is tot big for the data-item intended
* to hold it.
* The INITIALIZE verb sets a data-item to its initial or 
* starting value.
*> TODO: Check if this format is correct
DATA DIVISION.
WORKING-STORAGE SECTION.
01 IterCount           PIC 99  VALUE ZEROS.
   88 MaxCountReached  VALUE 99.
01 UserInput           PIC 99  VALUE ZEROS.
   88 EndOfUserInput   VALUE ZEROS.
01 RunningTotal        PIC 999 VALUE ZEROS.
01 AverageValue        PIC 99  VALUES ZEROS.

PROCEDURE DIVISION.
Begin.
    PERFORM UNTIL IterCount = 5
       DISPLAY "IterCount = " IterCount
       ADD 1 TO IterCount
    END-PERFORM
    DISPLAY "Finished in line Perform." *> ! comment here

    INITIALIZE Itercount

    DISPLAY "Enter a stream of up to 99 numbers."
    DISPLAY "Each number must be in the range 1-99.  Enter 0 to stop."
    DISPLAY "Enter number :- " WITH NO ADVANCING
    ACCEPT UserInput
    PERFORM GetUserInput UNTIL EndOfUserInput OR MaxCountReached

    DISPLAY "The final total is - " RunningTotal
    DISPLAY "The final count is - " IterCount
    COMPUTE AverageValue = RunningTotal / IterCount
    DISPLAY "The average value entered is - " AverageValue
    STOP RUN.


GetUserInput.
    ADD UserInput TO RunningTotal
        ON SIZE ERROR DISPLAY "Error - new total too large for data-item."
        NOT ON SIZE ERROR ADD 1 TO IterCount END-ADD
    END-ADD
    DISPLAY "Total so far is - " RunningTotal
    DISPLAY "Count so far is - " IterCount
    DISPLAY "Enter number :- " WITH NO ADVANCING
    ACCEPT UserInput.

