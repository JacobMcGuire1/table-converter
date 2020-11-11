//import React from 'react'; // we need this to make JSX compile
import * as React from 'react';
import { findDOMNode } from 'react-dom';

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
    selectedcells: Set<string>;
    mergedcells: Map<string, string[]>
}

function escapeLatex(str: string){
    str = str.split("\\").join("\\textbackslash");
    str = str.split("&").join("\\&");
    return str;
}


class TablePoint {
    public x: number;
    public y: number;
    //constructor(x: number, y: number);
    //constructor(p: string);
    constructor(x?: number, y?: number, p?: string) {
        console.log(x);
        console.log(y);
        console.log(p);
        if (p === undefined) {
            if (x !== undefined) {
                this.x = x!;
                this.y = y!;
            } else {
                this.x = 0;
                this.y = 0;
            }
        } else {
            let points = p!.split(" ");
            this.x = parseInt(points[0]);
            this.y = parseInt(points[1]);
            console.log(this.x);
            console.log(this.y);
        }
    }
    toString() {
        return (this.x.toString() + " " + this.y.toString());
    }
    equals(p: TablePoint) {
        return (this.x === p.x && this.y === p.y);
    }
}

class MyTable extends React.Component<Props, TableState> {
    constructor(props: Props) {
        super(props);
        this.addRow = this.addRow.bind(this);
        this.addCol = this.addCol.bind(this);
        this.state = { table: [], rows: 5, cols: 5, mincellheight: 50, mincellwidth: 100, dividerpixels: 5, colwidths: [], rowheights: [], selectedcells: new Set<string>(), mergedcells: new Map<string, string[]>()};
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

        let newrowheights = this.state.rowheights.map((x) => x);
        newrowheights.push(this.state.mincellheight);

        this.setState({ table: newtable, rowheights: newrowheights });
    }
    private addCol() {
        this.setState({ cols: this.state.cols + 1 })
        let newtable = this.state.table.map((x) => x);
        for (let i = 0; i < this.state.rows; i++) {
            newtable[i].push("");
        }

        let newcolwidths = this.state.colwidths.map((x) => x);
        newcolwidths.push(this.state.mincellwidth);

        this.setState({ table: newtable, colwidths: newcolwidths });
    }
    private modifyCellData(p: TablePoint, data: string) {
        let newtable = this.state.table.map((x) => x);
        newtable[p.x][p.y] = data;

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
        if (largestwidth > this.state.colwidths[p.y]) {
            let newcolwidths = this.state.colwidths.map((x) => x);
            newcolwidths[p.y] = largestwidth;
            this.setState({ table: newtable, colwidths: newcolwidths });
            //console.log(this.state.colwidths.toString());
        } else {
            if (largestwidth < this.state.colwidths[p.y]) {
                let newcolwidth = this.minimiseColWidth(p.y);
                if (newcolwidth !== -1) {
                    let newcolwidths = this.state.colwidths.map((x) => x);
                    if (newcolwidth > this.state.mincellwidth) {
                        newcolwidths[p.y] = newcolwidth;
                    } else {
                        newcolwidths[p.y] = this.state.mincellwidth;
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
    //Returns the minimum width of the column that can display all of the data in it.
    private minimiseColWidth(col: number) {
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
    private selectCell(p: TablePoint) {
        let setcopy = new Set(this.state.selectedcells);
        setcopy.add(p.toString());
        console.log("Added an item: ");
        console.log(setcopy);
        this.setState({ selectedcells: setcopy });
        
    }
    private deselectCell(p: TablePoint) {
        let setcopy = new Set(this.state.selectedcells);
        //console.log(setcopy);
        setcopy.delete(p.toString());

        console.log("Deleted an item: ");
        console.log(setcopy);
        this.setState({ selectedcells: setcopy });
        //console.log(this.state.selectedcells);
    }

    //NEED TO DO CHECKS/VALIDATION HERE
    private mergeCells() {
        console.log("TEST");
        let xmin = 1000;
        let ymin = 1000;

        let xmax = 0;
        let ymax = 0;
        console.log(xmax);

        let t = Array.from(this.state.selectedcells);
        console.log(t);
        t.forEach(
            (item) => {
                let p = new TablePoint(undefined, undefined, item);

                console.log("TEST");
                console.log(p.toString());
                if (p.x < xmin) {
                    xmin = p.x;
                }
                if (p.x > xmax) {
                    xmax = p.x;
                }
                if (p.y < ymin) {
                    ymin = p.y;
                }
                if (p.y > ymax) {
                    ymax = p.y;
                }
            });
        let root = new TablePoint(xmin, ymin);
        let children = [];
        for (let x = xmin; x <= xmax; x++) {
            for (let y = ymin; y <= ymax; y++) {
                let p = new TablePoint(x, y);
                if (!p.equals(root)) {
                    children.push(p.toString());
                }
            }
        }
        //Need to deal with the current merges too.
        let newmergedcells = new Map<string, string[]>(this.state.mergedcells);
        newmergedcells.set(root.toString(), children);
        this.setState({ mergedcells: newmergedcells, selectedcells: new Set<string>()}); //NEeed toi also deselect the cells themselves.------------------------------------------------------------------------
    }
    private splitCells() {

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
                    {latextable.map((x, i) => <div key={i}>{x}</div>)}
                    {bs}end{cu1}tabular{cu2}
                    <br/>
                    {bs}end{cu1}center{cu2}
            </div>
            );
    }
    private cellIsMerged(p: TablePoint) {
        let pointstr = p.toString();
        let merged = false;
        this.state.mergedcells.forEach((value: string[], key: string) => {
            if (pointstr === key) {
                merged = true;
            }
            if (value.includes(pointstr)) {
                merged = true;
            }
        });
        return merged;
    }
    private getMergeDetails(p: TablePoint) {
        let width = -1;
        let height = -1;
        if (this.state.mergedcells.has(p.toString())) {
            //calculate width and height of merged cell.
            let cells = this.state.mergedcells.get(p.toString());
            let cols = new Set<number>();
            let rows = new Set<number>();
            cells?.forEach(
                (item) => {
                    let p = new TablePoint(undefined, undefined, item);
                    cols.add(p.x);
                    rows.add(p.y);
                })
            width = 0;
            height = 0;
            cols.forEach(
                (item) => {
                    width += this.state.colwidths[item];
                })
            rows.forEach(
                (item) => {
                    height += this.state.rowheights[item];
                })
            width += ((cols.size - 1) * this.state.dividerpixels);
            height += ((rows.size  - 1) * this.state.dividerpixels);
        }
        return [width, height];
    }
    private drawCell(x: number, y: number, data: string) {
        let p = new TablePoint(x, y);

        if (this.cellIsMerged(p)) {
            let dimensions = this.getMergeDetails(p);
            let width = dimensions[0];
            let height = dimensions[1];
            if (width !== -1) {
                return (
                    <SVGCell
                        key={x.toString() + "," + y.toString()}
                        data={data}
                        p={p}
                        xpixel={(this.state.colwidths.slice(0, y)).reduce((a, b) => a + b, 0) + (this.state.dividerpixels * (y)) /*xpixel={y * (this.state.mincellwidth + 10) /*Need to make these 2 count the heights/widths.*/}
                        ypixel={x * (this.state.mincellheight + this.state.dividerpixels)}
                        width={width}
                        height={height}
                        changeData={(p: TablePoint, data: string) => this.modifyCellData(p, data)}
                        selectcell={(p: TablePoint) => this.selectCell(p)}
                        deselectcell={(p: TablePoint) => this.deselectCell(p)}
                    />
                );
            }
            return; //Returns nothing if cell doesn't need to be drawn.
        } else {
            return (
                <SVGCell
                    key={x.toString() + "," + y.toString()}
                    data={data}
                    p={p}
                    xpixel={(this.state.colwidths.slice(0, y)).reduce((a, b) => a + b, 0) + (this.state.dividerpixels * (y)) /*xpixel={y * (this.state.mincellwidth + 10) /*Need to make these 2 count the heights/widths.*/}
                    ypixel={x * (this.state.mincellheight + this.state.dividerpixels)}
                    width={this.state.colwidths[y]}
                    height={this.state.rowheights[x]}
                    changeData={(p: TablePoint, data: string) => this.modifyCellData(p, data)}
                    selectcell={(p: TablePoint) => this.selectCell(p)}
                    deselectcell={(p: TablePoint) => this.deselectCell(p)}
                />
            );
        }
        
    }
    private drawTable() {        
        return (
            <div>
                <svg width={this.state.colwidths.reduce((a, b) => a + b, 0) + (this.state.dividerpixels * this.state.cols)} height={this.state.rowheights.reduce((a, b) => a + b, 0) + (this.state.dividerpixels * this.state.rows)} id="svg">
                    {this.state.table.map((innerArray, x) => (
                        innerArray.map(
                            (data, y) =>
                                this.drawCell(x, y, data)
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
                                                <Cell data={item} x={i} y={j} changeData={(p: TablePoint, data: string) => this.modifyCellData(p, data)} />
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
                <button type="button" onClick={() => this.addRow()}>Add Row</button>
                <button type="button" onClick={() => this.addCol()}>Add Column</button>
                <button type="button" onClick={() => this.mergeCells()}>Merge Selected Cells</button>
                <button type="button" onClick={() => this.splitCells()}>Split Selected Cells</button>
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
    p: TablePoint
    xpixel: number
    ypixel: number
    width: number
    height: number
    changeData: Function
    selectcell: Function
    deselectcell: Function
}

interface SVGCellState {
    editing: boolean
    selected: boolean
}

class SVGCell extends React.Component<SVGCellProps, SVGCellState> {
    private ref: React.RefObject<SVGGElement>;
    private ref2: React.RefObject<HTMLDivElement>;
    constructor(props: SVGCellProps) {
        super(props);
        this.state = { editing: false, selected: false }
        this.ref = React.createRef()
        this.ref2 = React.createRef()
        //this.state = { data: this.props.data };
    }
    private toggleEditMode() {
        this.setState({ editing: !this.state.editing });
    }
    private clickCell(e: React.MouseEvent<SVGGElement, MouseEvent>) { //Should check if can be selected.
        let k = this.ref!;
        let j = k.current!;
        let rect = j.children[0] as React.SVGProps<SVGRectElement>;

        
        if (!this.state.selected) {
            //console.log("Selecting...");
            rect.style!.fill = "red";
            this.props.selectcell(this.props.p);
        } else {
            //console.log("DeSelecting...");
            rect.style!.fill = "grey"; 
            this.props.deselectcell(this.props.p);
        }
        this.setState({ selected: !this.state.selected });
         
        
        
    }
    private changeData(e: React.ChangeEvent<HTMLTextAreaElement>) {
        this.props.changeData(this.props.p, e.target.value);
    }
    private moveCursorToEnd(e: React.FocusEvent<HTMLTextAreaElement>) {
        let value = e.target.value;
        e.target.value = "";
        e.target.value = value;
    }
    private changeData2(e: React.FormEvent<HTMLDivElement>) {
        //console.log(this.ref2!.current?.firstChild);
        let data = this.ref2!.current?.firstChild?.textContent;
        if (data != null) {
            this.props.changeData(this.props.p, data);
        }
    }
    private getText() {
        if (!this.state.editing) {
            return (
                <text x={this.props.xpixel + this.props.width / 2} y={this.props.ypixel + 20} textAnchor={"middle" } alignmentBaseline={"central"/* Should let user choose alignment*/}>{this.props.data}</text>
            );
        } else {
            return (
                <foreignObject x={this.props.xpixel} y={this.props.ypixel} width={this.props.width} height={this.props.height}>
                    <div contentEditable={true} onBlur={() => this.toggleEditMode()} tabIndex={0} ref={this.ref2} onInput={(e) => this.changeData2(e)} suppressContentEditableWarning={true}>
                        {this.props.data}
                        {/*<textarea onChange={(e) => this.changeData(e)} value={this.props.data} autoFocus={true} onBlur={() => this.toggleEditMode()} onFocus={(e) => this.moveCursorToEnd(e)} />*/}
                    </div>
                </foreignObject>
            );
        }
    }
    componentDidUpdate() {
        //ReactDOM.findDOMNode(this.refs.editdiv).focus();
        let k = this.ref!;
        let j = k.current!;
        
        if (!this.state.editing) {
            //console.log(this.props.x.toString() + this.props.y.toString() + "dwad" + text.scrollWidth);
            let text = j.children[1] as React.SVGProps<SVGTextElement>;
            //text.
        } else {
            //let text = j.children[1] as React.SVGProps<SVGTextElement>;
            //text.foc
            //let u = j.children[1].children[0] as React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
            //u.focus();
            //u.current
            let po = this.ref2!;
            po.current?.focus();
        }
        
        //console.log(text.clientWidth);
        //if (text is )
    }
    public render() {
        return (
            <g onDoubleClick={() => this.toggleEditMode()} onClick={(e) => this.clickCell(e)} id={"cell:" + this.props.xpixel.toString() + this.props.ypixel.toString()} ref={this.ref}>
                <rect x={this.props.xpixel} y={this.props.ypixel} width={this.props.width} height={this.props.height} fill="grey" />
                {this.getText()}
            </g>
        );
    }
}