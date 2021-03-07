import MyTable  from "../components/MyTable";
import Props  from "../components/MyTable";
import { render, fireEvent, waitForElement, findByText, getByText } from "@testing-library/react";
import * as React from 'react';
import { mount, shallow } from 'enzyme'



test('Sanity check', () => {
    expect(1).toBe(1);
});

let mytable = new MyTable(
   {
      initialrows: 5,
      initialcols: 5
   });

test("Check first cell contents", () => {
   expect(mytable.state.table[0][0].getData()).toBe("0 0");
});

test("Check AddRow", () => {
    let c = render(<MyTable/>);
    let b = c.getByText("Add Row");
    fireEvent.click(b);
    expect(c.getByText("5 4")).toBeTruthy();
 });

 test("Check AddCol", () => {
    let c = render(<MyTable/>);
    let b = c.getByText("Add Column");
    fireEvent.click(b);
    expect(c.getByText("0 5")).toBeTruthy();
 });