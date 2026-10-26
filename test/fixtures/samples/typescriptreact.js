"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const ReactDOM = require("react-dom");
const Hello_1 = require("./containers/Hello");
const react_redux_1 = require("react-redux");
const redux_1 = require("redux");
const index_1 = require("./reducers/index");
require("./index.css");
/**
 * some comments here
 * ! to alert
 * * to highlight
 * ? to question
 */
/*
! and the other format
*/
// finally
// ! single line comments
const store = (0, redux_1.createStore)(index_1.enthusiasm, {
    enthusiasmLevel: 1,
    languageName: 'TypeScript',
});
ReactDOM.render(<react_redux_1.Provider store={store}>
    <Hello_1.default />
  </react_redux_1.Provider>, document.getElementById('root'));
//# sourceMappingURL=typescriptreact.js.map