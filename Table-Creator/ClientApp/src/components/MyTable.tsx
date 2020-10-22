//import React from 'react'; // we need this to make JSX compile
import * as React from 'react';

type Props = {
    foo: string;
}

type TableState = {
    table: Cell[][];
    rows: number;
    cols: number;
}

class MyTable extends React.Component<Props, TableState> {
    
    constructor(props: Props) {
        super(props);
        this.addRow = this.addRow.bind(this);
        this.addCol = this.addCol.bind(this);
        this.state = { table: [],rows: 5, cols: 5 };
        //this.table = null;
        //this.table = [];
    }
    private testPopulateTable() {
        for (let i = 0; i < this.state.rows; i++) {
            let row:Cell[] = [];
            for (let j = 0; j < this.state.cols; j++) {
                row.push(<Cell data={(i * j).toString()} /> as unknown as Cell);
            }
            this.state.table.push(row)
        }
        //this.table = newtable;
    }
    private addRow() {
        this.setState({ table: [] });
        this.setState({ rows: this.state.rows + 1 });
    }
    private addCol() {
        this.setState({ table: [] });
        this.setState({ cols: this.state.cols + 1 });
    }
    private drawTable() {
        this.testPopulateTable();
        return (
            <table>
                <tbody>
                    {this.state.table.map((innerArray, i) => (
                        <tr key={i}>
                            {innerArray.map((item, j) => <td key={(i + 1) * (j + 1)}>{item}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
            );
    }
    public render() {
        return (
            <div>
                <h1>Table:</h1>
                <button type="button" onClick={this.addRow}>Add Row</button>
                <button type="button" onClick={this.addCol}>Add Column</button>
                {this.drawTable()}
            </div>
        );
    }
}

export default MyTable;

interface CellProps {
    data: string
}


class Cell extends React.Component<CellProps, {}> {
    private data: string;
    constructor(props: CellProps) {
        super(props);
        this.data = this.props.data
    }
    public render() {
        return (
            <div>
                { this.data }
            </div>
        );
    }
}