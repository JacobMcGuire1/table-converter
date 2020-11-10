//import React from 'react'; // we need this to make JSX compile
import * as React from 'react';

type Props = {
    foo: string;
}

type TableState = {
    table: string[][];
    rows: number;
    cols: number;
    mincellheight: number;
    mincellwidth: number;
    dividerpixels: number;
    colwidths: number[];
    rowheights: number[];
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
        this.state = { table: [], rows: 5, cols: 5, mincellheight: 50, mincellwidth: 150, dividerpixels: 5, colwidths: [], rowheights: []};
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
        for (let i = 0; i < this.state.rows; i++) { //Must change this if we initialise table with data.
            this.state.rowheights.push(this.state.mincellheight);
        }
        for (let i = 0; i < this.state.cols; i++) { //Must change this if we initialise table with data.
            this.state.colwidths.push(this.state.mincellwidth);
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

        let lines = data.split("\n");
        let largestwidth = 0;
        for (let i = 0; i < lines.length; i++) {
            //document.measureText(lines[i]);
            let width = this.checkTextSize(data)!.width * 1.75;
            if (width > largestwidth) {
                largestwidth = width;
            }
        }
;
        if (largestwidth > this.state.colwidths[y]) {
            let newcolwidths = this.state.colwidths.map((x) => x);
            newcolwidths[y] = largestwidth;
            this.setState({ table: newtable, colwidths: newcolwidths });
            //console.log(this.state.colwidths.toString());
        } else {
            if (largestwidth < this.state.colwidths[y]) {
                let newcolwidth = this.adjustColWidth(y);
                if (newcolwidth !== -1) {
                    let newcolwidths = this.state.colwidths.map((x) => x);
                    if (newcolwidth > this.state.mincellwidth) {
                        newcolwidths[y] = newcolwidth;
                    } else {
                        newcolwidths[y] = this.state.mincellwidth;
                    }
                    this.setState({ table: newtable, colwidths: newcolwidths });
                } else {
                    this.setState({ table: newtable });
                }
            } else {
                this.setState({ table: newtable });
            }
        } 
    }
    private adjustColWidth(col: number) {
        let currentwidth = this.state.colwidths[col];
        let largestwidth = 0;
        for (let i = 0; i < this.state.rows; i++) {
            let data = this.state.table[i][col];
            let lines = data.split("\n");
            for (let j = 0; j < lines.length; j++) {
                let width = this.checkTextSize(data)!.width * 1.75;
                if (width > largestwidth) {
                    largestwidth = width;
                }
            }
        }
        if (largestwidth < currentwidth) {
            return largestwidth;
        } else {
            return -1;
        }
    }
    private checkTextSize(text: string) {
        var canvas = document.createElement('canvas'),
            context = canvas.getContext('2d');
        return context?.measureText(text);
    }
    private resizeRow(width: number, height: number) {

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
        }
        
        let bs = "\\";
        let cu1 = "{";
        let cu2 = "}";

        return (
            <div>
                    {bs}begin{cu1}center{cu2}
                    <br/>
                    {bs}begin{cu1}tabular{cu2}{cu1}{collatex}{cu2}
                    <br/>
                    {latextable.map((x) => <div key={x}>{x}</div>)}
                    {bs}end{cu1}tabular{cu2}
                    <br/>
                    {bs}end{cu1}center{cu2}
            </div>
            );
    }
    private drawTable() {        
        return (
            <div>
                <svg width={this.state.colwidths.reduce((a, b) => a + b, 0) + (this.state.dividerpixels * this.state.cols)} height={this.state.rowheights.reduce((a, b) => a + b, 0) + (this.state.dividerpixels * this.state.rows)} id="svg">
                    {this.state.table.map((innerArray, x) => (
                        innerArray.map(
                            (item, y) =>
                                <SVGCell
                                    data={item}
                                    x={x}
                                    y={y}
                                    xpixel={(this.state.colwidths.slice(0, y)).reduce((a, b) => a + b, 0) + (this.state.dividerpixels * (y)) /*xpixel={y * (this.state.mincellwidth + 10) /*Need to make these 2 count the heights/widths.*/}
                                    ypixel={x * (this.state.mincellheight + this.state.dividerpixels)}
                                    width={this.state.colwidths[y]}
                                    height={this.state.rowheights[x]}
                                    changeData={(x: number, y: number, data: string) => this.modifyCellData(x, y, data)}
                                    resizeRow={(width: number, height: number) => this.resizeRow(width, height)}
                                />
                        )
                    ))}
                </svg>

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

//Style stuff should be here too.
interface SVGCellProps {
    data: string
    x: number
    y: number
    xpixel: number
    ypixel: number
    width: number
    height: number
    changeData: Function
    resizeRow: Function
}

interface SVGCellState {
    editing: boolean
}

class SVGCell extends React.Component<SVGCellProps, SVGCellState> {
    private ref: React.RefObject<SVGGElement>;
    constructor(props: SVGCellProps) {
        super(props);
        this.state = { editing: false }
        this.ref = React.createRef()
        //this.state = { data: this.props.data };
    }
    private toggleEditMode() {
        this.setState({ editing: !this.state.editing });
    }
    private changeData(e: React.ChangeEvent<HTMLTextAreaElement>) {
        this.props.changeData(this.props.x, this.props.y, e.target.value);
    }
    private moveCursorToEnd(e: React.FocusEvent<HTMLTextAreaElement>) {
        let value = e.target.value;
        e.target.value = "";
        e.target.value = value;
    }

    private getText() {
        if (!this.state.editing) {
            return (
                <text x={this.props.xpixel + this.props.width / 2} y={this.props.ypixel + 20} textAnchor={"middle" } alignmentBaseline={"central"/* Should let user choose alignment*/}>{this.props.data}</text>
            );
        } else {
            return (
                <foreignObject x={this.props.xpixel} y={this.props.ypixel} width={this.props.width} height={this.props.height}>
                    <div>
                        <textarea onChange={(e) => this.changeData(e)} value={this.props.data} autoFocus={true} onBlur={() => this.toggleEditMode()} onFocus={(e) => this.moveCursorToEnd(e)} />
                    </div>
                </foreignObject>
            );
        }
    }
    componentDidUpdate() {
        let k = this.ref!;
        let j = k.current!;
        
        if (!this.state.editing) {
            //console.log(this.props.x.toString() + this.props.y.toString() + "dwad" + text.scrollWidth);
            let text = j.children[1] as React.SVGProps<SVGTextElement>;
            //text.
        }
        
        //console.log(text.clientWidth);
        //if (text is )
    }
    public render() {
        return (
            <g onDoubleClick={() => this.toggleEditMode()} id={"cell:" + this.props.xpixel.toString() + this.props.ypixel.toString()} ref={this.ref}>
                <rect x={this.props.xpixel} y={this.props.ypixel} width={this.props.width} height={this.props.height} fill="grey" />
                {this.getText()}
            </g>
        );
    }
}