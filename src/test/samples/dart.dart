class Spacecraft {
  String name;
  DateTime launchDate;

  // ! Constructor, with syntactic sugar for assignment to members.
  Spacecraft(this.name, this.launchDate) {
    // Initialization code goes here.
  }

  // * Named constructor that forwards to the default one.
  Spacecraft.unlaunched(String name) : this(name, null);

  int get launchYear =>
      launchDate?.year; // read-only non-final property

  /*
    Block comment
    ! alert
    * info
    ? question
    TODO: do some stuff
  */

  // ? Method.
  void describe() {
    print('Spacecraft: $name');
    if (launchDate != null) {
      int years = new DateTime.now()
              .difference(launchDate)
              .inDays ~/
          365;
      print('Launched: $launchYear ($years years ago)');
    } else {
      print('Unlaunched');
    }
  }
}