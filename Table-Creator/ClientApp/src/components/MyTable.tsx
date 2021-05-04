//import React from 'react'; // we need this to make JSX compile
//import { findDOMNode } from 'react-dom';
import {escapeLatex, escapeHTML, TablePoint, moveTablePoint, Direction, BorderStyle} from './Globals'
import {parseLatexTable} from './ParseLatexTable'
import * as React from 'react';
import './MyTable.css';
import { table } from 'table';
import { Drawer, Button, List, ListItem, ListItemIcon, ListItemText, Popover, AppBar, Tabs, Tab, Toolbar, TextField, Checkbox, Divider, Dialog, DialogTitle } from '@material-ui/core';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import ToggleButton from '@material-ui/lab/ToggleButton';
import { plainToClass, Type } from 'class-transformer';
import 'reflect-metadata';
import cloneDeep from 'lodash/cloneDeep';
import Papa from 'papaparse';
import Color from 'color';
//import cloneSymbol from 'lodash/_cloneSymbol';
import { red } from '@material-ui/core/colors';
import { CellDetails } from './CellDetails';

var tablestack: CellDetails[][][] = [];
var redotablestack: CellDetails[][][] = [];

type Props = {
    initialrows: number;
    initialcols: number;
    prefillcells: boolean;
}

type TableState = {
    table: CellDetails[][];
    selecting: boolean;
    startselectpoint: [number, number];
    endselectpoint: [number, number];
    bordermodify: [boolean, boolean, boolean, boolean];
    newtableform: [number, number];
    changedatafield: string;
    tab: number;
    prefillcellscheck: boolean;
    username: string;
    password: string;
    mytables: [string, string][];
    showaccountdialog: boolean;
    currenttablename: string;
    showoutput: boolean;
    topmenutab: number;
    extrapadding: boolean;
}


class MyTable extends React.Component<Props, TableState> {
    private chosencolour = "#ffffff";
    private colourpickerref: React.RefObject<HTMLInputElement>;
    private svgref: React.RefObject<SVGSVGElement>;
    private latextextarearef: React.RefObject<HTMLTextAreaElement>;
    private htmltextarearef: React.RefObject<HTMLTextAreaElement>;
    private texttextarearef: React.RefObject<HTMLTextAreaElement>;
    private tableref: React.RefObject<HTMLTableElement>;
    private latexpackagesref: React.RefObject<HTMLTextAreaElement>;
    constructor(props: Props) {
        super(props);
        this.svgref = React.createRef();
        this.colourpickerref = React.createRef();
        this.latextextarearef = React.createRef();
        this.htmltextarearef = React.createRef();
        this.texttextarearef = React.createRef();
        this.latexpackagesref = React.createRef();
        this.tableref = React.createRef();
        this.state = { 
            table: [], 
            selecting: false, 
            startselectpoint: [0, 0], 
            endselectpoint: [0, 0], 
            bordermodify: [true,true,true,true], 
            tab: 0, 
            newtableform: [this.props.initialrows, this.props.initialcols], 
            changedatafield: "",
            prefillcellscheck: this.props.prefillcells,
            username: "",
            password: "",
            mytables: [],
            showaccountdialog: false,
            currenttablename: "A table",
            showoutput: true,
            topmenutab: 0,
            extrapadding: true
        };
        this.testPopulateTable();
    }

    static defaultProps = {
        initialrows: 5,
        initialcols: 5,
        prefillcells: true,
    };

    //Creates and populates the initial table.
    private testPopulateTable() {
        for (let row = 0; row < this.props.initialrows; row++) {
            let rowarray: CellDetails[] = [];
            for (let col = 0; col < this.props.initialcols; col++) {
                let cell = new CellDetails(new TablePoint(row, col), this.props.prefillcells ? undefined : "a");
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
    /*private getColWidth(col: number): number { //Doesn't account for merged cells.
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
    }*/
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

    private getAllCells() {
        let cells = [];
        for (let row = 0; row < this.getRowCount(); row++) {
            for (let col = 0; col < this.getColCount(); col++) {
                let cell = this.state.table[row][col];
                cells.push(cell);
            }
        }
        return cells;
    }

    private getSelectedCellsFromTable(table: CellDetails[][]) {
        let rows = table.length;
        let cols = table[0].length;
        let selectedcells = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let cell = table[row][col];
                if (cell.isSelected()) {
                    selectedcells.push(cell);
                }
            }
        }
        return selectedcells;
    }

    //Add a row to the bottom of the table.
    private addRow() {
        let newtable = cloneDeep(this.state.table);
        let row: CellDetails[] = [];
        for (let col = 0; col < this.getColCount(); col++) {
            let cell = new CellDetails(new TablePoint(this.getRowCount(), col), this.state.prefillcellscheck ? undefined : ""); //May need to add 1 to getrowcount()
            row.push(cell);
        }
        newtable.push(row);
        this.addTableStateToUndoStack();
        this.setState({ table: newtable });
    }
    //Add a column to the right of the table.
    private addCol() {
        let newtable = cloneDeep(this.state.table);
        let colcount = this.getColCount();
        for (let row = 0; row < this.getRowCount(); row++) {
            let cell = new CellDetails(new TablePoint(row, colcount), this.state.prefillcellscheck ? undefined : "");
            newtable[row].push(cell);
        }
        this.addTableStateToUndoStack();
        this.setState({ table: newtable });
    }

    /*
     * Callback functions for interaction with individual cells
     */
    private selectCell(cell: CellDetails) {
        cell.select();
        let newtable = cloneDeep(this.state.table);
        this.setState({ table: newtable });
    }
    private deselectCell(cell: CellDetails) {
        cell.deselect();
        let newtable = cloneDeep(this.state.table);
        this.setState({ table: newtable });
    }
    private enableCellEdit(cell: CellDetails) {
        cell.enableEdit();
        let newtable = cloneDeep(this.state.table);
        this.setState({ table: newtable });
    }
    private disableCellEdit(cell: CellDetails) {
        cell.disableEdit();
        let newtable = cloneDeep(this.state.table);
        this.setState({ table: newtable });
    }
    //TODO: FIX UNDO
    private modifyCellData(cell: CellDetails, data: string) {
        this.addTableStateToUndoStack();
        cell.setData(data);
        let newtable = cloneDeep(this.state.table);
        this.setState({ table: newtable });
    }


    /*
     * Functions called when one of the buttons at the top of the table is clicked.
     */

    //Copies the latex to the clipboard.
    private copyLatex(): void {
        let copyText = this.latextextarearef.current!;
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy");
        let sel = document.getSelection();
        sel!.removeAllRanges();
    }

    private copyLatexPackages(): void {
        let copyText = this.latexpackagesref.current!;
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy");
        let sel = document.getSelection();
        sel!.removeAllRanges();
    }

    private copyHTML(): void {
        let copyText = this.htmltextarearef.current!;
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy");
        let sel = document.getSelection();
        sel!.removeAllRanges();
    }

    private copyText(): void {
        //let copyText = this.texttextarearef.current!;
        let copyText = document.getElementById("texttextarea")! as HTMLTextAreaElement;
        copyText.className = "show";
        copyText.select();
        copyText.setSelectionRange(0, 99999);
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
        this.addTableStateToUndoStack();
        let selectedcells = this.getSelectedCells();
        selectedcells.forEach(
            (item) => {
                item.setBackgroundColour(this.chosencolour)
                if (item.isMergeRoot()){
                    let children_p = item.getMergeChildren();
                    let children_cells = children_p.map(p => this.state.table[p.row][p.col]);
                    children_cells.forEach(child_cell => child_cell.setBackgroundColour(this.chosencolour));
                }
            });
        let newtable = cloneDeep(this.state.table);
        this.setState({ table: newtable });
    }

    private setCellTextColours() {
        this.addTableStateToUndoStack();
        let selectedcells = this.getSelectedCells();
        selectedcells.forEach(
            (item) => {
                item.setTextColour(this.chosencolour)
                if (item.isMergeRoot()){
                    let children_p = item.getMergeChildren();
                    let children_cells = children_p.map(p => this.state.table[p.row][p.col]);
                    children_cells.forEach(child_cell => child_cell.setTextColour(this.chosencolour));
                }
            });
        let newtable = cloneDeep(this.state.table);
        this.setState({ table: newtable });
    }

    private setCellBorderColours() {
        this.addTableStateToUndoStack();
        let newtable = cloneDeep(this.state.table);
        let selectedcells = this.getSelectedCellsFromTable(newtable);
        selectedcells.forEach(
            (item) => {
                let newbordercolours: [string, string, string, string] = ["", "", "", ""];
                this.state.bordermodify.map(
                    (val, i) => {
                        if (val){
                            newbordercolours[i] = this.chosencolour;
                        } else{
                            newbordercolours[i] = item.bordercolours[i];
                        }
                    });
                item.setBorderColour(newbordercolours);
        })
        this.setState({ table: newtable });
    }

    private selectBorderToModify(border: number) {
        let bordermodify: [boolean, boolean, boolean, boolean];
        bordermodify = [...this.state.bordermodify];
        bordermodify[border] = !bordermodify[border];
        this.setState({bordermodify: bordermodify})
    }

    private chooseBorderStyle(e: React.ChangeEvent<HTMLSelectElement>) {
        this.addTableStateToUndoStack();
        let newtable = cloneDeep(this.state.table);
        let selectedcells = this.getSelectedCellsFromTable(newtable);
        selectedcells.forEach(
            (item) => {
                let newborderstyle: [BorderStyle, BorderStyle, BorderStyle, BorderStyle] = [BorderStyle.None, BorderStyle.None, BorderStyle.None, BorderStyle.None];
                this.state.bordermodify.map(
                    (val, i) => {
                        if (val){
                            newborderstyle[i] = e.target.value as BorderStyle;
                        } else{
                            newborderstyle[i] = item.borderstyles[i];
                        }
                    });
                item.setBorderStyle(newborderstyle);
        })
        this.setState({ table: newtable });
    }

    private deselectAllCells() {
        let selectedcells = this.getSelectedCells();
        selectedcells.forEach(
            (item) => {
                item.deselect()
            });
        let newtable = cloneDeep(this.state.table);
        this.setState({ table: newtable });
    }

    private selectAllCells() {
        for (let row = 0; row < this.getRowCount(); row++) {
            for (let col = 0; col < this.getColCount(); col++) {
                let cell = this.state.table[row][col];
                cell.select();
            }
        }
        let newtable = cloneDeep(this.state.table);
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
        this.addTableStateToUndoStack();
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

                //Select the mergeroot
                if (cell.getMergeRoot() !== undefined){
                    let mergeroot = cell.getMergeRoot()!;
                    let mergerootcell = this.state.table[mergeroot.row][mergeroot.col];
                    if (!mergerootcell.isSelected()){
                        recurse = true;
                        mergerootcell.select();
                    }
                }
                

                //Select the merge children
                let cellchildren = cell.getMergeChildren();
                cellchildren.forEach(
                    (item2) => {
                        let childpoint = item2;
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
                    item.mergeAsChild(root.p);
                    item.deselect();
                });
            root.mergeAsRoot(children.map(x => x.p));

            let children_p = root.getMergeChildren();
            let children_cells = children_p.map(p => this.state.table[p.row][p.col]);
            children_cells.forEach(child_cell => child_cell.setBackgroundColour(root.getHexBackgroundColour()));

            let newtable = cloneDeep(this.state.table);
            this.setState({ table: newtable });
        }
    }

    //Splits the selected merged cells.
    private splitCells() {
        this.addTableStateToUndoStack();
        let selectedcells = this.getSelectedCells();
        if (selectedcells.length === 0) return;
        let roots = new Set<TablePoint>();
        selectedcells.forEach(
            (item) => {
                if (item.getMergeRoot() !== undefined) {
                    roots.add(item.getMergeRoot()!);
                }
                item.deselect();
            });
        let rootsarray = Array.from(roots);
        rootsarray.forEach(
            (item) => {
                let p = item;
                let cell = this.state.table[p.row][p.col];
                let children = cell.getMergeChildren();
                children.forEach(
                    (childitem) => {
                        let p2 = childitem;
                        let childcell = this.state.table[p2.row][p2.col];
                        childcell.unMerge();
                    });
                cell.unMerge();
            });
        let newtable = cloneDeep(this.state.table);
        this.setState({ table: newtable });
    }

    //Sets CSS horizontal text alignment for the selected cells.
    private setHorizontalTextAlignment(alignment: string) {
        this.addTableStateToUndoStack();
        let cells = this.getSelectedCells();
        cells.forEach(
            (cell) => {
                cell.setHorizontalTextAlignment(alignment);
            });
        let newtable = cloneDeep(this.state.table);
        this.setState({ table: newtable });
    }

    private setVerticalTextAlignment(alignment: string) {
        this.addTableStateToUndoStack();
        let cells = this.getSelectedCells();
        cells.forEach(
            (cell) => {
                cell.setVerticalTextAlignment(alignment);
            });
        let newtable = cloneDeep(this.state.table);
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

        //Create temporary array to show where horizontal lines are. Initialised with false.
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
        let botleftmergecells = new Map<string, string>();
        let latextable = [];
        for (let row = 0; row < this.getRowCount(); row++) {
            let rowarray = this.state.table[row];
            let rowlatex = "";
            rowarray.forEach(
                (x) => {
                    let botleft = x.getBotLeftOfMultiRowMerge();
                    if (botleft) botleftmergecells.set(botleft[0].toString(), botleft[1]);
                    if (botleftmergecells.has(x.p.toString())){
                        rowlatex = rowlatex + botleftmergecells.get(x.p.toString());
                    }else{
                        rowlatex = rowlatex + x.getLatex(leftmergecells);
                    }
                    
                }); /* Escapes & characters and backslashes */
            if (rowlatex.charAt(rowlatex.length - 1) === '&') rowlatex = rowlatex.slice(0, -1);
            rowlatex = rowlatex + " \\\\";

            //make fized length array of bools
            //Calculates where to draw horizontal lines.
            let lines = horlines[row];//[true, true, true, true, true];
            let drawingline = false;
            let l = "";
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

            rowlatex = rowlatex + l;
            latextable.push(rowlatex);
        }

        //The folling code calculates the top line.
        let toprow = this.state.table[0];
        let toplines = toprow.map(cell => cell.borderstyles[0] !== "none");
        let drawingline = false;
        let topline = "";
        for (let i = 0; i < toplines.length; i++) {
            let col = i + 1;
            if (toplines[i] && !drawingline) {
                drawingline = true;
                topline = topline + "\n\\cline{" + col;
            }
            if ((i === toplines.length - 1 && drawingline) || (drawingline && i !== toplines.length - 1 && !toplines[i + 1])) {
                topline = topline + "-" + col + "}";
                drawingline = false;
            } 
        }
        if (latextable.length > 0) latextable[0] = " " + topline + "\n" + latextable[0];

        //let bs = "\\";
        //let cu1 = "{";
        //let cu2 = "}";

        let latex = "";
        latex += "\\begin{center}";
        latex += "\n\\begin{tabular}{" + collatex + "}";
        latextable.forEach(
            (x) => {
                latex += x + "\n";
            }
        );
        latex += "\\end{tabular}";
        latex += "\n\\end{center}";

        let latexpackages = "\\usepackage[utf8]{inputenc}\n";
        latexpackages += "\\usepackage[table,xcdraw]{xcolor}\n";
        latexpackages += "\\usepackage{multicol}\n";
        latexpackages += "\\usepackage{multirow}\n";
        latexpackages += "\\usepackage{tabstackengine}";

        return (
            <div>
                <h4>Required LaTeX Packages</h4>
                <p>Place these at the top of the LaTeX document.</p>
                <textarea readOnly={true} rows={5} cols={25} className="latex-box" id="latexpackagestextarea" ref={this.latexpackagesref} value={latexpackages}/>
                <Button className="table-buttons" type="button" onClick={() => this.copyLatexPackages()}>Copy to clipboard</Button>
                <h4>LaTeX</h4>
                <textarea readOnly={true} rows={10} cols={25} className="latex-box" id="latextextarea" ref={this.latextextarearef} value={latex}/>
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
                <textarea readOnly={true} rows={10} cols={15} className="latex-box" id="htmltextarea" ref={this.htmltextarearef} value={html} />
                <Button className="table-buttons" type="button" onClick={() => this.copyHTML()}>Copy to clipboard</Button>
                <div dangerouslySetInnerHTML={{ __html: html }} className="html-table-displaybox" />
                
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
                    cell =>{
                        let data = cell.getData()
                        if (data === "" || cell.isMergeChild()) return " "
                        else return data
                    }
                        
                )
        );
        let texttable = "";
        try{
            texttable = table(textdata);
        }catch{
            texttable = "Couldn't create text table.";
            console.log(texttable);
        }
        
        return (
            <div>
                <textarea readOnly={true} rows={10} cols={15} ref={this.latextextarearef} id="texttextarea" className="hide" value={texttable}/>
                <code id="textcodeblock">
                    {texttable}
                </code>
                
                {/*<textarea readOnly={true} rows={10} cols={25} className="text-table" id="" value={texttable} />*/}
                
            </div>

        );
    }


    private copyAsCSVToClipboard(){
        let copyText = document.getElementById("csvtextarea")! as HTMLTextAreaElement;
        copyText.className = "show";
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy");
        let sel = document.getSelection();
        sel!.removeAllRanges();
        copyText.className = "hide";
    }

    private getCSVContent() {
        let tabledata = this.state.table.map(row => row.map(cell => cell.getData()));
        //let jsonrows = tabledata.map(row => JSON.stringify(row));
        //let jsonarray = JSON.stringify(jsonrows);
        let csvstring = Papa.unparse(tabledata);//Papa.unparse(JSON.stringify(jsonarray));

        return (
            <div>
                <textarea readOnly={true} rows={10} cols={15} id="csvtextarea" className="hide" value={csvstring}/>
                <h4>Copy CSV Table Data to your Clipboard</h4>
                <Button className="table-buttons" type="button" onClick={() => this.copyAsCSVToClipboard()}>Copy</Button>
            </div>
        );
        
        
    }

    /*
     * Functions used for clicking and dragging to select cells.
     */

    //Initialises the select box when the mouse is clicked down.
    private svgCreateRect(ev: React.MouseEvent<SVGSVGElement, MouseEvent>) { //Creates rectangle
        let canvas = this.svgref.current;
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
            this.selectWithClick(this.state.startselectpoint);
        } else {
            this.svgDragRect(ev);
        }
        this.setState({ selecting: false, startselectpoint: [0, 0], endselectpoint: [0, 0]});
    }
    //Updates the coordinates of the box as the mouse moves (while click is held).
    private svgDragRect(ev: React.MouseEvent<SVGSVGElement, MouseEvent>) {
        if (this.state.selecting) {
            let canvas = this.svgref.current;
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
                    x={Math.min(start[0], end[0])}
                    y={Math.min(start[1], end[1])}
                    width={Math.abs(start[0] - end[0])}
                    height={Math.abs(start[1] - end[1])}
                    style={{border:"1px solid black", fillOpacity: 0.3, fill: "red"}}
                />
            );
        }
    }
    private selectWithClick(coords: [number, number]) {
        let svg = this.svgref.current!;
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
        let newtable = cloneDeep(this.state.table);
        this.setState({ table: newtable }, () => this.convertToPNG());
    }

    private convertToPNG() {
        let svg = this.svgref.current!;
        let svgData = new XMLSerializer().serializeToString(svg);

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
    private handleKeyPress(e: any) {
        console.log(e.key);
        this.selectAllCells();
        if (e.ctrlKey){
            if (e.key == "a"){
                this.selectAllCells();
            }
        }
    }

    /*
     * Draws the current representation of the table.
     */
    private drawTable() {
        return (
            <div style={{zIndex:-1}} onKeyDown={(e) => this.handleKeyPress(e)} className="maintablediv" onClick={(e) => this.bigClick(e)}>
                <svg ref={this.svgref} width="9000px" height="9000px" id="svg"  onMouseDown={(e) => this.svgCreateRect(e)} onMouseUp={(e) => this.svgDestroyRect(e)} onMouseMove={(e) => this.svgDragRect(e)} onMouseLeave={(e) => this.svgDestroyRect(e)}>
                    <foreignObject x="0%" y="0%" width="100%" height="100%">
                        <table ref={this.tableref} className="maintable">
                            <tbody>
                                {
                                this.state.table.map((innerArray, row) => (
                                    <tr key={row}>
                                        {innerArray.map(
                                            (cell, col) =>
                                                
                                                    cell.draw(
                                                        0,
                                                        0,
                                                        [],
                                                        [],
                                                        0,
                                                        0,
                                                        (cell: CellDetails, data: string) => this.modifyCellData(cell, data),
                                                        (cell: CellDetails) => this.selectCell(cell),
                                                        (cell: CellDetails) => this.deselectCell(cell),
                                                        (cell: CellDetails) => this.enableCellEdit(cell),
                                                        (cell: CellDetails) => this.disableCellEdit(cell),
                                                        this.state.extrapadding,
                                                    )
                                                
                                                
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </foreignObject>
                    
                    {this.drawSelectRect()}
                </svg>
                <canvas id="mycanvas" className="hide" width={500} height={500} />
                <br />
                
            </div>
        );
    }

    

    componentDidMount() {
        let picker = this.colourpickerref.current;
        if (picker) picker.value = this.chosencolour;
    }

    componentDidUpdate(prevProps: Object, prevState: TableState ){
        //statestack.push(prevState);
    }

    private addTableStateToUndoStack(){
        redotablestack = [];
        let table = cloneDeep(this.state.table);
        if (tablestack.length > 10) tablestack.shift();
        tablestack.push(table);
    }

    private undo(){
        let prevtable = tablestack.pop();
        if(prevtable !== undefined){
            let curtable = cloneDeep(this.state.table);
            if (redotablestack.length > 11) redotablestack.shift();
            redotablestack.push(curtable);
            this.setState({table: prevtable}, () => this.deselectAllCells());
        }
    }

    private redo(){
        let newtable = redotablestack.pop();
        if(newtable !== undefined){
            let table = cloneDeep(this.state.table);
            if (tablestack.length > 10) tablestack.shift();
            tablestack.push(table);
            this.setState({table: newtable}, () => this.deselectAllCells());
        }
    }

    private bigClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (this.tableref.current !== null && !this.tableref.current.contains(e.target as Node)){
            this.deselectAllCells();
        }
    }

    private changeTab(e: React.ChangeEvent<{}>, v: any) {
        this.setState({ tab: (v as number) });
    }

    private changeTab2(e: React.ChangeEvent<{}>, v: any) {
        this.setState({ topmenutab: (v as number) });
    }

    private getOutputPanelTabContent() {
        switch (this.state.tab) {
            case 1:
                return (
                    <div id="HTMLDiv">
                        {this.convertToHTML()}
                        
                    </div>
                );
            case 2:
                return (
                    <div id="TextDiv">
                        <Button className="table-buttons" type="button" onClick={() => this.copyText()}>Copy to clipboard</Button>
                        {this.convertToText()}
                        
                    </div>
                );
            case 4:
                return (
                    <div id="PNGDiv">
                        <h4>Open Table as PNG Image in a new tab</h4>
                        <Button className="table-buttons" type="button" onClick={() => this.convertToImage()}>Generate PNG</Button>
                    </div>
                );
            case 3:
                return (
                    <div id="CSVDiv">
                        {this.getCSVContent()}
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

    private async UploadTable() {
        let fileupload = document.getElementById("file") as HTMLInputElement;
        let formData = new FormData();
        if (fileupload.files !== null && fileupload.files.length > 0) {
            formData.append('File', fileupload.files[0]);
            try{
                let request = await fetch('TableImageOCR/UploadTable', {
                    method: 'POST',
                    headers: {
                    },
                    body: formData
                });
                let response = await request.json();
    
                if (!response["error"]) {
                    this.importTableFromArray(response["table"] as string[][]);
                } else {
                    alert("Table response from server was invalid.");
                }
            }
            catch{
                alert("No response from server.");
            }
        } else {
            alert("Please choose a file to upload.")
        }
    }

    private createNewTable(rows: number, cols: number, keepdata: boolean){
        if (rows <= 30 && cols <= 30){
            this.addTableStateToUndoStack();
            let newtable: CellDetails[][] = [];
            for (let row = 0; row < rows; row++) {
                let rowarray: CellDetails[] = [];
                for (let col = 0; col < cols; col++) {
                    let cell = new CellDetails(new TablePoint(row, col), this.state.prefillcellscheck ? undefined : "");
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

    private async getStringFromClipboard(){
        return await navigator.clipboard.readText();
    }

    private async parseCSVFromClipboard(){
        let csvarray = this.parseCSV(await this.getStringFromClipboard());
        this.importTableFromArray(csvarray);
    }

    public testcsv(csv: string){
        this.importTableFromArray(this.parseCSV(csv));
    }

    private parseCSV(csv: string): string[][]{
        let results = Papa.parse(csv, {header: false});
        //TODO: Missing header info ATM.
        let data = results.data as string[][];

        let rows = data.length;
        let a = data.map(row => Object.values(row).length);
        let cols = Math.max(...a);

        let arr: string[][] = [];
        for (let row = 0; row < rows; row++) {
            let rowarray: string[] = [];
            let vals = Object.values(data[row]);
            for (let col = 0; col < cols; col++) {
                //let cell = new CellDetails(new TablePoint(row, col));
                //cell.setData(array[row][col]);
                let data = "";
                if (col < vals.length) data = vals[col].split("\n").join("");
                rowarray.push(data);
            }
            arr.push(rowarray);
        }

        return arr;
    }

    private importTableFromArray(array: string[][]){
        let rows = array.length;
        let cols = Math.max(...array.map(row => row.length)); //cols is lenght of longest row.
        if (rows <= 30 && cols <= 30){
            this.addTableStateToUndoStack();
            let newtable: CellDetails[][] = [];
            for (let row = 0; row < rows; row++) {
                let rowarray: CellDetails[] = [];
                for (let col = 0; col < cols; col++) {
                    let cell = new CellDetails(new TablePoint(row, col), array[row][col]);
                    rowarray.push(cell);
                }
                newtable.push(rowarray);
            }
            this.setState({table: newtable});
        }
        else {
            alert("Table dimensions too big.");
        }
    }

    private setSelectedCellData(data: string){
        this.addTableStateToUndoStack();
        let selectedcells = this.getSelectedCells();
        selectedcells.forEach(
            (cell) =>
            cell.setData(data)
        )
        this.setState(this.state);
    }

    private async requestSaveTable(){
        let formData = new FormData();
        formData.append("username", this.state.username);
        formData.append("password", this.state.password);
        formData.append("tablejson", JSON.stringify(this.state.table));
        formData.append("tablename", this.state.currenttablename);

        let request = await fetch('DB/InsertTable', {
            method: 'POST',
            headers: {
            },
            body: formData
        });
        let response = await request.json();
        if (!response){
            alert("Couldn't save table");
        }
        this.requestMyTables();
    }


    private async requestDeleteTable(id: string) {
        let formData = new FormData();
        formData.append("username", this.state.username);
        formData.append("password", this.state.password);
        formData.append("tableid", id);

        let request = await fetch('DB/DeleteTable', {
            method: 'POST',
            headers: {
            },
            body: formData
        });
        let response = await request.json();
        if (!response) {
            alert("Couldn't delete table");
        }
        this.requestMyTables();
    }

    private moveSelectedCells(dir: Direction){
        this.addTableStateToUndoStack();
        let newtable = cloneDeep(this.state.table);
        let selectedcells = this.getSelectedCellsFromTable(newtable);
        selectedcells.forEach(
            (cell) =>{
                if (cell.isMergeRoot()){
                    let children = cell.getMergeChildren();
                    children.forEach(
                        child_p => {
                            let childcell = newtable[child_p.row][child_p.col];
                            selectedcells.push(childcell);
                        })
                }
            })
        
        let unmovablemarges: TablePoint[] = [];
        switch(dir){
            case Direction.Up:
            case Direction.Left:
                for (let i = 0; i < selectedcells.length; i++) {
                    if(!unmovablemarges.includes(selectedcells[i].getMergeRoot()!)){ //may need to remove '!'
                        let result = this.moveSelectedCellsLoopContent(selectedcells, i, newtable, dir);
                        if (result !== undefined) unmovablemarges.push(result)
                    }
                }
                break;
            case Direction.Down:
            case Direction.Right:
                for (let i = selectedcells.length - 1; i >= 0; i--) {
                    if(!unmovablemarges.includes(selectedcells[i].getMergeRoot()!)){
                        let result = this.moveSelectedCellsLoopContent(selectedcells, i, newtable, dir);
                        if (result !== undefined) unmovablemarges.push(result)
                    }
                }
                break;
            default:
                break;
        }
        
        newtable = this.fixMerges(newtable);
        this.setState({table: newtable});
    }


    //Returns the merge root if that merge can't be moved.
    private moveSelectedCellsLoopContent(selectedcells: CellDetails[], i: number, newtable: CellDetails[][], dir: Direction): TablePoint | undefined{
        let cell = selectedcells[i];
        if(!(cell.isMergeChild() || cell.isMergeRoot)) {
            cell.move(dir); //need to handle merge parents and children here. Can push them to the selectedcells list.
            if (this.checkIfPointInTable(cell.p, newtable)){
                let oldcell = newtable[cell.p.row][cell.p.col];
                newtable[cell.p.row][cell.p.col] = cell;
                oldcell.move(this.getOppositedir(dir)); //Opposite direction
                newtable[oldcell.p.row][oldcell.p.col] = oldcell;
            }
        } else {
            if (!this.checkIfPointInTable(moveTablePoint(cell.p, dir), newtable)){
                return cell.getMergeRoot();
            } else {
                cell.move(dir); //need to handle merge parents and children here. Can push them to the selectedcells list.
                if (this.checkIfPointInTable(cell.p, newtable)){
                    let oldcell = newtable[cell.p.row][cell.p.col];
                    newtable[cell.p.row][cell.p.col] = cell;
                    oldcell.move(this.getOppositedir(dir)); //Opposite direction
                    newtable[oldcell.p.row][oldcell.p.col] = oldcell;
                }
            }
        }
        return undefined;
        
    }

    private getOppositedir(dir: Direction): Direction {
        switch(dir){
            case Direction.Up:
                return Direction.Down;
            case Direction.Down:
                return Direction.Up;
            case Direction.Left:
                return Direction.Right;
            case Direction.Right:
                return Direction.Left;   
        }
    }

    //Needs to understand merged cells?
    //Maybe make method to fix merges after table changes.
    private deleteRowHandler(){
        this.addTableStateToUndoStack();
        let newtable = cloneDeep(this.state.table);
        let selectedcells = this.getSelectedCellsFromTable(newtable);

        let rows = Array.from(new Set(selectedcells.map(cell => cell.p.row))).sort();

        for (let i = rows.length - 1; i >= 0; i--){
            let row = rows[i];
            this.deleteRow(row, newtable);
        }
        newtable = this.fixMerges(newtable);
        this.setState({table: newtable});
    }

    private deleteRow(row: number, table: CellDetails[][]){
        //Move each cell below up.
        for (let i = row + 1; i < table.length; i++){
            let tablerow = table[i];
            tablerow.forEach(
                (cell) => {
                    cell.move(Direction.Up);
                }
            );
        }
        if (table.length > 1){
            table.splice(row, 1);
        }
        return table;
    }

    private deleteColHandler(){
        this.addTableStateToUndoStack();
        let newtable = cloneDeep(this.state.table);
        let selectedcells = this.getSelectedCellsFromTable(newtable);

        let cols = Array.from(new Set(selectedcells.map(cell => cell.p.col))).sort();

        for (let i = cols.length - 1; i >= 0; i--){
            let col = cols[i];
            this.deleteCol(col, newtable);
        }
        newtable = this.fixMerges(newtable);
        this.setState({table: newtable});
    }

    private deleteCol(col: number, table: CellDetails[][]){
        table.forEach(
            (row) => {
                for (let i = col + 1; i < row.length; i++){
                    row[i].move(Direction.Left);
                }
                if (row.length > 1) row.splice(col, 1);
            });
        return table;
    }

    private setTableFormValues(rows: number, cols: number){
        if (rows > 30) rows = 30;
        if (rows < 1) rows = 1;
        if (cols > 30) cols = 30;
        if (cols < 1) cols = 1;
        this.setState({newtableform: [rows, cols]});
    }

    private checkIfPointInTable(p: TablePoint, table: CellDetails[][]): boolean{
        return (
            p.row >= 0 &&
            p.col >= 0 &&
            p.row < table.length && 
            p.col < table[0].length
        )
    }

    private getMissingPoints(points: TablePoint[]): TablePoint[]{
        let rows = points.map(p => p.row);
        let cols = points.map(p => p.col);
        
        let fullrect: string[] = [];
        rows.forEach(
            row =>{
                cols.forEach(
                    col =>{
                        fullrect.push(row.toString() + " " + col.toString());
                    })
            })
        let strpoints = points.map(p => p.toString());
        let ouput = fullrect.filter(p => !strpoints.includes(p));
        
        return ouput.map(str => new TablePoint(undefined, undefined, str));
    }

    private fixMerges(table: CellDetails[][]) {
        let mergeroots: CellDetails[] = [];
        for (let row = 0; row < table.length; row++) {
            for (let col = 0; col < table[0].length; col++) {
                let cell = table[row][col];
                if (cell.isMergeRoot()){
                    mergeroots.push(cell);
                   
                    cell.p = new TablePoint(row, col, undefined);
                    if (!cell.isMergeRoot()){
                        cell.unMerge();
                    }
                } else {
                    if (cell.getMergeRoot() !== undefined){
                        cell.unMerge();
                    }
                    cell.p = new TablePoint(row, col, undefined);
                }
            }
        }
        mergeroots.forEach(
            rootcell => {
                let children_p = rootcell.getMergeChildren();
                children_p = children_p.filter(child => this.checkIfPointInTable(child, table));
                children_p.forEach(
                    child_p => {
                        let child_cell = table[child_p.row][child_p.col];
                        child_cell.mergeAsChild(rootcell.p);
                        child_cell.hidden = true;
                    })
                if (children_p.length === 0){
                    if (children_p.length === 0) {
                        rootcell.mergeAsChild(rootcell.mergeroot!);
                    }else{
                        rootcell.unMerge();
                    }
                } else {
                    rootcell.mergeAsRoot(children_p);
                }
                
            })
        return table;
    }


    private async requestMyTables(){
        let formData = new FormData();
        formData.append("username", this.state.username);
        formData.append("password", this.state.password);

        let request = await fetch('DB/GetMyTables', {
            method: 'POST',
            headers: {
            },
            body: formData
        });
        let response = await request.json();
        let tables: [string, string][] = [];
        //let t = response[0]["Item1"];
        response.forEach(
            (item: any) => {
                tables.push([item["Item1"], item["Item2"]])
            }
        )
        
        this.setState({ mytables: tables });
        //loop through and add ot state.
        
    }

    private showMyTables(){
        return (
            <List>
                {this.state.mytables.map(
                    (table) => 
                        <ListItem key={parseInt(table[0])}>
                            <ListItemText>{table[1]}</ListItemText>
                            <Button onClick={() => this.requestTable(table[0])}>Load</Button>
                            <Button onClick={() => this.requestDeleteTable(table[0])}>Delete</Button>
                        </ListItem>
                    
                )
                }
            </List>
        );
    }

    private async requestTable(tableid: string){
        let formData = new FormData();
        formData.append("username", this.state.username);
        formData.append("password", this.state.password);
        formData.append("tableid", tableid);
        
        let request = await fetch('DB/GetTable', {
            method: 'POST',
            headers: {
            },
            body: formData
        });
        let responsetable = await request.json() as CellDetails[][];

        for (let row = 0; row < responsetable.length; row++) {
            for (let col = 0; col < responsetable[0].length; col++) {
                let cell = responsetable[row][col];
                let p: TablePoint = plainToClass(TablePoint, cell.p);
                cell.p = p;
                responsetable[row][col] = plainToClass(CellDetails, cell); //Convert the cell to an instance of the cell class.
            }
        }
        this.setState({ table: responsetable})
    }

    private getOutputPanelTabBar(){
        if (this.state.showoutput){
            return (
                <div id="outputdiv">
                    <AppBar position="static" >
                        <Tabs id="tabbar" variant="scrollable" value={this.state.tab} onChange={(e,v) => this.changeTab(e,v)}>
                            <Tab label="LaTeX" tabIndex={0} style={{minWidth:"20%"}}/>
                            <Tab label="HTML" tabIndex={1} style={{minWidth:"20%"}}/>
                            <Tab label="Text" tabIndex={2} style={{minWidth:"20%"}}/>
                           {/* <Tab label="PNG" tabIndex={3} style={{minWidth:"20%"}}/>*/}
                            <Tab label="CSV" tabIndex={3} style={{minWidth:"20%"}}/>
                        </Tabs>
                    </AppBar>
                    <div id="tabContentDiv">
                        {this.getOutputPanelTabContent()}
                    </div>
                </div>

            );
        }
    }

    private getTopMenuTabBar(){
        return (
            <div >
                <AppBar position="static" >
                    <Tabs id="tabbar" variant="scrollable" value={this.state.topmenutab} onChange={(e,v) => this.changeTab2(e,v)}>
                        <Tab id="toptab1" label="Create/Save Table" tabIndex={0} style={{minWidth:"20%"}}/>
                        <Tab id="toptab2" label="Import Table" tabIndex={1} style={{minWidth:"20%"}}/>
                        <Tab id="toptab3" label="Cell Styling" tabIndex={2} style={{minWidth:"20%"}}/>
                        <Tab id="toptab4" label="Modify Cells" tabIndex={3} style={{minWidth:"20%"}}/>
                    </Tabs>
                </AppBar>
                <div id="controlTabContentDiv">
                    {this.getTopMenuTabContent()}
                </div>
            </div>
        );
    }

    private getTopMenuTabContent(){
        switch(this.state.topmenutab) {
            case 0:
                return (
                    <div>
                        <div className="minimenudiv">
                            <List dense={true}>
                                <ListItem>
                                    <Button onClick={() => this.setState({showaccountdialog: !this.state.showaccountdialog})}>Access My Account</Button>
                                    <Dialog open={this.state.showaccountdialog} aria-labelledby="simple-dialog-title" onClose={() => this.setState({showaccountdialog: false})} >
                                        <DialogTitle id="simple-dialog-title">Account</DialogTitle>
                                        <List>
                                            <ListItem>
                                                <ListItemText primary="Username"/>
                                                <input value={this.state.username} onChange={(e) => this.setState({username: e.target.value})} type="text"/>
                                            </ListItem>
                                            <ListItem>
                                                <ListItemText primary="Password"/>
                                                <input value={this.state.password} onChange={(e) => this.setState({password: e.target.value})} type="password"/>
                                            </ListItem>

                                            <ListItem>
                                                <ListItemText primary="Save Current Table" />
                                                <input value={this.state.currenttablename} className="tablesavetextbox" onChange={(e) => this.setState({ currenttablename: e.target.value })} type="text" />
                                                <Button onClick={() => this.requestSaveTable()}>Save</Button>
                                            </ListItem>

                                            <ListItem>
                                                <Button onClick={() => this.requestMyTables()}>Fetch My Tables</Button>
                                            </ListItem>
                                            {
                                                this.showMyTables()
                                            }

                                        </List>
                                    </Dialog>
                                </ListItem>

                                <ListItem>
                                    <Button onClick={() => this.setState({showoutput: !this.state.showoutput})}>Toggle Output Menu</Button>
                                </ListItem>
                                <Divider component="li" variant="middle" />
                                

                                <ListItem>
                                    <ListItemText primary={"Rows: " + this.state.table.length} />
                                    <ListItemText primary={"Cols: " + this.state.table[0].length} />
                                </ListItem>

                                <ListItem>
                                    <ListItemText primary="Show Bonus Padding"/>
                                    <Checkbox checked={this.state.extrapadding} onChange={() => this.setState({extrapadding: !this.state.extrapadding})}/>
                                </ListItem>

                                <Divider component="li" variant="middle" />
                                <ListItem>
                                    <Button id="undobutton" onClick={() => this.undo()}>Undo</Button>
                                    <Button id="redobutton" onClick={() => this.redo()}>Redo</Button>
                                </ListItem>
                                
                                
                            </List>
                        </div>
                        <div className="minimenudiv">
                            <List dense={true}>
                                <ListItem divider>
                                    <b>Create Table</b>
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="Rows"/>
                                    <input type="number" id="rowsinput" name="rowsinput" min="1" max="30" value={this.state.newtableform[0]} onChange={(e) => this.setTableFormValues(parseInt(e.target.value), this.state.newtableform[1])}/>
                                </ListItem>

                                <ListItem>
                                    <ListItemText primary="Cols"/>
                                    <input type="number" id="colsinput" name="colsinput" min="1" max="30" value={this.state.newtableform[1]} onChange={(e) => this.setTableFormValues(this.state.newtableform[0], parseInt(e.target.value))}/>
                                </ListItem>    

                                <ListItem>
                                    <ListItemText primary="Prefill Cells"/>
                                    <Checkbox checked={this.state.prefillcellscheck} onChange={() => this.setState({prefillcellscheck: !this.state.prefillcellscheck})}/>
                                </ListItem>

                                <ListItem>
                                        <Button onClick={() => this.createNewTable(this.state.newtableform[0], this.state.newtableform[1], false)}>Create Table</Button>
                                </ListItem>
                            </List>

                        </div>

                        <div className="minimenudiv">
                            <List dense={true}>
                                <ListItem divider>
                                    <b>Global Controls</b>
                                </ListItem>
                                
                                <ListItem id="addrowbutton" button onClick={() => this.addRow()}>Add Row</ListItem>
                                <ListItem id="addcolbutton" button onClick={() => this.addCol()}>Add Column</ListItem>
                                <ListItem>
                                    <ListItemText primary="Prefill Cells"/>
                                    <Checkbox checked={this.state.prefillcellscheck} onChange={() => this.setState({prefillcellscheck: !this.state.prefillcellscheck})}/>
                                </ListItem>

                                <Divider component="li" variant="middle" />
                                <ListItem button onClick={() => this.selectAllCells()}>Select All</ListItem>
                                <ListItem button onClick={() => this.deselectAllCells()}>Select None</ListItem>
                                
                            </List>

                        </div>
                    </div>
                    

                );
            case 1:
                return (
                    <List dense={true}>
                            <ListItem divider>
                                <b>Import Table Data</b>
                            </ListItem>
                            
                            <ListItem className="listitemtitle">
                                Upload Table Image
                            </ListItem>
                            
                            <ListItem >
                                <input type="file" id="file" accept="image/*"/>
                            </ListItem>
                            <ListItem>
                                <Button onClick={() => this.UploadTable()}>Upload</Button>
                            </ListItem>
                            <Divider component="li" variant="middle" />
                            <ListItem button onClick={() => this.parseCSVFromClipboard()}>Import CSV from clipboard</ListItem>
                        </List>

                );
            case 2:
                return (
                    <div>
                        
                        <div className="minimenudiv">
                            <List dense={true}>
                                <ListItem divider>
                                    <b>Styles</b>
                                </ListItem>
                                <ListItem button onClick={() => this.setTableStyle(1)}>
                                    Simple Lines
                                </ListItem>
                                <ListItem button onClick={() => this.setTableStyle(2)}>
                                    Alternate Shading
                                </ListItem>
                                <ListItem button onClick={() => this.setTableStyle(3)}>
                                    Simple Lines + Alternate Shading
                                </ListItem>
                            </List>
                        </div>

                        <div className="minimenudiv">
                            <List dense={true}>
                                <ListItem divider>
                                    <b>Colour</b>
                                </ListItem>
                                <ListItem>
                                    Colour
                                    <input type="color" onChange={e => this.chooseColour(e)} ref={this.colourpickerref} className="colour-picker"/>
                                </ListItem>
                                <ListItem button onClick={() => this.setCellBackgroundColours()}>
                                    <ListItemText primary="Set backgrounds to this colour" />
                                </ListItem>
                                <ListItem button onClick={() => this.setCellBorderColours()}>
                                    <ListItemText primary="Set borders to this colour" />
                                </ListItem>

                                <ListItem button onClick={() => this.setCellTextColours()}>
                                    <ListItemText primary="Set text to this colour" />
                                </ListItem>

                                
                                

                                
                            </List>
                        </div>
                        <div className="minimenudiv">
                            <List dense={true}>
                                <ListItem divider>
                                    <b>Text Align</b>
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="Horizontal"/>
                                </ListItem>

                                <ListItem>
                                    <Button onClick={() => this.setHorizontalTextAlignment("left")}>Left</Button>
                                    <Button onClick={() => this.setHorizontalTextAlignment("center")}>Centre</Button>
                                    <Button onClick={() => this.setHorizontalTextAlignment("right")}>Right</Button>
                                </ListItem>

                                <Divider component="li" variant="middle" />
                                <ListItem>
                                    <ListItemText primary="Vertical Text Alignment:"/>
                                </ListItem>

                                <ListItem>
                                    <Button onClick={() => this.setVerticalTextAlignment("top")}>Top</Button>
                                    <Button onClick={() => this.setVerticalTextAlignment("middle")}>Middle</Button>
                                    <Button onClick={() => this.setVerticalTextAlignment("bottom")}>Bottom</Button>
                                </ListItem>

                                

                            </List>
                        </div>
                        <div className="minimenudiv">
                            <List dense={true}>
                            <ListItem divider>
                                    <b>Modify Borders</b>
                                </ListItem>
                            <ListItem>
                                    <ToggleButtonGroup>
                                        <ToggleButton value="top" size="small" selected={this.state.bordermodify[0]}  onClick={(e) => this.selectBorderToModify(0)}>
                                            Top
                                        </ToggleButton>
                                        <ToggleButton value="right" size="small" selected={this.state.bordermodify[1]}  onClick={(e) => this.selectBorderToModify(1)}>
                                            Right
                                        </ToggleButton>
                                        <ToggleButton value="bottom" size="small" selected={this.state.bordermodify[2]}  onClick={(e) => this.selectBorderToModify(2)}>
                                            Bottom
                                        </ToggleButton>
                                        <ToggleButton value="left" size="small" selected={this.state.bordermodify[3]}  onClick={(e) => this.selectBorderToModify(3)}>
                                            Left
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </ListItem>

                                <ListItem>
                                    <ListItemText primary="Border Style:" />
                                    <select name="chooseborderstyle" onChange={(e) => this.chooseBorderStyle(e)}>
                                        <option value={BorderStyle.Solid}>Solid</option>
                                        <option value={BorderStyle.Dotted}>Dotted</option>
                                        <option value={BorderStyle.Dashed}>Dashed</option>
                                        <option value={BorderStyle.None}>None</option>
                                    </select>
                                </ListItem>

                            </List>
                        </div>

                    </div>
                    

                );
            case 3:
                return (
                    <div>
                        <div className="minimenudiv">
                            <List dense={true}>
                                <ListItem divider>
                                    <b>Selected Cell Controls</b>
                                </ListItem>

                                <ListItem id="deleterowbutton" button onClick={() => this.deleteRowHandler()}>Delete Selected Rows</ListItem>
                                <ListItem id="deletecolbutton" button onClick={() => this.deleteColHandler()}>Delete Selected Cols</ListItem>
                                <Divider component="li" variant="middle" />



                                <ListItem >
                                    <div>
                                        <input style={{width: "100px"}} type="text" id="celltextinput" name="celltextinput" value={this.state.changedatafield} onChange={(e) => this.setState({changedatafield: e.target.value})}/>
                                        <Button onClick={() => this.setSelectedCellData(this.state.changedatafield)}>Set Data</Button>
                                    </div>
                                </ListItem>

                                <ListItem button onClick={() => this.setSelectedCellData("")}>
                                    <ListItemText primary="Clear Data"/>
                                </ListItem>
                            </List>
                        </div>
                        <div className="minimenudiv">
                            <ListItem divider>
                                <b>Merge/Move Cells</b>
                            </ListItem>
                            <List dense={true}>
                                <ListItem id="mergebutton" button onClick={() => this.mergeCells()}>
                                    <ListItemText primary="Merge"/>
                                </ListItem>
                                <ListItem button onClick={() => this.splitCells()}>
                                    <ListItemText primary="Split"/>
                                </ListItem>
                                <Divider component="li" variant="middle" />
                                <ListItem>
                                    <ListItemText primary="Move Selected Cells"/>
                                </ListItem>
                                <ListItem>
                                    <Button className="smallButton" size="small" id="movecellsupbutton" onClick={() => this.moveSelectedCells(Direction.Up)}>Up</Button>
                                    <Button className="smallButton" size="small" id="movecellsdownbutton" onClick={() => this.moveSelectedCells(Direction.Down)}>Down</Button>
                                    <Button className="smallButton" size="small" id="movecellsleftbutton" onClick={() => this.moveSelectedCells(Direction.Left)}>Left</Button>
                                    <Button className="smallButton" size="small" id="movecellsrightbutton" onClick={() => this.moveSelectedCells(Direction.Right)}>Right</Button>
                                </ListItem>


                            </List>
                        </div>
                        
                    </div>

                );

        }
    }

    private setTableStyle(style: number){
        this.addTableStateToUndoStack();
        //Clear the current style
        this.getAllCells().forEach(
            cell => {
                cell.setBackgroundColour("");
                cell.setBorderStyle([BorderStyle.None, BorderStyle.None, BorderStyle.None, BorderStyle.None]);
            })
        //Set new style
        switch(style){
            case 1:
                this.setSimpleLinesStyle();
                break;
            case 2:
                this.setAlternateShadingStyle();
                break;
            case 3:
                this.setSimpleLinesStyle();
                this.setAlternateShadingStyle();
                break;
        }
        let newtable = cloneDeep(this.state.table);
        this.setState({table: newtable});
    }

    private setSimpleLinesStyle(){
        if (this.state.table.length > 1 && this.state.table[0].length > 1){
            let row0 = this.getRow(0);
            let row1 = this.getRow(1);
            let col0 = this.getCol(0);
            let col1 = this.getCol(1);
            row0.forEach(
                cell => {
                    cell.setBorderStyle([BorderStyle.None, BorderStyle.None, BorderStyle.Solid, BorderStyle.None]);
                })
            row1.forEach(
                cell => {
                    cell.setBorderStyle([BorderStyle.Solid, BorderStyle.None, BorderStyle.None, BorderStyle.None]);
                })
            col0.forEach(
                cell => {
                    cell.setBorderStyle([BorderStyle.None, BorderStyle.Solid, BorderStyle.None, BorderStyle.None]);
                })
            col1.forEach(
                cell => {
                    cell.setBorderStyle([BorderStyle.None, BorderStyle.None, BorderStyle.None, BorderStyle.Solid]);
                })
            this.state.table[0][0].setBorderStyle([BorderStyle.None, BorderStyle.Solid, BorderStyle.Solid, BorderStyle.None])
            this.state.table[0][1].setBorderStyle([BorderStyle.None, BorderStyle.None, BorderStyle.Solid, BorderStyle.Solid])
            
        }
    }

    private setAlternateShadingStyle() {
        for (let i = 1; i < this.state.table.length; i = i + 2){
            console.log("test");
            let row = this.getRow(i);
            row.forEach (
                cell => {
                    cell.setBackgroundColour("#D4D4D4");
                }
            )
        }
    }

    public render() {
        return (
            <div className="adiv">
                <div id={this.state.showoutput ? "topdiv": "topdivwide"}>
                    {this.getTopMenuTabBar()}
                </div>
                {this.drawTable()}
                {this.getOutputPanelTabBar()}
            </div>
        );
    }
    
}

export default MyTable;