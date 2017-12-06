//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as Assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as bc from '../extension';

// Defines a Mocha test suite to group tests of similar kind together
suite("Better Comments tests", () => {

    // Defines a Mocha unit test
    test("should take default alert color from config", () => { });
	test("should take default question color from config", () => { });
	test("should take default removed color from config", () => { });
	test("should take default todo color from config", () => { });
});