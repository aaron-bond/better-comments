/**
 * Demo HelloWorld to print to stdout.
 */
class Demo.HelloWorld : GLib.Object {

    /**
     * Property Name.
     *
     * TODO: Add Verification.
     */
    public string name { get; set; }

    /**
     * This method supposed to do something usefull.
     *
     * If test equals some value it should return true otherwise false.
     *
     * @param test The required parameter.
     * @throws Error on failure.
     */
    public bool do_something (string test) throws GLib.Error {
        return true;
    }

    public static int main (string[] args) {

        stdout.printf ("Hello, World\n");

        return 0;
    }
}