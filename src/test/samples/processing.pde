/**
*   MyMethod
*   * Important information is highligthed
*   ! Deprecated method, do not use
*   ? Should this method be exposed in the public API?
*   * TODO: refactor this method so that it conforms to the API
*/

Boolean hide = false;

void setup() {
  size(640, 360);
  background(0);
}

void draw() {
  //* This is highlighted
  if (!hide) {
    fill(204, 102, 0);
    rect(30, 20, 55, 55); //! This is an alert
  }
  
  //? This is a query

  ////this.lineOfCode() == commentedOut;

  //TODO: Create some test cases
}