//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as Assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as bc from '../src/extension';

// Defines a Mocha test suite to group tests of similar kind together
suite("Better Comments tests", () => {

    // Defines a Mocha unit test
    test("Something 1", () => {
        Assert.equal(-1, [1, 2, 3].indexOf(5));
        Assert.equal(-1, [1, 2, 3].indexOf(0));
    });
});