//import React from 'react'; // we need this to make JSX compile
import * as React from 'react';
import { findDOMNode } from 'react-dom';
import './MyTable.css';

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
    mergedcells: Map<string, string[]>;
    refdict: Map<string, React.RefObject<SVGCell>>; //Probably a better way to do this.
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
        }
    }
    toString() {
        return (this.x.toString() + " " + this.y.toString());
    }
    equals(p: TablePoint) {
        return (this.x === p.x && this.y === p.y);
    }
}

class CellDetails {
    public p: TablePoint;
    private hidden: boolean = false;
    private editing: boolean = true;
    private selected: boolean = false;
    private mergeroot: string = "";
    private data: string;
    private width: number;
    private height: number;
    constructor(p: TablePoint, width: number, height: number) {
        this.p = p;
        this.data = p.toString();
        this.width = width;
        this.height = height;
    }
    public merge(p: TablePoint) {
        this.mergeroot = p.toString();
    }
    public getWidth() {
        if (this.mergeroot === this.p.toString() || this.mergeroot == "") {
            let canvas = document.createElement('canvas'),
                context = canvas.getContext('2d');
            let lines = this.data.split("\n");
            let largestwidth = 0;

            for (let i = 0; i < lines.length; i++) {
                let width = context?.measureText(lines[i])!.width! * 1.75;
                if (width > largestwidth) {
                    largestwidth = width;
                }
            }
            return largestwidth;
        } else {
            return 0;
        }
        
    }
    public getHeight() {
        let lines = this.data.split("\n");
    }
    public setData() {

    }
}

class MyTable extends React.Component<Props, TableState> {
    constructor(props: Props) {
        super(props);
        this.addRow = this.addRow.bind(this);
        this.addCol = this.addCol.bind(this);
        this.state = { table: [], rows: 5, cols: 5, mincellheight: 40, mincellwidth: 50, dividerpixels: 5, colwidths: [], rowheights: [], selectedcells: new Set<string>(), mergedcells: new Map<string, string[]>(), refdict: new Map<string, React.RefObject<SVGCell>>()};
        this.testPopulateTable();
    }
    private testPopulateTable() {
        for (let i = 0; i < this.state.rows; i++) {
            let row:string[] = [];
            for (let j = 0; j < this.state.cols; j++) {
                let p = new TablePoint(i, j);
                row.push(p.toString());
                this.state.refdict.set(p.toString(), React.createRef());
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
            let p = new TablePoint(this.state.rows, j);
            this.state.refdict.set(p.toString(), React.createRef());
            row.push(p.toString());
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
            let p = new TablePoint(i, this.state.cols);
            this.state.refdict.set(p.toString(), React.createRef());
            newtable[i].push(p.toString());
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

            let p = new TablePoint(i, col);
            let merge = this.cellIsMerged(p);
            console.log(merge);
            if (merge === "" || p.toString() === merge) { //checks if the data can be seen or is hidden by merge.
                for (let j = 0; j < lines.length; j++) {
                    let width = this.checkTextSize(data)!.width * 1.75;
                    if (width > largestwidth) {
                        largestwidth = width;
                    }
                }
            } else {
                console.log("yay");
            }
        }
        if (largestwidth < currentwidth) {
            if (largestwidth < this.state.mincellwidth) {
                return this.state.mincellwidth;
            } else {
                return largestwidth;
            }
        } else {
            return -1;
        }
    }
    private selectCell(p: TablePoint) {
        let setcopy = new Set(this.state.selectedcells);
        setcopy.add(p.toString());
        this.setState({ selectedcells: setcopy });    }
    private deselectCell(p: TablePoint) {
        let setcopy = new Set(this.state.selectedcells);
        //console.log(setcopy);
        setcopy.delete(p.toString());
        this.setState({ selectedcells: setcopy });
        //console.log(this.state.selectedcells);
    }

    //NEED TO DO CHECKS/VALIDATION HERE
    private mergeCells() {
        if (this.state.selectedcells.size > 1) {
            let xmin = 1000;
            let ymin = 1000;
            let xmax = 0;
            let ymax = 0;

            let selectedcells = Array.from(this.state.selectedcells);
            let commonmerges = new Set<string>(); //The merges that the selectedcells are currently a part of.
            selectedcells.forEach(
                (item) => {
                    let p = new TablePoint(undefined, undefined, item);
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
                    let mergeroot = this.cellIsMerged(p);
                    if (mergeroot !== "") {
                        commonmerges.add(mergeroot);
                    }
                });
            if (commonmerges.size !== 0) { //Select the cells from the contained merges then deletes those merges and calls the function again to incorporate them into the new merge.
                let commonmergearray = Array.from(commonmerges);
                commonmergearray.forEach(
                    (item) => {
                        this.state.selectedcells.add(item);
                        let children = this.state.mergedcells.get(item);
                        children?.forEach(
                            (child) => {
                                this.state.selectedcells.add(child);
                            })
                        this.state.mergedcells.delete(item);
                    })
                this.mergeCells();
            } else {
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

                //Deselects the cell components.
                let t = Array.from(this.state.selectedcells);
                t.forEach(
                    (item) => {
                        let k = this.state.refdict.get(item)!.current;
                        if (k !== null) {
                            k!.deselectCell();
                        }
                    });

                this.setState({ mergedcells: newmergedcells, selectedcells: new Set<string>() });

                this.minimiseAllColumnWidths();
                //Adjust column widths.
                
                /*t.forEach(
                    (item) => {
                        let p = new TablePoint(undefined, undefined, item);
                        let w = this.minimiseColWidth(p.y);
                        if (w !== -1) {
                            newcolwidths[p.y] = w;
                        }
                    });*/
                
            }
        }
    }
    private minimiseAllColumnWidths() {
        let newcolwidths = this.state.colwidths.map((x) => x);
        for (let i = 0; i < newcolwidths.length; i++) {
            let newwidth = this.minimiseColWidth(i);
            if (newwidth !== -1) {
                newcolwidths[i] = newwidth;
            }
        }
        this.setState({ colwidths: newcolwidths });
    }
    private splitCells() {
        let t = Array.from(this.state.selectedcells);
        let newmergedcells = new Map<string, string[]>(this.state.mergedcells);
        t.forEach(
            (item) => {
                let p = new TablePoint(undefined, undefined, item);
                let merge = this.cellIsMerged(p);
                if (merge !== "") {
                    newmergedcells.delete(merge);
                }
                let k = this.state.refdict.get(item)!.current;
                if (k !== null) {
                    k!.deselectCell();
                }
            });
        this.setState({ mergedcells: newmergedcells, selectedcells: new Set<string>() });
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
    //Returns the root cell if the cell is part of a merge.
    private cellIsMerged(p: TablePoint) {
        let pointstr = p.toString();
        let merged = "";
        this.state.mergedcells.forEach((value: string[], key: string) => {
            if (pointstr === key) {
                merged = key;
            }
            if (value.includes(pointstr)) {
                merged = key;
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
            cols.add(p.x);
            rows.add(p.y);
            cells?.forEach(
                (item) => {
                    let point = new TablePoint(undefined, undefined, item);
                    cols.add(point.x);
                    rows.add(point.y);
                })
            width = 0;
            height = 0;
            rows.forEach(
                (item) => {
                    width += this.state.colwidths[item];
                })
            cols.forEach(
                (item) => {
                    height += this.state.rowheights[item];
                })
            width += ((rows.size - 1) * this.state.dividerpixels);
            height += ((cols.size - 1) * this.state.dividerpixels);
        }
        return [width, height];
    }
    private drawCell(x: number, y: number, data: string) {
        let p = new TablePoint(x, y);

        if (this.cellIsMerged(p) !== "") {
            let dimensions = this.getMergeDetails(p);
            let width = dimensions[0];
            let height = dimensions[1];
            if (width !== -1) {
                return (
                    <SVGCell
                        ref={this.state.refdict.get(p.toString())}
                        key={p.toString()}
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
                    ref={this.state.refdict.get(p.toString())}
                    key={p.toString()}
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
                                {/*
                                    innerArray.map(
                                        (item, j) =>
                                            <td key={i + "," + j}>
                                                <Cell data={item} x={i} y={j} changeData={(p: TablePoint, data: string) => this.modifyCellData(p, data)} />
                                            </td>
                                    )
                                */}
                            </tr>
                        ))}
                    </tbody>
                </table>

                <br/>
                <h2>LaTeX</h2>
                {this.convertToLatex()}
            </div>
            );
    }
    public render() {
        return (
            <div className="table-div">
                <h2>Table</h2>
                <div className="table-buttons-div"><button type="button" onClick={() => this.addRow()}>Add Row</button>
                    <button className="table-buttons" type="button" onClick={() => this.addCol()}>Add Column</button>
                    <button className="table-buttons" type="button" onClick={() => this.mergeCells()}>Merge Selected Cells</button>
                    <button className="table-buttons" type="button" onClick={() => this.splitCells()}>Split Selected Cells</button>
                </div>
                
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
    public deselectCell() {
        if (this.state.selected) {
            this.setState({ selected: false });
            this.changeBackgroundColour("grey");
        }
    }
    private toggleEditMode() {
        this.setState({ editing: !this.state.editing });
    }
    private clickCell(e: React.MouseEvent<SVGGElement, MouseEvent>) { //Should check if can be selected.
        if (!this.state.selected) {
            this.changeBackgroundColour("red");
            this.props.selectcell(this.props.p);
        } else {
            this.changeBackgroundColour("grey"); 
            this.props.deselectcell(this.props.p);
        }
        this.setState({ selected: !this.state.selected });
    }
    private changeBackgroundColour(colour: string) {
        let k = this.ref!;
        let j = k.current!;
        let rect = j.children[0] as React.SVGProps<SVGRectElement>;
        rect.style!.fill = colour;
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