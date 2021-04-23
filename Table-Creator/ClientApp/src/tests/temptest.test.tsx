import MyTable  from "../components/MyTable";
import { parseLatexTable } from "../components/ParseLatexTable";
import Props  from "../components/MyTable";
import { render, fireEvent, waitForElement, findByText, getByText, waitForElementToBeRemoved, getByTestId } from "@testing-library/react";
import * as React from 'react';
import { mount, shallow, configure } from 'enzyme'
//import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import Adapter from 'enzyme-adapter-react-16';

import { createShallow, createMount } from '@material-ui/core/test-utils';

configure({ adapter: new Adapter() });



test("Check AddRow", () => {
    //let mount = createMount();
    let shallow = createShallow();
    let wrapper = shallow(<MyTable/>);
    let table = wrapper.instance() as MyTable;
    
    wrapper.update();
    table.setState({topmenutab: 2});

    let addrowbutton = wrapper.find('#addrowbutton');
    addrowbutton.simulate("click");
 
    let cell = wrapper.find('td[id="5 1"]');
    console.log(cell.debug());
    expect(cell).toBeTruthy();

    
  });


test("Simple table", () => {
  

  
});