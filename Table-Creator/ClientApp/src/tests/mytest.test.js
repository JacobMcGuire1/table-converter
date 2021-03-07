"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MyTable_1 = require("../components/MyTable");
const MyTable_2 = require("../components/MyTable");
const react_1 = require("@testing-library/react");
const React = require("react");
test('Sanity check', () => {
    expect(1).toBe(1);
});
let mytable = new MyTable_1.default(new MyTable_2.default({}));
test("Check first cell contents", () => {
    expect(mytable.state.table[0][0].getData()).toBe("0 0");
});
test("Check AddRow", () => {
    let c = react_1.render(React.createElement(MyTable_1.default, null));
    let b = c.getByText("Add Row");
    react_1.fireEvent.click(b);
    expect(c.getByText("5 4")).toBeTruthy();
});
test("Check AddCol", () => {
    let c = react_1.render(React.createElement(MyTable_1.default, null));
    let b = c.getByText("Add Column");
    react_1.fireEvent.click(b);
    expect(c.getByText("0 5")).toBeTruthy();
});
//# sourceMappingURL=mytest.test.js.map