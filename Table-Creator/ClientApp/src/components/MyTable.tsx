//import React from 'react'; // we need this to make JSX compile
import * as React from 'react';
//import { findDOMNode } from 'react-dom';
import './MyTable.css';
import { table } from 'table';
import { Drawer, Button, List, ListItem, ListItemIcon, ListItemText, Popover, AppBar, Tabs, Tab, Toolbar, TextField } from '@material-ui/core';
import { plainToClass, Type } from 'class-transformer';
import 'reflect-metadata';

let jsonstate = "";

var statestack: TableState[] = [];


type Props = {
}


type TableState = {
    table: CellDetails[][];
    mincellheight: number;
    mincellwidth: number;
    dividerpixels: number;
    horizontallines: boolean;
    selecting: boolean;
    startselectpoint: [number, number];
    endselectpoint: [number, number];
    bordermodify: [boolean, boolean, boolean, boolean];
    newtableform: [number, number];
    changedatafield: string;
    tab: number;
}

function escapeLatex(str: string){
    str = str.split("\\").join("\\textbackslash");
    str = str.split("&").join("\\&");
    return str;
}

//Stolen 
function escapeHTML(str: string) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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
    @Type(() => TablePoint)
    public p: TablePoint;
    private hidden: boolean = false;
    private editing: boolean = false;
    private selected: boolean = false;
    private mergeroot: string = "";
    private mergechildren: string[] = [];
    private data: string = "";
    private backgroundcolour: string = "";
    private borderstyle: string = "solid";
    private bordercolour: string = "#000000";
    public width: number = 0;
    public height: number = 0;
    public csstextalign: string = "center";
    public borders: [boolean, boolean, boolean, boolean] = [true, true, true, true]; //T R B L

    constructor(p: TablePoint) {
        this.p = p;
        if (p !== undefined) this.setData(p.toString());
        
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
        this.width = this.getTextWidth();
        this.height = this.getTextHeight();
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
        this.width = this.getTextWidth();
        this.height = this.getTextHeight();
    }
    public enableEdit() {
        this.editing = true;
    }
    public disableEdit() {
        this.editing = false;
    }
    public setBackgroundColour(chosencolour: string) {
        this.backgroundcolour = chosencolour;
    }
    public setBorderColour(chosencolour: string) {
        this.bordercolour = chosencolour;
    }
    public setBorderStyle(style: string) {
        this.borderstyle = style;
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
    public getMergeSize(): number[] {
        if (this.mergechildren === []) return [-1, -1];
        let mincol = this.p.col;
        let maxcol = this.p.col;
        let minrow = this.p.row;
        let maxrow = this.p.row;
        this.mergechildren.forEach(
            (item) => {
                let p = new TablePoint(undefined, undefined, item);
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
        return [maxrow - minrow, maxcol - mincol];
    }
    private getLatexBackgroundColour() {
        if (this.backgroundcolour === "") return "";
        return "\\cellcolor[HTML]{" + this.backgroundcolour.replace('#', '').toUpperCase() + "}";
    }
    public getLatex(leftmergecells: any): string {
        let data = this.getLatexBackgroundColour() + escapeLatex(this.getData());
        let LRborders = [this.borders[3] ? "|" : " ", this.borders[1] ? "|" : " "];

        

        //If it's a normal unmerged cell.
        if (this.mergeroot === "") {
            data = "\\multicolumn{1}{" + LRborders[0] + this.csstextalign.charAt(0) + LRborders[1] + "}{" + data + "}";
            return data + " &";
        }
        //If it's the root cell of a group of merged cells.
        if (this.mergeroot === this.p.toString()) {
            let size = this.getMergeSize();
            let h = size[0];
            let w = size[1];
            if (w === 0) {
                let result = "\\multicolumn{1}{" + LRborders[0] + this.csstextalign.charAt(0) + LRborders[1] + "}{" + "\\multirow{" + (h + 1).toString() + "} {*} {" + data + "}}  &";
                return  result;
            }
            if (h === 0) {
                return "\\multicolumn{" + (w + 1).toString() + "}{" + LRborders[0] + this.csstextalign.charAt(0) + LRborders[1] + "}{" + data + "} &";
            }
            return "\\multicolumn{" + (w + 1).toString() + "}{" + LRborders[0] + this.csstextalign.charAt(0) + LRborders[1] + "}{" + "\\multirow{" + (h + 1).toString() + "} {*} {" + data + "}" + "} &";
        }
        //return "THIS CELL SHOULD NOT BE DISPLAYED";
        let rootp = new TablePoint(undefined, undefined, this.mergeroot);
        if (this.p.row > rootp.row) {
            let leftmerge = leftmergecells[this.p.toString()];
            if (leftmerge !== undefined) {
                return "\\multicolumn{" + (leftmerge + 1).toString() + "}{|c|}{} &";
            }
            //return "&";
        }     
        return "";
    }
    public getBottomLines(): TablePoint[] {
        if (this.mergeroot === this.p.toString()) {
            let bottom = this.p.row;
            let cells: TablePoint[] = [this.p];
            this.mergechildren.forEach(
                (item) => {
                    let p = new TablePoint(undefined, undefined, item);
                    cells.push(p);
                    if (p.row > bottom) bottom = p.row;
                });
            return cells.filter(cell => cell.row === bottom); //Returns the cells at the bottom of the merge.
        }
        if (this.mergeroot === "") return [this.p];
        return []; //If it's child in a merge, return nothing.
    }
    public getLeftLines(): TablePoint[] {
        if (this.mergeroot === this.p.toString()) {
            let left = this.p.col;
            let cells: TablePoint[] = [this.p];
            this.mergechildren.forEach(
                (item) => {
                    let p = new TablePoint(undefined, undefined, item);
                    if (p.col === left) cells.push(p);
                });
            return cells; //Returns the cells at the bottom of the merge.
        }
        if (this.mergeroot === "") return [this.p];
        return []; //If it's child in a merge, return nothing.
    }
    public getHexBackgroundColour() : string {
        return this.backgroundcolour;
    }
    public getHTML(): string {
        if (this.mergeroot !== "" && this.mergeroot !== this.p.toString()) return ""; //Return nothing if this cell is hidden by being a child of a merge.

        let mergetext = "";
        if (this.mergeroot === this.p.toString()) {
            let size = this.getMergeSize();
            let h = size[0];
            let w = size[1];
            if (h !== 0) {
                mergetext += " rowspan='" + (h + 1).toString() + "'";
            }
            if (w !== 0) {
                mergetext += " colspan='" + (w + 1).toString() + "'";
            }
        }
        
        let html = "<td ";
        html += mergetext;

        //CSS styling
        let colour = this.getHexBackgroundColour();
        html += " style = '";
        if (colour !== "") {
            html += "background-color:" + colour + ";";
        }
        html += "border: 1px solid " + this.bordercolour + ";";
        html += "padding: 5px;";
        html += "text-align: " + this.csstextalign + ";";
        html += "border-style:" + this.borderstyle + ";";
        html += "'>" + escapeHTML(this.getData()) + "</td >\n";

        return html;
    }
    private getTextHeight(): number {
        let lines = this.data.split("\n");
        return lines.length * 25;
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
    private getparagraphcss() {
        //let styling: CSS.Properties = {
        //    textAlign: this.csstextalign as any,
        //}
        return { textAlign: this.csstextalign};
    }
    public setTextAlignment(alignment : string) {
        this.csstextalign = alignment;
    }
    public draw(xpixel: number, ypixel: number, colwidths: number[], rowheights: number[], horizontaldividersize: number, verticaldividersize: number, changeData: Function, selectCell: Function, deSelectCell: Function, enableEditMode: Function, disableEditMode: Function, hlines: boolean) {
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
                    hlines={hlines}
                    backgroundcolour={this.backgroundcolour}
                    bordercolour={this.bordercolour}
                    borderstyle={this.borderstyle}
                    paragraphcss={this.getparagraphcss()}
                />
            );
        }
    }
}

class MyTable extends React.Component<Props, TableState> {
    private chosencolour = "#ffffff";
    private colourpickerref = React.createRef<HTMLInputElement>();
    constructor(props: Props) {
        super(props);
        this.addRow = this.addRow.bind(this);
        this.addCol = this.addCol.bind(this);
        let rows = 5;
        let cols = 5;
        this.state = { table: [], mincellheight: 40, mincellwidth: 50, dividerpixels: 0, horizontallines: true, selecting: false, startselectpoint: [0, 0], endselectpoint: [0, 0], bordermodify: [true,true,true,true], tab: 0, newtableform: [rows, cols], changedatafield: ""};
        this.testPopulateTable();
    }

    //Creates and populates the initial table.
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

    /* 
     * HELPER FUNCTIONS
     */
    private getRowCount(): number {
        return this.state.table.length;
    }
    private getColCount(): number {
        return this.state.table[0].length;
    }
    private getRow(rownum: number): CellDetails[] {
        return this.state.table[rownum];
    }
    private getCol(colnum: number): CellDetails[] {
        let colarray = [];
        for (let row = 0; row < this.getRowCount(); row++) {
            colarray.push(this.state.table[row][colnum])
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
    //Returns the selected cells as a list.
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

    //Add a row to the bottom of the table.
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
    //Add a column to the right of the table.
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

    private moveCell() {

    }

    /*
     * Callback functions for interaction with individual cells
     */
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
    private modifyCellData(cell: CellDetails, data: string) {
        let newtable = this.state.table.map((x) => x);
        cell.setData(data);
        this.setState({ table: newtable });
    }


    /*
     * Functions called when one of the buttons at the top of the table is clicked.
     */

    //Copies the latex to the clipboard.
    private copyLatex(): void {
        let copyText = document.getElementById("latextextarea");
        (copyText! as HTMLTextAreaElement).select();
        (copyText! as HTMLTextAreaElement).setSelectionRange(0, 99999);
        document.execCommand("copy");
        let sel = document.getSelection();
        sel!.removeAllRanges();
    }

    private copyHTML(): void {
        let copyText = document.getElementById("htmltextarea");
        (copyText! as HTMLTextAreaElement).select();
        (copyText! as HTMLTextAreaElement).setSelectionRange(0, 99999);
        document.execCommand("copy");
        let sel = document.getSelection();
        sel!.removeAllRanges();
    }

    private copyText(): void {
        let copyText = document.getElementById("texttextarea")!;
        copyText.className = "show";
        (copyText as HTMLTextAreaElement).select();
        (copyText as HTMLTextAreaElement).setSelectionRange(0, 99999);
        document.execCommand("copy");
        let sel = document.getSelection();
        sel!.removeAllRanges();
        copyText.className = "hide";
    }

    private chooseColour(e: React.ChangeEvent<HTMLInputElement>) {
        this.chosencolour = e.target.value;
    }
    //Sets the colour of the selected cells to the chosen colour.
    private setCellBackgroundColours() {
        let selectedcells = this.getSelectedCells();
        selectedcells.forEach(
            (item) => {
                item.setBackgroundColour(this.chosencolour)
            });
        let newtable = this.state.table.map((x) => x);
        this.setState({ table: newtable });
    }

    private setCellBorderColours() {
        let selectedcells = this.getSelectedCells();
        selectedcells.forEach(
            (item) => {
                item.setBorderColour(this.chosencolour)
            });
        let newtable = this.state.table.map((x) => x);
        this.setState({ table: newtable });
    }

    private selectBorderToModify(border: number) {
        let bordermodify: [boolean, boolean, boolean, boolean];
        bordermodify = [...this.state.bordermodify];
        bordermodify[border] = !bordermodify[border];
        this.setState({bordermodify: bordermodify})
    }

    private chooseBorderStyle(e: React.ChangeEvent<HTMLSelectElement>) {
        console.log(this.state.bordermodify);
        let selectedcells = this.getSelectedCells();
        selectedcells.forEach(
            (item) => {
                item.setBorderStyle(e.target.value);
        })
    }

    private deselectAllCells() {
        let selectedcells = this.getSelectedCells();
        selectedcells.forEach(
            (item) => {
                item.deselect()
            });
        let newtable = this.state.table.map((x) => x);
        this.setState({ table: newtable });
    }

    private selectAllCells() {
        for (let row = 0; row < this.getRowCount(); row++) {
            for (let col = 0; col < this.getColCount(); col++) {
                let cell = this.state.table[row][col];
                cell.select();
            }
        }
        let newtable = this.state.table.map((x) => x);
        this.setState({ table: newtable });
    }

    private openTextAlignment(e : any) {
        let popover = document.getElementById("alignmentpopover")!;
        (popover as any).anchorEl = e.currentTarget;
    }

    //Merges the currently selected cells.
    //Uses the outer cells to create a rectangle of cells to merge if the selection is not a rectangle already.
    //Also includes the borders of other merged cells in this calculation.
    //Recurses when these extra cells are selected to check for new cells that should be included, otherwise performs the merge.
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

    //Splits the selected merged cells.
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

    //Sets CSS horizontal text alignment for the selected cells.
    private setHorizontalTextAlignment(alignment : string) {
        let cells = this.getSelectedCells();
        cells.forEach(
            (cell) => {
                cell.setTextAlignment(alignment);
            });
        let newtable = this.state.table.map((x) => x);
        this.setState({ table: newtable });
    }

    /*
     * Generates a latex representation of the current table.
     */
    private convertToLatex() {
        let collatex = "";
        for (let col = 0; col < this.getColCount(); col++) {
            collatex = collatex + "c ";
        }

        //Preprocess for horizontal lines.
        let horlines = Array(this.getRowCount()).fill(undefined).map(() => Array(this.getColCount()).fill(false));
        //let leftmergecells = {};
        let leftmergecells: { [key: string]: number; } = {};
        for (let row = 0; row < this.getRowCount(); row++) {
            this.state.table[row].forEach(
                (x) => {
                    let cells = x.getBottomLines();
                    cells.forEach(
                        (cell) => {
                            horlines[cell.row][cell.col] = true;
                        });
                    if (x.getMergeChildren().length !== 0) {
                        let leftcells = x.getLeftLines();
                        let width = x.getMergeSize()[1];
                        leftcells.forEach(
                            (item) => {
                                leftmergecells[item.toString()] = width;
                            });
                    }
                });
        }

        let latextable = [];
        for (let row = 0; row < this.getRowCount(); row++) {
            let rowarray = this.state.table[row];
            let rowlatex = "";
            rowarray.forEach(
                (x) => {
                    rowlatex = rowlatex + x.getLatex(leftmergecells);
                }); /* Escapes & characters and backslashes */
            if (rowlatex.charAt(rowlatex.length - 1) === '&') rowlatex = rowlatex.slice(0, -1);
            rowlatex = rowlatex + " \\\\";

            //make fized length array of bools
            
            let lines = horlines[row];//[true, true, true, true, true];
            let drawingline = false;
            let l = " ";
            for (let i = 0; i < lines.length; i++) {
                let col = i + 1;
                if (lines[i] && !drawingline) {
                    drawingline = true;
                    l = l + "\\cline{" + col;
                }
                if ((i === lines.length - 1 && drawingline) || (drawingline && i !== lines.length - 1 && !lines[i + 1])) {
                    l = l + "-" + col + "}";
                    drawingline = false;
                } 
            }

            if (this.state.horizontallines) rowlatex = rowlatex + l;
            latextable.push(rowlatex);
        }
        if (this.state.horizontallines && latextable.length > 0) latextable[0] = " \\hline" + "\n" + latextable[0];

        //let bs = "\\";
        //let cu1 = "{";
        //let cu2 = "}";

        let latex = "";
        latex += "\\begin{center}";
        latex += "\n\\begin{tabular}{" + collatex + "}";
        latextable.forEach(
            (x) => {
                latex += "\n" + x;
            }
        );
        latex += "\n\\end{tabular}";
        latex += "\n\\end{center}";

        return (
            <div>
                <textarea readOnly={true} rows={10} cols={25} className="latex-box" id="latextextarea" value={latex}/>
            </div>
            
        );
    }

    /*
     * Generates a HTML representation of the current table.
     */
    private convertToHTML() {
        let html = "<table class='htmltable' >\n";

        for (let i = 0; i < this.getRowCount(); i++) {
            let row = this.getRow(i);
            html += "<tr>\n";

            row.forEach(
                (x) => {
                    html += x.getHTML();
                    
                }); /* TODO: Escape HTML */

            html += "</tr>\n";
        }

        html += "</table>\n";

        //dangerous TODO: maybe remove live html
        return (
            <div>
                <div dangerouslySetInnerHTML={{ __html: html }} className="html-table-displaybox" />
                <textarea readOnly={true} rows={10} cols={15} className="latex-box" id="htmltextarea" value={html} />
            </div>
        );
    }

    /*
     * Generates a text representation of the current table.
     */
    private convertToText() {
        let textdata = this.state.table.map(
            row =>
                row.map(
                    cell =>
                        cell.getData()
                )
        );
        let texttable = table(textdata);
        //console.log(texttable);
        return (
            <div>
                <textarea readOnly={true} rows={10} cols={15} id="texttextarea" className="hide" value={texttable}/>
                <code id="textcodeblock">
                    {texttable}
                </code>
                
                {/*<textarea readOnly={true} rows={10} cols={25} className="text-table" id="" value={texttable} />*/}
                
            </div>

        );
    }

    /*
     * Functions used for clicking and dragging to select cells.
     */

    //Initialises the select box when the mouse is clicked down.
    private svgCreateRect(ev: React.MouseEvent<SVGSVGElement, MouseEvent>) { //Creates rectangle
        let canvas = document.getElementById("svg");
        let rect = canvas!.getBoundingClientRect();
        let x = ev.clientX - rect.left
        let y = ev.clientY - rect.top
        this.setState({ selecting: true, startselectpoint: [x, y], endselectpoint: [x, y] });
    }
    //Destroys the box after performing one last update of the box's position.
    //This triggers when click is released or the mouse moves outside of the table.
    private svgDestroyRect(ev: React.MouseEvent<SVGSVGElement, MouseEvent>) {
        
        //Uses string conversions to compare the arrays.
        if ((this.state.startselectpoint.toString() === this.state.endselectpoint.toString()) && (this.state.startselectpoint.toString() !== "0,0")) {
            console.log("Click select" + this.state.startselectpoint);
            this.selectWithClick(this.state.startselectpoint);
        } else {
            this.svgDragRect(ev);
        }
        this.setState({ selecting: false, startselectpoint: [0, 0], endselectpoint: [0, 0]});
    }
    //Updates the coordinates of the box as the mouse moves (while click is held).
    private svgDragRect(ev: React.MouseEvent<SVGSVGElement, MouseEvent>) {
        if (this.state.selecting) {
            let canvas = document.getElementById("svg");
            let rect = canvas!.getBoundingClientRect();
            let x = ev.clientX - rect.left
            let y = ev.clientY - rect.top
            this.SelectWithBox();
            this.setState({ selecting: true, endselectpoint: [x, y] });
        }
    }
    //Draws the box using the currently supplied coordinates.
    private drawSelectRect() {
        if (this.state.selecting) {
            let start = this.state.startselectpoint;
            let end = this.state.endselectpoint;
            return (
                <rect
                    id="svgselectrect"
                    fill="rgba(255,0,0,0.3)"
                    x={Math.min(start[0], end[0])}
                    y={Math.min(start[1], end[1])}
                    width={Math.abs(start[0] - end[0])}
                    height={Math.abs(start[1] - end[1])}
                />
            );
        }
    }
    private selectWithClick(coords: [number, number]) {
        let svg = document.getElementById("svg")!;
        let rect = svg.getBoundingClientRect();
        coords = [coords[0] + rect.left, coords[1] + rect.top];
        for (let row = 0; row < this.getRowCount(); row++) {
            for (let col = 0; col < this.getColCount(); col++) {
                let cell = this.state.table[row][col];
                if (cell.isVisible()) {
                    let svggroup = document.getElementById(cell.p.toString()) as HTMLElement;
                    let rect = svggroup!.getBoundingClientRect();

                    if (coords[0] < rect.left + rect.width &&
                        coords[0] > rect.left &&
                        coords[1] < rect.top + rect.height &&
                        coords[1] > rect.top) {
                        if (cell.isSelected()) {
                            cell.deselect();
                        } else{
                            cell.select();
                        }
                    }
                    else {
                        //cell.deselect();
                    }
                }
            }
        }
    }
    //Selects the cells highlighted by the box by checking for collision with each cell.
    private SelectWithBox() {
        let selectionrect = document.getElementById("svgselectrect")!.getBoundingClientRect()!;
        for (let row = 0; row < this.getRowCount(); row++) {
            for (let col = 0; col < this.getColCount(); col++) {
                let cell = this.state.table[row][col];
                if (cell.isVisible()) {
                    let svggroup = document.getElementById(cell.p.toString()) as HTMLElement;
                    let rect = svggroup!.getBoundingClientRect();

                    if (selectionrect.left < rect.left + rect.width &&
                        selectionrect.left + selectionrect.width > rect.left &&
                        selectionrect.top < rect.top + rect.height &&
                        selectionrect.top + selectionrect.height > rect.top) {
                        cell.select();
                    }
                    else {
                        cell.deselect();
                    }
                }
            }
        }
    }

    /*
     * Converts the SVG table to an image.
     * This can then be viewed and downloaded.
     */
    private convertToImage() {
        let selectedcells = this.getSelectedCells();
        selectedcells.forEach(
            (item) => {
                item.deselect()
            });
        let newtable = this.state.table.map((x) => x);
        this.setState({ table: newtable }, () => this.convertToPNG());
    }

    private convertToPNG() {
        let svgthing = document.getElementById("svg");
        let svgData = new XMLSerializer().serializeToString(svgthing!);

        let htmlcanvas = document.getElementById("mycanvas")! as HTMLCanvasElement;

        htmlcanvas.className = "show";

        //let ctx = htmlcanvas.getContext('2d')!;

        let img = document.createElement("img");
        img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));

        let w = window.open("")!;
        w.document.write(img.outerHTML);

        //window.open(htmlcanvas.toDataURL("image/png"));

        //let a = document.getElementById("dlbutton")!;
        //a.setAttribute("href", "data:application/octet-stream;base64,");

        //img.onload = function () {
        //    ctx.drawImage(img, 0, 0);
        //    console.log(htmlcanvas.toDataURL("image/png"));
        //};
    }

    /*
     * Draws the current representation of the table.
     */
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
            <div className="maintablediv">
                <svg width={tablewidth} height={tableheight} id="svg" onMouseDown={(e) => this.svgCreateRect(e)} onMouseUp={(e) => this.svgDestroyRect(e)} onMouseMove={(e) => this.svgDragRect(e)} onMouseLeave={(e) => this.svgDestroyRect(e)}>
                    {this.state.table.map((innerArray, row) => (
                        innerArray.map(
                            (cell, col) =>
                                cell.draw(
                                    (colwidths.slice(0, col)).reduce((a, b) => a + b, 0) + (this.state.dividerpixels * (col)),
                                    (rowheights.slice(0, row)).reduce((a, b) => a + b, 0) + (this.state.dividerpixels * (row)),//row * (this.state.mincellheight + this.state.dividerpixels),
                                    colwidths,
                                    rowheights,
                                    this.state.dividerpixels,
                                    this.state.dividerpixels,
                                    (cell: CellDetails, data: string) => this.modifyCellData(cell, data),
                                    (cell: CellDetails) => this.selectCell(cell),
                                    (cell: CellDetails) => this.deselectCell(cell),
                                    (cell: CellDetails) => this.enableCellEdit(cell),
                                    (cell: CellDetails) => this.disableCellEdit(cell),
                                    this.state.horizontallines
                                )
                        )
                    ))}
                    {this.drawSelectRect()}
                </svg>
                <canvas id="mycanvas" className="hide" width={tablewidth} height={tableheight} />
                <br />
                
            </div>
        );
    }

    

    componentDidMount() {
        this.colourpickerref.current!.value = this.chosencolour;
    }

    componentDidUpdate(prevProps: Object, prevState: TableState ){
        statestack.push(prevState);
    }

    private undo(){
        let prevstate = statestack.pop();
        console.log(prevstate);
        if(prevstate !== undefined){
            this.setState(
                prevstate,
                () =>
                    statestack.pop()
                );
        }
    }

    private bigClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {

    }

    private changeTab(e: React.ChangeEvent<{}>, v: any) {
        //let tabbar = document.getElementById("tabbar")!;
        //console.log(v);
        this.setState({ tab: (v as number) });
        this.uploadIMG();
    }

    

    private getTabContent() {
        switch (this.state.tab) {
            case 1:
                return (
                    <div id="HTMLDiv">
                        {this.convertToHTML()}
                        <Button className="table-buttons" type="button" onClick={() => this.copyHTML()}>Copy to clipboard</Button>
                    </div>
                );
            case 2:
                return (
                    <div id="TextDiv">
                        {this.convertToText()}
                        <Button className="table-buttons" type="button" onClick={() => this.copyText()}>Copy to clipboard</Button>
                    </div>
                );
            case 3:
                return (
                    <div id="PNGDiv">
                        <Button className="table-buttons" type="button" onClick={() => this.convertToImage()}>Generate PNG</Button>
                    </div>
                );
            case 0:
            default:
                return (
                    <div id="LaTexDiv">
                        {this.convertToLatex()}
                        <Button className="table-buttons" type="button" onClick={() => this.copyLatex()}>Copy to clipboard</Button>
                    </div>
                );
        }             
    }

    private async populateWeatherData() {
        const response = await fetch('weatherforecast');
        const data = await response.json();
        const response2 = await fetch('TableImageOCR');
        const data2 = await response2.json();
        console.log(data);
        console.log(data2);
    }

    private async uploadIMG() {
        var test = await fetch('TableImageOCR/UploadTable', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: "45"
        });
        const data2 = await test.json();
        console.log(data2);
    }

    private async UploadTable() {
        let fileupload = document.getElementById("file") as HTMLInputElement;
        let formData = new FormData();
        formData.append('File', fileupload.files[0]);

        let request = await fetch('TableImageOCR/UploadTable', {
            method: 'POST',
            headers: {
            },
            body: formData
        });
        let data2 = await request.json();

    }

    private handleNewTableFile(e: React.ChangeEvent<HTMLInputElement>) {
        //let file = e.target.files[0];
        //console.log("test");
    }

    private createNewTable(rows: number, cols: number, keepdata: boolean){
        if (rows <= 30 && cols <= 30){
            let newtable: CellDetails[][] = [];
            for (let row = 0; row < rows; row++) {
                let rowarray: CellDetails[] = [];
                for (let col = 0; col < cols; col++) {
                    let cell = new CellDetails(new TablePoint(row, col));
                    rowarray.push(cell);
                }
                newtable.push(rowarray);
            }
            this.setState({table: newtable});
        }
        else{
            alert("Table dimensions too big.");
        }
        
    }

    private setSelectedCellData(data: string){
        let selectedcells = this.getSelectedCells();
        selectedcells.forEach(
            (cell) =>
            cell.setData(data)
        )
        this.setState(this.state);
    }

    private stateToJSON() : string{
        let json = JSON.stringify(this.state, null, '   ');
        //console.log(json);
        return json;
    }

    private importJSONState(jsonstate: string){
        let newstate: TableState = JSON.parse(jsonstate);
        for (let row = 0; row < newstate.table.length; row++) {
            for (let col = 0; col < newstate.table[0].length; col++) {
                let cell = newstate.table[row][col];
                let p: TablePoint = plainToClass(TablePoint, cell.p);
                cell.p = p;
                newstate.table[row][col] = plainToClass(CellDetails, cell); //Convert the cell to an instance of the cell class.
            }
        }
        this.setState(newstate);
    }


    public render() {
        return (
            <div>
                <Drawer anchor="left" variant="permanent" open={true}>
                    <List>
                        <ListItem divider />
                        <ListItem divider>
                            <b>New Table</b>
                        </ListItem>

                        <ListItem >
                            <form>
                                <label htmlFor="rowsinput">Rows </label>
                                <input type="number" id="rowsinput" name="rowsinput" min="1" max="30" value={this.state.newtableform[0]} onChange={(e) => this.setState({newtableform: [parseInt(e.target.value), this.state.newtableform[1]]})}/>
                                <label htmlFor="rowsinput">Cols </label>
                                <input type="number" id="rowsinput" name="rowsinput" min="1" max="30" value={this.state.newtableform[1]} onChange={(e) => this.setState({newtableform: [this.state.newtableform[0], parseInt(e.target.value)]})}/>
                                <Button onClick={() => this.createNewTable(this.state.newtableform[0], this.state.newtableform[1], false)}>Create</Button>
                            </form>
                        </ListItem>

                        <ListItem className="listitemtitle">
                            Upload Table Image
                        </ListItem>
                        <ListItem className="listitemtitle">
                            <input type="file" id="file" accept="image/*" onChange={(e) => this.handleNewTableFile(e) }/>
                            <Button onClick={() => this.UploadTable()}>Upload</Button>
                        </ListItem>

                        <ListItem divider />
                        <ListItem divider>
                            <b>Global Controls</b>
                        </ListItem>
                        
                        <ListItem button onClick={() => this.addRow()}>Add Row</ListItem>
                        <ListItem button onClick={() => this.addCol()}>Add Column</ListItem>
                        <ListItem button onClick={() => this.selectAllCells()}>Select All</ListItem>
                        <ListItem button onClick={() => this.deselectAllCells()}>Select None</ListItem>
                        <ListItem button onClick={() => this.setState({ horizontallines: !this.state.horizontallines })}>(Temp)</ListItem>

                        <ListItem button onClick={() => this.undo()}>Undo</ListItem>


                        <ListItem button onClick={() => jsonstate = this.stateToJSON()}>Save state temp</ListItem>
                        <ListItem button onClick={() => this.importJSONState(jsonstate)}>Restore state temp</ListItem>

                        <ListItem divider />

                        <ListItem divider>
                            <b>Selected Cell Controls</b>
                        </ListItem>

                        <ListItem >
                            <form>
                                <input type="text" id="celltextinput" name="celltextinput" value={this.state.changedatafield} onChange={(e) => this.setState({changedatafield: e.target.value})}/>
                                <Button onClick={() => this.setSelectedCellData(this.state.changedatafield)}>Set Data</Button>
                            </form>
                        </ListItem>

                        <ListItem button onClick={() => this.setSelectedCellData("")}>
                            <ListItemText primary="Clear Data"/>
                        </ListItem>
                        
                        <ListItem button onClick={() => this.mergeCells()}>
                            <ListItemText primary="Merge" secondary="Combine the selected cells into one"/>
                        </ListItem>
                        <ListItem button onClick={() => this.splitCells()}>
                            <ListItemText primary="Split" secondary="Undo a merge"/>
                        </ListItem>
                        <ListItem>
                            Colour
                            <input type="color" onChange={e => this.chooseColour(e)} ref={this.colourpickerref} className="colour-picker"/>
                        </ListItem>
                        <ListItem button onClick={() => this.setCellBackgroundColours()}>
                            <ListItemText primary="Set cell backgrounds to this colour" />
                        </ListItem>
                        <ListItem button onClick={() => this.setCellBorderColours()}>
                            <ListItemText primary="Set cell borders to this colour" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Text Alignment:"/>
                            <Button onClick={() => this.setHorizontalTextAlignment("left")}>Left</Button>
                            <Button onClick={() => this.setHorizontalTextAlignment("center")}>Centre</Button>
                            <Button onClick={() => this.setHorizontalTextAlignment("right")}>Right</Button>
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Border Style:" />
                            <select name="chooseborderstyle" onChange={(e) => this.chooseBorderStyle(e)}>
                                <option value="solid">Solid</option>
                                <option value="dotted">Dotted</option>
                                <option value="dashed">Dashed</option>
                            </select>
                        </ListItem>
                        
                    </List>
                </Drawer>

                
                <div className="root-div" onClick={(e) => this.bigClick(e)}>

                        {/*
                            <div className="table-buttons-div">
                                <h3>Border Styling</h3>

                            Top
                            <input type="checkbox" value="top" checked={this.state.bordermodify[0]} onClick={() => this.selectBorderToModify(0)} />
                            Right
                            <input type="checkbox" value="right" checked={this.state.bordermodify[1]} onClick={() => this.selectBorderToModify(1)} />
                            Bottom
                            <input type="checkbox" value="bottom" checked={this.state.bordermodify[2]} onClick={() => this.selectBorderToModify(2)} />
                            Left
                            <input type="checkbox" value="left" checked={this.state.bordermodify[3]} onClick={() => this.selectBorderToModify(3)} />

                            </div>
                        */}

                        {this.drawTable()}

                    <div>
                        <AppBar position="static">
                            <Tabs id="tabbar" value={this.state.tab} onChange={(e,v) => this.changeTab(e,v)}>
                                <Tab label="LaTeX" tabIndex={0}/>
                                <Tab label="HTML" tabIndex={1}/>
                                <Tab label="Text" tabIndex={2}/>
                                <Tab label="PNG" tabIndex={3}/>
                            </Tabs>
                        </AppBar>
                        <div id="tabContentDiv">
                            {this.getTabContent()}
                        </div>
                            
                    </div>
                </div>
                
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
    hlines: boolean
    backgroundcolour: string
    bordercolour: string
    borderstyle: string
    paragraphcss: any
}

class SVGCell extends React.Component<SVGCellProps, {}> {
    private changeData(e: React.ChangeEvent<HTMLTextAreaElement>) {
        this.props.changeData(this.props.cell, e.target.value);
    }
    private disableEdit(e: React.FocusEvent<HTMLTextAreaElement>) {
        this.props.disableedit(this.props.cell);
    }
    private moveCursorToEnd(e: React.FocusEvent<HTMLTextAreaElement>) {
        let value = e.target.value;
        e.target.value = "";
        e.target.value = value;
    }
    private getText() {
        if (!this.props.editing) {
            //<text x={this.props.xpixel + this.props.width / 2} y={this.props.ypixel + 20} textAnchor={"middle"} alignmentBaseline={"central"} className="celltext">{lines[0]}</text>
            //if (lines.length === 1) {
            //let styling: CSS.Properties = {
           //     textAlign: "left",
            //}
            return (
                <g>
                    <foreignObject x={this.props.xpixel} y={this.props.ypixel} width={this.props.width} height={this.props.height}>
                        <div className="celldiv">
                            <p className="celltext" style={this.props.paragraphcss}>{this.props.cell.getData()}</p>
                        </div>
                    </foreignObject>
                </g>
            );
        } else {
            return (
                <foreignObject x={this.props.xpixel} y={this.props.ypixel} width={this.props.width} height={this.props.height}>
                    <textarea className="cell-input" value={this.props.cell.getData()} rows={ 100 } tabIndex={0} onChange={(e) => this.changeData(e)} onBlur={(e) => this.disableEdit(e)} autoFocus={true} onFocus={(e) => this.moveCursorToEnd(e)}/>
                    {/*<div contentEditable={true} tabIndex={0} onBlur={(e) => this.disableEdit(e)} onChange={(e) => this.changeData(e)} suppressContentEditableWarning={true} id={this.props.cell.p.toString() + "editdiv"}>
                        {this.props.cell.getData()}
                    </div>*/}
                </foreignObject>
            );
        }
    }
    private clickCell(e: React.MouseEvent<SVGGElement, MouseEvent>) {
        /*if (this.props.selected) {
            this.props.deselectcell(this.props.cell);
        } else {
            this.props.selectcell(this.props.cell);
        }*/
    }
    private getRectColour() {
        /*if (this.props.selected) {
            return "red";
        }*/
        if (this.props.backgroundcolour === "") {
            return "white"
        }
        return this.props.backgroundcolour;
    }
    private getBorderColour() {
        //if (this.props.selected) {
        //    return "yellow";
        //}
        return this.props.bordercolour;
    }
    private getSelectedStyling() {
        if (this.props.selected) {
            return (
                <rect x={this.props.xpixel + 2} y={this.props.ypixel + 2} width={this.props.width - 4} height={this.props.height - 4} fill="none" stroke="red" strokeWidth={2} />
            )
        }
    }
    private getBorderStyle() {
        switch (this.props.borderstyle) {
            case "solid":
                return "";
            case "dotted":
                return "2,2";
            case "dashed":
                return "5,5";
        }
    }
    componentDidUpdate() {
    }
    public render() {
        return (
            <g onDoubleClick={() => this.props.enableedit(this.props.cell)} onClick={(e) => this.clickCell(e)} id={this.props.cell.p.toString()} className="ACell">
                <rect x={this.props.xpixel} y={this.props.ypixel} width={this.props.width} height={this.props.height} fill={this.getRectColour()} stroke={this.getBorderColour()} strokeWidth={this.props.hlines ? 1 : 0} strokeDasharray={this.getBorderStyle()}/>
                {this.getSelectedStyling()}
                {this.getText()}
            </g>
        );
    }
}