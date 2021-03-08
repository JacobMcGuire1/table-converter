import MyTable  from "../components/MyTable";
import Props  from "../components/MyTable";
import { render, fireEvent, waitForElement, findByText, getByText, waitForElementToBeRemoved } from "@testing-library/react";
import * as React from 'react';
import { mount, shallow, configure } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

configure({ adapter: new Adapter() });


test('Sanity check', () => {
    expect(1).toBe(1);
});

function newtable(){
   return new MyTable(
      {
         initialrows: 5,
         initialcols: 5
      });
}

test("Select Cell", () => {
   //let table = newtable();
   //let r = table.render();
  // let rendered = render(r);
   let wrapper = shallow(<MyTable/>);
   let table = wrapper.instance() as MyTable;
   //let q = mount(<MyTable/>);
   //let cell = rendered.find("1 1").getElement();
   //let cell = rendered.getByText("1 1").parentElement?.parentElement!;
   //expect(cell).toBeNull();
   let i = wrapper.find('td[id="1 1"]');
   //console.log(i.debug());
   i.simulate('click');
   
   //wrapper.update();
   table.state.table[1][1].select();
   expect(table.state.table[1][1].isSelected()).toBe(true);
   /*fireEvent.click(cell);
   fireEvent.dragStart(cell);
   fireEvent.dragEnd(cell);
   
   expect(table.state.table[1][1].isSelected()).toBe(true);
   rendered.unmount();*/
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


let mytable = new MyTable(
   {
      initialrows: 5,
      initialcols: 5
   });

test("Check first cell contents", () => {
   expect(mytable.state.table[0][0].getData()).toBe("0 0");
});
/*test("Check import csv", () => {
   
   let csv = "a, b \n c, d"

   let a = <MyTable/>;
   let c = render(a);
   let b = c.getByText("Import CSV from clipboard");
   fireEvent.click(b);
   mytable.testcsv(csv);
   //c.findAllby
   expect(mytable.state.table[1][1].getData()).toBe(" d");
   /*navigator.clipboard.writeText(csv).then(
      () =>{
         
      }
   );
});*/

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

