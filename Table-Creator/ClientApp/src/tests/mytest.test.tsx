﻿import MyTable  from "../components/MyTable";
import Props  from "../components/MyTable";
import { render, fireEvent, waitForElement, findByText, getByText, waitForElementToBeRemoved } from "@testing-library/react";
import * as React from 'react';
import { mount, shallow, configure } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

configure({ adapter: new Adapter() });


test('Sanity check', () => {
    expect(1 + 1).toBe(2);
});

test("Check first cell contents", () => {
   let wrapper = shallow(<MyTable/>);
   let table = wrapper.instance() as MyTable;

   expect(table.state.table[0][0].getData()).toBe("0 0");
});

test("Check AddRow", () => {
   let wrapper = shallow(<MyTable/>);
   let table = wrapper.instance() as MyTable;

   let addrowbutton = wrapper.find('#addrowbutton');
   addrowbutton.simulate("click");

   let cell = wrapper.find('td[id="5 1"]');
   expect(cell).toBeTruthy();
 });

 test("Check AddCol", () => {
   let wrapper = shallow(<MyTable/>);
   let table = wrapper.instance() as MyTable;

   let addcolbutton = wrapper.find('#addcolbutton');
   addcolbutton.simulate("click");

   let cell = wrapper.find('td[id="0 5"]');
   expect(cell).toBeTruthy();
 });

test("Select Cell", () => {
   let wrapper = shallow(<MyTable/>);
   let table = wrapper.instance() as MyTable;

   //let i = wrapper.find('td[id="1 1"]');
   //i.simulate('click');

   table.state.table[1][1].select();
   expect(table.state.table[1][1].isSelected()).toBe(true);

});

test("Simple Merge", () => {
   let wrapper = shallow(<MyTable/>);
   let table = wrapper.instance() as MyTable;

   table.state.table[1][1].select();
   expect(table.state.table[1][1].isSelected()).toBe(true);
   table.state.table[1][2].select();

   let mergebutton = wrapper.find('#mergebutton');
   mergebutton.simulate("click");

   expect(table.state.table[1][1].isVisible()).toBe(true);
   expect(table.state.table[1][2].isVisible()).toBe(false);
});

test("Less Complicated Merge", () => {
   let wrapper = shallow(<MyTable/>);
   let table = wrapper.instance() as MyTable;

   let mergebutton = wrapper.find('#mergebutton');

   table.state.table[1][1].select();
   table.state.table[1][2].select();
   mergebutton.simulate("click");

   table.state.table[1][1].select();
   table.state.table[2][2].select();
   mergebutton.simulate("click");

   expect(table.state.table[1][1].isVisible()).toBe(true);
   expect(table.state.table[1][2].isVisible()).toBe(false);
   expect(table.state.table[2][1].isVisible()).toBe(false);
   expect(table.state.table[1][2].isVisible()).toBe(false);
});


//Used to fix merge bug
test("More Complicated Merge", () => {
   let wrapper = shallow(<MyTable/>);
   let table = wrapper.instance() as MyTable;

   let mergebutton = wrapper.find('#mergebutton');

   table.state.table[1][1].select();
   table.state.table[1][2].select();
   mergebutton.simulate("click");

   table.state.table[2][2].select();
   table.state.table[2][3].select();
   mergebutton.simulate("click");

   table.state.table[3][3].select();
   table.state.table[3][4].select();
   mergebutton.simulate("click");

   table.state.table[1][3].select();
   table.state.table[3][3].select();
   mergebutton.simulate("click");
   
   expect(table.state.table[1][3].isVisible()).toBe(false);
});



 const generateRandomString = function(length=6){
   return Math.random().toString(20).substr(2, length)
}

function generatecsv() {
   return generateRandomString(10) + ", " + generateRandomString(10) + "\n" + generateRandomString(10) + ", " + generateRandomString(10);
}

function copyToClipboard(text: string) {
   const elem = document.createElement('textarea');
   elem.value = text;
   document.body.appendChild(elem);
   elem.select();
   document.execCommand('copy');
   document.body.removeChild(elem);
}



test("Check csv import", () => {
   let wrapper = shallow(<MyTable/>);
   let table = wrapper.instance() as MyTable;

   let csv = "anelement,b\nc,d\ne,f"
   table.testcsv(csv);
   expect(table.state.table[0][0].getData()).toBe("anelement");
   expect(table.state.table[0][1].getData()).toBe("b");
   expect(table.state.table[1][0].getData()).toBe("c");
   expect(table.state.table[1][1].getData()).toBe("d");
   expect(table.state.table[2][0].getData()).toBe("e");
   expect(table.state.table[2][1].getData()).toBe("f");

   let cell = wrapper.find('td[id="0 0"]');
   expect(cell.contains("anelement")).toBeTruthy();

   expect(table.state.table.length).toBe(3);
   expect(table.state.table[0].length).toBe(2);
});

test("Move Cell", () => {
   let wrapper = shallow(<MyTable/>);
   let table = wrapper.instance() as MyTable;

   let csv = "CellA,CellB\nCellC,CellD"
   table.testcsv(csv);
   expect(table.state.table[0][0].getData()).toBe("CellA");


   //logic goes here
   //Move cell 0 0 to  1 0
   table.state.table[0][0].select();
   let button = wrapper.find('#movecellsdownbutton');
   button.simulate("click");

   let cell = wrapper.find('td[id="1 0"]');
   expect(cell.contains("CellA")).toBeTruthy();
   expect(table.state.table[0][0].getData()).toBe("");
});

test("Move Cell out of table", () => {
   let wrapper = shallow(<MyTable/>);
   let table = wrapper.instance() as MyTable;

   let csv = "CellA,CellB\nCellC,CellD"
   table.testcsv(csv);
   expect(table.state.table[0][0].getData()).toBe("CellA");


   //logic goes here
   //Move cell 0 0 to  1 0
   table.state.table[0][0].select();
   let button = wrapper.find('#movecellsupbutton');
   button.simulate("click");

   let cell = wrapper.find('td[id="0 0"]');
   expect(cell.contains("CellA")).toBeFalsy();
   expect(table.state.table[0][0].getData()).toBe("");
});

test("Delete Selected Row", () => {
   let wrapper = shallow(<MyTable/>);
   let table = wrapper.instance() as MyTable;

   let csv = "CellA,CellB\nCellC,CellD"
   table.testcsv(csv);
   expect(table.state.table[0][0].getData()).toBe("CellA");

   table.state.table[0][0].select();
   let button = wrapper.find('#deleterowbutton');
   button.simulate("click");
   expect(table.state.table.length).toBe(1);
   expect(table.state.table[0][0].getData()).toBe("CellC");
});

test("Delete Selected Col", () => {
   let wrapper = shallow(<MyTable/>);
   let table = wrapper.instance() as MyTable;

   let csv = "CellA,CellB\nCellC,CellD"
   table.testcsv(csv);
   expect(table.state.table[0][0].getData()).toBe("CellA");

   table.state.table[0][0].select();
   let button = wrapper.find('#deletecolbutton');
   button.simulate("click");
   expect(table.state.table[0].length).toBe(1);
   expect(table.state.table[0][0].getData()).toBe("CellB");
});


