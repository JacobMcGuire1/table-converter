import {escapeLatex, escapeHTML, TablePoint, moveTablePoint, Direction, BorderStyle} from './Globals'
import * as React from 'react';
import './MyTable.css';
import { plainToClass, Type } from 'class-transformer';
import 'reflect-metadata';
import Color from 'color';



export {CellDetails}


class CellDetails {
    @Type(() => TablePoint)
    public p: TablePoint;
    public hidden: boolean = false;
    private editing: boolean = false;
    private selected: boolean = false;
    public mergeroot: string = "";
    private mergechildren: string[] = [];
    private data: string = "";
    private backgroundcolour: string = "";
    private textcolour: string = "";
    public borderstyles: [BorderStyle, BorderStyle, BorderStyle, BorderStyle] = [BorderStyle.Solid, BorderStyle.Solid, BorderStyle.Solid, BorderStyle.Solid];
    public bordercolours: [string, string, string, string] = ["#000000", "#000000", "#000000", "#000000"];
    public width: number = 0;
    public height: number = 0;
    public csstextalign: string = "center";
    public verticalalign: string = "middle";
    public borders: [boolean, boolean, boolean, boolean] = [true, true, true, true]; //T R B L

    constructor(p: TablePoint, data: string | undefined) {
        this.p = p;
        if (data === undefined){
            if (p){
                this.setData(p.toString());
            }
        }else{
            this.setData(data);
        }

        /*if (data !== undefined){
            this.setData(data);
        }else{
            if (p !== undefined) this.setData(p.toString());
        }*/
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
    public addMergeChild(child: string){
        this.mergechildren.push(child);
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
    public isMergeRoot(){
        return this.mergeroot === this.p.toString();
    }
    public isMergeChild(){
        return ((this.mergeroot !== "") && (this.mergeroot !== this.p.toString()))
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
    public setBackgroundColour(chosencolour: string) {
        this.backgroundcolour = chosencolour;
    }
    public setTextColour(chosencolour: string) {
        this.textcolour = chosencolour;
    }
    public setBorderColour(chosencolours: [string, string, string, string]) {
        this.bordercolours = chosencolours;
    }
    public setBorderStyle(style: [BorderStyle, BorderStyle, BorderStyle, BorderStyle]) {
        this.borderstyles = style;
    }
    public getData(): string {
        return this.data;
    }
    //Needs to modify merge list too.
    //What if merge root leaves table?
    //What if moved on top of a merge?
    public move(dir: Direction): TablePoint[]{
        if (this.mergeroot === this.p.toString()) this.mergeroot = moveTablePoint(new TablePoint(undefined, undefined, this.mergeroot), dir).toString();
        this.p = moveTablePoint(this.p, dir);
        let children = this.mergechildren.map(child => new TablePoint(undefined, undefined, child));
        let newchildren = children.map(child => moveTablePoint(child, dir));
        this.mergechildren = newchildren.map(child => child.toString());
        
        return [];
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
    private getLatexTextColour() {
        if (this.textcolour === "") return "";
        return "\\color[HTML]{" + this.textcolour.replace('#', '').toUpperCase() + "}";
    }
    private getBotLeftPoint(): TablePoint{
        let child_ps  = this.mergechildren.map(str => new TablePoint(undefined, undefined, str));
        let row = Math.max(...child_ps.map(child => child.row));
        let col = Math.min(...child_ps.map(child => child.col));
        return new TablePoint(row, col, undefined);
    }
    private fixLatexLinebreaks(input: string){
        let lines = input.split("\n");
        if (lines.length === 1) return input;
        return "\\thead{" + lines.join("\\\\") + "}";
    }
    public getBotLeftOfMultiRowMerge(): [TablePoint, string] | undefined {
        let data = this.getLatexBackgroundColour() + this.fixLatexLinebreaks(escapeLatex(this.getData()));
        let borders = this.borderstyles.map(style => style !== BorderStyle.None);
        let LRborders = [borders[3] ? "|" : " ", borders[1] ? "|" : " "];        

        //If it's a normal unmerged cell.
        if (this.mergeroot === "") {
            return undefined;
        }

        if (this.mergeroot === this.p.toString()) {
            let size = this.getMergeSize();
            let h = size[0];
            let w = size[1];
            if (w === 0) {
                return [this.getBotLeftPoint(), "\\multicolumn{1}{" + LRborders[0] + this.csstextalign.charAt(0) + LRborders[1] + "}{" + "\\multirow{-" + (h + 1).toString() + "} {*} {" + this.getLatexTextColour() + data + "}}  &"];
            }
            if (h === 0) {
                return undefined;
            }
            return [this.getBotLeftPoint(), "\\multicolumn{" + (w + 1).toString() + "}{" + LRborders[0] + this.csstextalign.charAt(0) + LRborders[1] + "}{" + "\\multirow{-" + (h + 1).toString() + "} {*} {" + this.getLatexTextColour() + data + "}" + "} &"];
        }  
        return undefined;
    }
    public getLatex(leftmergecells: any): string {
        let data = this.getLatexBackgroundColour() + this.fixLatexLinebreaks(escapeLatex(this.getData()));
        let borders = this.borderstyles.map(style => style !== BorderStyle.None);
        let LRborders = [borders[3] ? "|" : " ", borders[1] ? "|" : " "];        

        //If it's a normal unmerged cell.
        if (this.mergeroot === "") {
            data = "\\multicolumn{1}{" + LRborders[0] + this.csstextalign.charAt(0) + LRborders[1] + "}{" + this.getLatexTextColour() + data + "}";
            return data + " &";
        }
        //If it's the root cell of a group of merged cells.
        if (this.mergeroot === this.p.toString()) {
            let size = this.getMergeSize();
            let h = size[0];
            let w = size[1];
            if (w === 0) {
                let result = "\\multicolumn{" + (w + 1).toString() + "}{|c|}{" + this.getLatexBackgroundColour() + "} &";
                return  result;
            }
            if (h === 0) {
                return "\\multicolumn{" + (w + 1).toString() + "}{" + LRborders[0] + this.csstextalign.charAt(0) + LRborders[1] + "}{" + this.getLatexTextColour() + data + "} &";
            }
            return "\\multicolumn{" + (w + 1).toString() + "}{|c|}{" + this.getLatexBackgroundColour() + "} &";
        }
        //return "THIS CELL SHOULD NOT BE DISPLAYED";
        let rootp = new TablePoint(undefined, undefined, this.mergeroot);
        if (this.p.row > rootp.row) {
            let leftmerge = leftmergecells[this.p.toString()];
            if (leftmerge !== undefined) {
                return "\\multicolumn{" + (leftmerge + 1).toString() + "}{|c|}{" + this.getLatexBackgroundColour() + "} &";
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
        if (this.mergeroot === "" && this.borderstyles[2] !== BorderStyle.None) return [this.p];
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
        if (this.mergeroot === "" && this.borderstyles[3] !== BorderStyle.None) return [this.p];
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
        html += "padding: 5px;";
        html += "text-align: " + this.csstextalign + ";";
        html += "border-top:" + this.getcssborderstyle(0)  + ";";
        html += "border-right:" + this.getcssborderstyle(1)  + ";";
        html += "border-bottom:" + this.getcssborderstyle(2)  + ";";
        html += "border-left:" + this.getcssborderstyle(3)  + ";";
        html += "vertical-align:" + this.verticalalign + ";";
        html += "color:" + this.textcolour + ";";
        html += "'>" + escapeHTML(this.getData()) + "</td >\n";

        return html;
    }
    private getcssborderstyle(i: number){
        let txt = " 1px " + " " + this.borderstyles[i].toString() + " " + this.bordercolours[i].toString();
        return txt;
    }
    public setData(data: string) {
        this.data = data;
    }
    public copy(): CellDetails {
        return Object.assign({}, this);
    }
    public isVisible() {
        return (this.mergeroot === this.p.toString()) || (this.mergeroot === "");
    }
    private getparagraphcss() {
        //let styling: CSS.Properties = {
        //    textAlign: this.csstextalign as any,
        //}
        return { textAlign: this.csstextalign};
    }
    public setHorizontalTextAlignment(alignment : string) {
        this.csstextalign = alignment;
    }

    public setVerticalTextAlignment(alignment : string) {
        this.verticalalign = alignment;
    }
    private moveCursorToEnd(e: React.FocusEvent<HTMLTextAreaElement>) {
        let value = e.target.value;
        e.target.value = "";
        e.target.value = value;
    }
    private getLengthOfLongestLine(str: string): number{
        return Math.max(...str.split("\n").map(s => s.length));
    }
    private getMergeSpan(){
        let size = this.getMergeSize();
        return {rowspan: size[0] + 1, colspan: size[1] + 1};
    }
    private combineColours(){
        let a = this.getHexBackgroundColour();
        let pink = Color("#FFC0CB");
        if (a !== ""){
            let bcgnd = Color(a);
            return pink.mix(bcgnd).hex().toString();
        }
        return pink.toString();
        //let new = normal(hexToRgb(pink), hexToRgb(bcgnd));
    }
    public draw(xpixel: number, ypixel: number, colwidths: number[], rowheights: number[], horizontaldividersize: number, verticaldividersize: number, changeData: Function, selectCell: Function, deSelectCell: Function, enableEditMode: Function, disableEditMode: Function) {
        let span = this.getMergeSpan();
        if (this.isVisible()) {
            return (
                <td 
                    key={this.p.toString()} 
                    rowSpan={span.rowspan} 
                    colSpan={span.colspan} 
                    id={this.p.toString()} 
                    style={{
                        borderTop: this.getcssborderstyle(0), 
                        borderRight: this.getcssborderstyle(1), 
                        borderBottom: this.getcssborderstyle(2), 
                        borderLeft: this.getcssborderstyle(3), 
                        background: this.isSelected() ? this.combineColours() : this.getHexBackgroundColour(),
                        padding: "5px",
                        verticalAlign: this.verticalalign
                    }}
                        onDoubleClick={(e) => enableEditMode(this)}
                        >
                    <div>
                        {
                            this.editing ?
                            <textarea className="cell-input" value={this.getData()} rows={ this.getData().split("\n").length + 1 } cols={ this.getLengthOfLongestLine(this.getData()) + 4 } tabIndex={0} onChange={(e) => changeData(this, e.target.value)} onBlur={(e) => disableEditMode(this)} autoFocus={true} onFocus={(e) => this.moveCursorToEnd(e)}/>
                            :
                            <p className="celltext" style={{textAlign: this.csstextalign as any, color: this.textcolour}}>{this.getData()}</p>
                        }
                    </div>
                </td>
            );
        }
    }
}