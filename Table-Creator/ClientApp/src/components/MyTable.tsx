//import React from 'react'; // we need this to make JSX compile
import * as React from 'react';
import { findDOMNode } from 'react-dom';
import './MyTable.css';

type Props = {
    foo: string;
}

type TableState = {
    table: CellDetails[][];
    mincellheight: number;
    mincellwidth: number;
    dividerpixels: number;
}

function escapeLatex(str: string){
    str = str.split("\\").join("\\textbackslash");
    str = str.split("&").join("\\&");
    return str;
}


class TablePoint {
    public row: number;
    public col: number;
    constructor(row?: number, col?: number, p?: string) {
        if (p === undefined) {
            if (row !== undefined) {
                this.row = row!;
                this.col = col!;
            } else {
                this.row = 0;
                this.col = 0;
            }
        } else {
            let points = p!.split(" ");
            this.row = parseInt(points[0]);
            this.col = parseInt(points[1]);
        }
    }
    toString() {
        return (this.row.toString() + " " + this.col.toString());
    }
    equals(p: TablePoint) {
        return (this.row === p.row && this.col === p.col);
    }
}

class CellDetails {
    public p: TablePoint;
    private hidden: boolean = false;
    private editing: boolean = true;
    private selected: boolean = false;
    private mergeroot: string = "";
    private mergechildren: string[] = [];
    private data: string = "";
    public width: number = 0;
    public height: number = 0;
    constructor(p: TablePoint) {
        this.p = p;
        this.setData(p.toString());
    }
    public isSelected() {
        return this.selected;
    }
    public select() {
        this.selected = true;
    }
    public deselect() {
        this.selected = false;
    }
    public getMergeRoot() {
        return this.mergeroot;
    }
    public getMergeChildren() {
        return this.mergechildren;
    }
    public unMerge() {
        this.mergeroot = "";
        this.mergechildren = [];
        this.hidden = false;
    }
    public mergeAsChild(root: string) {
        this.mergeroot = root;
        this.mergechildren = [];
        this.hidden = true;
    }
    public mergeAsRoot(children: string[]) {
        this.mergeroot = this.p.toString();
        this.mergechildren = children;
        this.hidden = false;
    }
    public enableEdit() {
        this.editing = true;
    }
    public disableEdit() {
        this.editing = false;
    }
    private getTextWidth(): number {
        if (this.isVisible()) {
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
            return -1;
        }
    }
    public getData(): string {
        return this.data;
    }
    private getTextHeight(): number {
        let lines = this.data.split("\n");
        return this.height;
    }
    public setData(data: string) {
        this.data = data;
        this.width = this.getTextWidth();
        this.height = this.getTextHeight();
    }
    public copy(): CellDetails {
        return Object.assign({}, this);
    }
    public isVisible() {
        return (this.mergeroot === this.p.toString()) || (this.mergeroot === "");
    }
    private calculateWidth(colwidths: number[], horizontaldividersize: number) {
        if (this.mergeroot === this.p.toString()) {
            let colset = new Set<number>();
            colset.add(this.p.col);
            this.mergechildren.forEach(
                (item) => {
                    let p = new TablePoint(undefined, undefined, item);
                    colset.add(p.col);
                });
            let width = 0;
            colset.forEach(x => width = colwidths[x] + width + horizontaldividersize);
            width = width - horizontaldividersize;
            return width;
        }
        return colwidths[this.p.col];
    }
    private calculateHeight(rowheights: number[], verticaldividersize: number) {
        if (this.mergeroot === this.p.toString()) {
            let rowset = new Set<number>();
            rowset.add(this.p.row);
            this.mergechildren.forEach(
                (item) => {
                    let p = new TablePoint(undefined, undefined, item);
                    rowset.add(p.row);
                });
            let height = 0;
            rowset.forEach(x => height = rowheights[x] + height + verticaldividersize);
            height = height - verticaldividersize;
            return height;
        }
        return rowheights[this.p.row];
    }
    public draw(xpixel: number, ypixel: number, colwidths: number[], rowheights: number[], horizontaldividersize: number, verticaldividersize: number, changeData: Function, selectCell: Function, deSelectCell: Function, enableEditMode: Function, disableEditMode: Function) {
        if (this.isVisible()) {
            return (
                <SVGCell
                    key={this.p.toString()}
                    cell={this}
                    xpixel={xpixel}//{(this.state.colwidths.slice(0, y)).reduce((a, b) => a + b, 0) + (this.state.dividerpixels * (y)) /*xpixel={y * (this.state.mincellwidth + 10) /*Need to make these 2 count the heights/widths.*/}
                    ypixel={ypixel}//{ x * (this.state.mincellheight + this.state.dividerpixels) }
                    width={this.calculateWidth(colwidths, horizontaldividersize)}
                    height={this.calculateHeight(rowheights, verticaldividersize)}
                    changeData={changeData}//{(p: TablePoint, data: string) => this.modifyCellData(p, data)}
                    selectcell={selectCell}//{(p: TablePoint) => this.selectCell(p)}
                    deselectcell={deSelectCell}// {(p: TablePoint) => this.deselectCell(p)}
                    enableedit={enableEditMode}
                    disableedit={disableEditMode}
                    selected={this.selected}
                    editing={this.editing}
                />
            );
        }
    }
}

class MyTable extends React.Component<Props, TableState> {
    constructor(props: Props) {
        super(props);
        this.addRow = this.addRow.bind(this);
        this.addCol = this.addCol.bind(this);
        this.state = { table: [], mincellheight: 40, mincellwidth: 50, dividerpixels: 5 };
        this.testPopulateTable();
    }
    private testPopulateTable() {
        for (let row = 0; row < 5; row++) {
            let rowarray: CellDetails[] = [];
            for (let col = 0; col < 5; col++) {
                let cell = new CellDetails(new TablePoint(row, col));
                rowarray.push(cell);
            }
            this.state.table.push(rowarray);
        }
    }
    private getRowCount(): number {
        return this.state.table.length;
    }
    private getColCount(): number {
        return this.state.table[0].length;
    }
    private getRow(row: number): CellDetails[] {
        return this.state.table[row];
    }
    private getCol(col: number): CellDetails[] {
        let colarray = [];
        for (let row = 0; row < this.getRowCount(); row++) {
            colarray.push(this.state.table[row][col])
        }
        return colarray;
    }
    private getColWidth(col: number): number { //Doesn't account for merged cells.
        let colarray = this.getCol(col);
        let widths = colarray.map(x => x.width);
        let largestwidth = widths.reduce(function (a, b) {
            return Math.max(a, b);
        });
        if (this.state.mincellwidth > largestwidth) return this.state.mincellwidth;
        return largestwidth;
    }
    private getRowHeight(row: number): number { //Doesn't account for merged cells.
        let rowarray = this.getRow(row);
        let heights = rowarray.map(x => x.height);
        let largestheight = heights.reduce(function (a, b) {
            return Math.max(a, b);
        });
        if (this.state.mincellheight > largestheight) return this.state.mincellheight;
        return largestheight;
    }
    private addRow() {
        let newtable = this.state.table.map((x) => x);
        let row: CellDetails[] = [];
        for (let col = 0; col < this.getColCount(); col++) {
            let cell = new CellDetails(new TablePoint(this.getRowCount(), col)); //May need to add 1 to getrowcount()
            row.push(cell);
        }
        newtable.push(row);
        this.setState({ table: newtable });
    }
    private addCol() {
        let newtable = this.state.table.map((x) => x);
        let colcount = this.getColCount();
        for (let row = 0; row < this.getRowCount(); row++) {
            let cell = new CellDetails(new TablePoint(row, colcount));
            console.log(cell.p.toString());
            newtable[row].push(cell);
        }
        this.setState({ table: newtable });
    }
    private modifyCellData(cell: CellDetails, data: string) {
        let newtable = this.state.table.map((x) => x);
        cell.setData(data);
        this.setState({ table: newtable });
    }
    private selectCell(cell: CellDetails) {
        let newtable = this.state.table.map((x) => x);
        cell.select();
        this.setState({ table: newtable });
    }
    private deselectCell(cell: CellDetails) {
        let newtable = this.state.table.map((x) => x);
        cell.deselect();
        this.setState({ table: newtable });
    }
    private getSelectedCells() {
        let selectedcells = [];
        for (let row = 0; row < this.getRowCount(); row++) {
            for (let col = 0; col < this.getColCount(); col++) {
                let cell = this.state.table[row][col];
                if (cell.isSelected()) {
                    selectedcells.push(cell);
                }
            }
        }
        return selectedcells;
    }
    private mergeCells() {
        let selectedcells = this.getSelectedCells();
        if (selectedcells.length <= 1) return;

        let minrow = Infinity;
        let mincol = Infinity;
        let maxrow = 0;
        let maxcol = 0;

       
        selectedcells.forEach(
            (item) => {
                let p = item.p;
                if (p.row < minrow) {
                    minrow = p.row;
                }
                if (p.row > maxrow) {
                    maxrow = p.row;
                }
                if (p.col < mincol) {
                    mincol = p.col;
                }
                if (p.col > maxcol) {
                    maxcol = p.col;
                }
            });
        /*if (recurse) {
            this.mergeCells();
        }*/
        /*selectedcells.forEach(
            (item) => {
                item.deselect();
            });*/

        /*let mergeroot = item.getMergeRoot();
        if (mergeroot !== "") {
            let rootpoint = new TablePoint(undefined, undefined, mergeroot);
            let rootcell = this.state.table[rootpoint.row][rootpoint.col];
            if (!rootcell.isSelected()) recurse = true;
            rootcell.select();
            let children = rootcell.getMergeChildren();
            children.forEach(
                (item2) => {
                    let childpoint = new TablePoint(undefined, undefined, item2);
                    let childcell = this.state.table[childpoint.row][childpoint.col];
                    if (!childcell.isSelected()) recurse = true;
                    childcell.select();
                });
        }*/
        let recurse = false;
        let root = this.state.table[minrow][mincol];
        let children = [];
        for (let row = minrow; row <= maxrow; row++) {
            for (let col = mincol; col <= maxcol; col++) {
                let cell = this.state.table[row][col];
                if (!cell.p.equals(root.p)) {
                    children.push(cell);
                }

                //The following code ensures that any other contained merges are incorporated into this merge.
                if (!cell.isSelected()) recurse = true;
                cell.select();
                let cellchildren = cell.getMergeChildren();
                cellchildren.forEach(
                    (item2) => {
                        let childpoint = new TablePoint(undefined, undefined, item2);
                        let childcell = this.state.table[childpoint.row][childpoint.col];
                        if (!childcell.isSelected()) recurse = true;
                        childcell.select();
                    });
            }
        }

        if (recurse) { //Recurses if any other merges need to be included.
            this.mergeCells();
        } else {
            root.deselect();
            children.forEach(
                (item) => {
                    item.mergeAsChild(root.p.toString());
                    item.deselect();
                });

            let childrenstrings = children.map(x => x.p.toString());
            root.mergeAsRoot(childrenstrings);

            let newtable = this.state.table.map((x) => x);
            this.setState({ table: newtable });
        }
    }
    private splitCells() {
        let selectedcells = this.getSelectedCells();
        if (selectedcells.length === 0) return;
        let roots = new Set<string>();
        selectedcells.forEach(
            (item) => {
                if (item.getMergeRoot() !== "") {
                    roots.add(item.getMergeRoot());
                }
                item.deselect();
            });
        let rootsarray = Array.from(roots);
        rootsarray.forEach(
            (item) => {
                let p = new TablePoint(undefined, undefined, item);
                let cell = this.state.table[p.row][p.col];
                let children = cell.getMergeChildren();
                children.forEach(
                    (childitem) => {
                        let p2 = new TablePoint(undefined, undefined, childitem);
                        let childcell = this.state.table[p2.row][p2.col];
                        childcell.unMerge();
                    });
                cell.unMerge();
            });
        let newtable = this.state.table.map((x) => x);
        this.setState({ table: newtable });
    }
    //NEED TO DO CHECKS/VALIDATION HERE
    /*private mergeCells() {
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
                    if (p.row < xmin) {
                        xmin = p.row;
                    }
                    if (p.row > xmax) {
                        xmax = p.row;
                    }
                    if (p.col < ymin) {
                        ymin = p.col;
                    }
                    if (p.col > ymax) {
                        ymax = p.col;
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


            }
        }
    }*/
    /*private splitCells() {
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
    }*/
    private enableCellEdit(cell: CellDetails) {
        let newtable = this.state.table.map((x) => x);
        cell.enableEdit();
        this.setState({ table: newtable });
    }
    private disableCellEdit(cell: CellDetails) {
        let newtable = this.state.table.map((x) => x);
        cell.disableEdit();
        this.setState({ table: newtable });
    }
    private convertToLatex() {
        let collatex = "|";
        for (let col = 0; col < this.getColCount(); col++) {
            collatex = collatex + "c|";
        }

        let latextable = [];
        for (let row = 0; row < this.getRowCount(); row++) {
            let rowarray = this.state.table[row];
            let rowlatex = ""
            rowarray.forEach((x) => rowlatex = rowlatex + escapeLatex(x.getData()) + " & "); /* Escapes & characters and backslashes */
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
                <br />
                {bs}begin{cu1}tabular{cu2}{cu1}{collatex}{cu2}
                <br />
                {latextable.map((x, i) => <div key={i}>{x}</div>)}
                {bs}end{cu1}tabular{cu2}
                <br />
                {bs}end{cu1}center{cu2}
            </div>
        );
    }
    /*private getMergeDetails(p: TablePoint) {
        let width = -1;
        let height = -1;
        if (this.state.mergedcells.has(p.toString())) {
            //calculate width and height of merged cell.
            let cells = this.state.mergedcells.get(p.toString());
            let cols = new Set<number>();
            let rows = new Set<number>();
            cols.add(p.row);
            rows.add(p.col);
            cells?.forEach(
                (item) => {
                    let point = new TablePoint(undefined, undefined, item);
                    cols.add(point.row);
                    rows.add(point.col);
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
    }*/

    private drawTable() {
        let rowheights: number[] = [];
        let colwidths: number[] = [];
        for (let row = 0; row < this.getRowCount(); row++) {
            rowheights.push(this.getRowHeight(row));
        }
        for (let col = 0; col < this.getColCount(); col++) {
            colwidths.push(this.getColWidth(col));
        }
        let tablewidth = colwidths.reduce((a, b) => a + b, 0) + (this.state.dividerpixels * this.getColCount());
        let tableheight = rowheights.reduce((a, b) => a + b, 0) + (this.state.dividerpixels * this.getRowCount());

        return (
            <div>
                <svg width={tablewidth} height={ tableheight } id="svg">
                    {this.state.table.map((innerArray, row) => (
                        innerArray.map(
                            (cell, col) =>
                                cell.draw(
                                    (colwidths.slice(0, col)).reduce((a, b) => a + b, 0) + (this.state.dividerpixels * (col)),
                                    row * (this.state.mincellheight + this.state.dividerpixels),
                                    colwidths,
                                    rowheights,
                                    this.state.dividerpixels,
                                    this.state.dividerpixels,
                                    (cell: CellDetails, data: string) => this.modifyCellData(cell, data),
                                    (cell: CellDetails) => this.selectCell(cell),
                                    (cell: CellDetails) => this.deselectCell(cell),
                                    (cell: CellDetails) => this.enableCellEdit(cell),
                                    (cell: CellDetails) => this.disableCellEdit(cell)
                                )
                        )
                    ))}
                </svg>

                <br />
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


//Style stuff should be here too.
interface SVGCellProps {
    cell: CellDetails
    xpixel: number
    ypixel: number
    width: number
    height: number
    changeData: Function
    selectcell: Function
    deselectcell: Function
    enableedit: Function
    disableedit: Function
    selected: boolean
    editing: boolean
}

class SVGCell extends React.Component<SVGCellProps, {}> {
    constructor(props: SVGCellProps) {
        super(props);
    }
    /*public deselectCell() {
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
    }/*/
    private changeData(e: React.FormEvent<HTMLDivElement>) {
        //let data = this.ref2!.current?.firstChild?.textContent;
        let data = (e.target as HTMLDivElement).textContent;
        if (data != null) {
            this.props.changeData(this.props.cell, data);
        }
    }
    private getText() {
        if (!this.props.editing) {
            return (
                <text x={this.props.xpixel + this.props.width / 2} y={this.props.ypixel + 20} textAnchor={"middle" } alignmentBaseline={"central"}>{this.props.cell.getData()}</text>
            );
        } else {
            return (
                <foreignObject x={this.props.xpixel} y={this.props.ypixel} width={this.props.width} height={this.props.height}>
                    <div contentEditable={true} onBlur={() => this.props.disableedit(this.props.cell)} tabIndex={0} onInput={(e) => this.changeData(e)} suppressContentEditableWarning={true}>
                        {this.props.cell.getData()}
                    </div>
                </foreignObject>
            );
        }
    }
    private clickCell(e: React.MouseEvent<SVGGElement, MouseEvent>) {
        if (this.props.selected) {
            this.props.deselectcell(this.props.cell);
        } else {
            this.props.selectcell(this.props.cell);
        }
    }
    private getRectColour() {
        if (this.props.selected) {
            return "red";
        } else {
            return "grey"
        }
    }
    public render() {
        return (
            <g onDoubleClick={() => this.props.enableedit(this.props.cell)} onClick={(e) => this.clickCell(e)} id={"cell:" + this.props.cell.p.toString()}>
                <rect x={this.props.xpixel} y={this.props.ypixel} width={this.props.width} height={this.props.height} fill={this.getRectColour()}/>
                {this.getText()}
            </g>
        );
    }
}