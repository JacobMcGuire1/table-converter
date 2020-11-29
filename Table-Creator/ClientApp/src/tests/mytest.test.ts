import MyTable from "../components/MyTable";
import { render } from "@testing-library/react";
import * as React from 'react';



test('basic', () => {
    expect(1).toBe(1);
    const { } = render(<MyTable/>);
});
