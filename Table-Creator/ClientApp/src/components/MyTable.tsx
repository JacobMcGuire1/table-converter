//import React from 'react'; // we need this to make JSX compile
import * as React from 'react';

type Props = {
    foo: string;
}

type TableState = {
    table: string[][];
    rows: number;
    cols: number;
}

function escapeLatex(str: string){
    str = str.split("\\").join("\\textbackslash");
    str = str.split("&").join("\\&");
    return str;
}

class MyTable extends React.Component<Props, TableState> {
    constructor(props: Props) {
        super(props);
        this.addRow = this.addRow.bind(this);
        this.addCol = this.addCol.bind(this);
        this.state = { table: [], rows: 5, cols: 5 };
        this.testPopulateTable();
    }
    private testPopulateTable() {
        for (let i = 0; i < this.state.rows; i++) {
            let row:string[] = [];
            for (let j = 0; j < this.state.cols; j++) {
                row.push((i * j).toString());
            }
            this.state.table.push(row)
        }
    }
    private addRow() {
        this.setState({ rows: this.state.rows + 1 });
        let newtable = this.state.table.map((x) => x);
        let row: string[] = [];
        for (let j = 0; j < this.state.cols; j++) {
            row.push("");
        }
        newtable.push(row);
        this.setState({ table: newtable });
    }
    private addCol() {
        this.setState({ cols: this.state.cols + 1 })
        let newtable = this.state.table.map((x) => x);
        for (let i = 0; i < this.state.rows; i++) {
            newtable[i].push("");
        }
        this.setState({ table: newtable });
    }
    private modifyCellData(x: number, y: number, data: string) {
        let newtable = this.state.table.map((x) => x);
        newtable[x][y] = data;
        this.setState({ table: newtable });
    }
    private convertToLatex() {
        

        let collatex = "|";
        for (let i = 0; i < this.state.cols; i++) {
            collatex = collatex + "c|";
        }

        let latextable = [];
        for (let i = 0; i < this.state.rows; i++) {
            let row = this.state.table[i];
            let rowlatex = ""
            row.forEach((x) => rowlatex = rowlatex + escapeLatex(x) + " & "); /* Escapes & characters and backslashes */ 
            rowlatex = rowlatex.slice(0, -3);
            rowlatex = rowlatex + " \\\\";
            latextable.push(rowlatex);
            console.log(rowlatex);
        }
        
        let bs = "\\";
        let cu1 = "{";
        let cu2 = "}";

        return (
            <div>
                    {bs}begin{cu1}center{cu2}
                    <br/>
                    {bs}begin{cu1}tabular{cu2}{cu1}{collatex}{cu2}
                    <br />
                    {latextable.map((x) => <div>{x}</div>)}
                    {bs}end{cu1}tabular{cu2}
                    <br/>
                    {bs}end{cu1}center{cu2}
            </div>
            );
    }
    private drawTable() {        
        return (
            <div>
                <table>
                    <tbody>
                        {this.state.table.map((innerArray, i) => (
                            <tr key={i}>
                                {
                                    innerArray.map(
                                        (item, j) =>
                                            <td key={i + "," + j}>
                                                <Cell data={item} x={i} y={j} changeData={(x: number, y: number, data: string) => this.modifyCellData(x, y, data)} />
                                            </td>
                                    )
                                }
                            </tr>
                        ))}
                    </tbody>
                </table>

                <br/>
                LaTeX:
                <br/>
                {this.convertToLatex()}
            </div>
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
    x: number
    y: number
    changeData: Function
}

/*type CellState = {
    data: string
}*/


class Cell extends React.Component<CellProps, {}> {
    constructor(props: CellProps) {
        super(props);
        this.state = { data: this.props.data };
    }
    private changeData(e: React.ChangeEvent<HTMLTextAreaElement>) {
        this.props.changeData(this.props.x, this.props.y, e.target.value);
    }
    public render() {
        return (
            <div>
                <textarea onChange={(e) => this.changeData(e)} value={this.props.data}/>
            </div>
        );
    }
}