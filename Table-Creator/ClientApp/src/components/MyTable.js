"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
//import React from 'react'; // we need this to make JSX compile
var React = require("react");
require("./MyTable.css");
var table_1 = require("table");
var core_1 = require("@material-ui/core");
function escapeLatex(str) {
    str = str.split("\\").join("\\textbackslash");
    str = str.split("&").join("\\&");
    return str;
}
//Stolen 
function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
var TablePoint = /** @class */ (function () {
    function TablePoint(row, col, p) {
        if (p === undefined) {
            if (row !== undefined) {
                this.row = row;
                this.col = col;
            }
            else {
                this.row = 0;
                this.col = 0;
            }
        }
        else {
            var points = p.split(" ");
            this.row = parseInt(points[0]);
            this.col = parseInt(points[1]);
        }
    }
    TablePoint.prototype.toString = function () {
        return (this.row.toString() + " " + this.col.toString());
    };
    TablePoint.prototype.equals = function (p) {
        return (this.row === p.row && this.col === p.col);
    };
    return TablePoint;
}());
var CellDetails = /** @class */ (function () {
    function CellDetails(p) {
        this.hidden = false;
        this.editing = false;
        this.selected = false;
        this.mergeroot = "";
        this.mergechildren = [];
        this.data = "";
        this.backgroundcolour = "";
        this.borderstyle = "solid";
        this.bordercolour = "#000000";
        this.width = 0;
        this.height = 0;
        this.csstextalign = "center";
        this.borders = [true, true, true, true]; //T R B L
        this.p = p;
        this.setData(p.toString());
    }
    CellDetails.prototype.isSelected = function () {
        return this.selected;
    };
    CellDetails.prototype.select = function () {
        this.selected = true;
    };
    CellDetails.prototype.deselect = function () {
        this.selected = false;
    };
    CellDetails.prototype.getMergeRoot = function () {
        return this.mergeroot;
    };
    CellDetails.prototype.getMergeChildren = function () {
        return this.mergechildren;
    };
    CellDetails.prototype.unMerge = function () {
        this.mergeroot = "";
        this.mergechildren = [];
        this.hidden = false;
        this.width = this.getTextWidth();
        this.height = this.getTextHeight();
    };
    CellDetails.prototype.mergeAsChild = function (root) {
        this.mergeroot = root;
        this.mergechildren = [];
        this.hidden = true;
    };
    CellDetails.prototype.mergeAsRoot = function (children) {
        this.mergeroot = this.p.toString();
        this.mergechildren = children;
        this.hidden = false;
        this.width = this.getTextWidth();
        this.height = this.getTextHeight();
    };
    CellDetails.prototype.enableEdit = function () {
        this.editing = true;
    };
    CellDetails.prototype.disableEdit = function () {
        this.editing = false;
    };
    CellDetails.prototype.setBackgroundColour = function (chosencolour) {
        this.backgroundcolour = chosencolour;
    };
    CellDetails.prototype.setBorderColour = function (chosencolour) {
        this.bordercolour = chosencolour;
    };
    CellDetails.prototype.setBorderStyle = function (style) {
        this.borderstyle = style;
    };
    CellDetails.prototype.getTextWidth = function () {
        if (this.isVisible()) {
            var canvas = document.createElement('canvas'), context = canvas.getContext('2d');
            var lines = this.data.split("\n");
            var largestwidth = 0;
            for (var i = 0; i < lines.length; i++) {
                var width = (context === null || context === void 0 ? void 0 : context.measureText(lines[i]).width) * 1.75;
                if (width > largestwidth) {
                    largestwidth = width;
                }
            }
            return largestwidth;
        }
        else {
            return -1;
        }
    };
    CellDetails.prototype.getData = function () {
        return this.data;
    };
    CellDetails.prototype.getMergeSize = function () {
        if (this.mergechildren == [])
            return [-1, -1];
        var mincol = this.p.col;
        var maxcol = this.p.col;
        var minrow = this.p.row;
        var maxrow = this.p.row;
        this.mergechildren.forEach(function (item) {
            var p = new TablePoint(undefined, undefined, item);
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
    };
    CellDetails.prototype.getLatexBackgroundColour = function () {
        if (this.backgroundcolour === "")
            return "";
        return "\\cellcolor[HTML]{" + this.backgroundcolour.replace('#', '').toUpperCase() + "}";
    };
    CellDetails.prototype.getLatex = function (leftmergecells) {
        var data = this.getLatexBackgroundColour() + escapeLatex(this.getData());
        var LRborders = [this.borders[3] ? "|" : " ", this.borders[1] ? "|" : " "];
        //If it's a normal unmerged cell.
        if (this.mergeroot === "") {
            data = "\\multicolumn{1}{" + LRborders[0] + this.csstextalign.charAt(0) + LRborders[1] + "}{" + data + "}";
            return data + " &";
        }
        //If it's the root cell of a group of merged cells.
        if (this.mergeroot === this.p.toString()) {
            var size = this.getMergeSize();
            var h = size[0];
            var w = size[1];
            if (w === 0) {
                var result = "\\multicolumn{1}{" + LRborders[0] + this.csstextalign.charAt(0) + LRborders[1] + "}{" + "\\multirow{" + (h + 1).toString() + "} {*} {" + data + "}}  &";
                return result;
            }
            if (h === 0) {
                return "\\multicolumn{" + (w + 1).toString() + "}{" + LRborders[0] + this.csstextalign.charAt(0) + LRborders[1] + "}{" + data + "} &";
            }
            return "\\multicolumn{" + (w + 1).toString() + "}{" + LRborders[0] + this.csstextalign.charAt(0) + LRborders[1] + "}{" + "\\multirow{" + (h + 1).toString() + "} {*} {" + data + "}" + "} &";
        }
        //return "THIS CELL SHOULD NOT BE DISPLAYED";
        var rootp = new TablePoint(undefined, undefined, this.mergeroot);
        if (this.p.row > rootp.row) {
            var leftmerge = leftmergecells[this.p.toString()];
            if (leftmerge !== undefined) {
                return "\\multicolumn{" + (leftmerge + 1).toString() + "}{|c|}{} &";
            }
            //return "&";
        }
        return "";
    };
    CellDetails.prototype.getBottomLines = function () {
        if (this.mergeroot === this.p.toString()) {
            var bottom_1 = this.p.row;
            var cells_1 = [this.p];
            this.mergechildren.forEach(function (item) {
                var p = new TablePoint(undefined, undefined, item);
                cells_1.push(p);
                if (p.row > bottom_1)
                    bottom_1 = p.row;
            });
            return cells_1.filter(function (cell) { return cell.row === bottom_1; }); //Returns the cells at the bottom of the merge.
        }
        if (this.mergeroot === "")
            return [this.p];
        return []; //If it's child in a merge, return nothing.
    };
    CellDetails.prototype.getLeftLines = function () {
        if (this.mergeroot === this.p.toString()) {
            var left_1 = this.p.col;
            var cells_2 = [this.p];
            this.mergechildren.forEach(function (item) {
                var p = new TablePoint(undefined, undefined, item);
                if (p.col === left_1)
                    cells_2.push(p);
            });
            return cells_2; //Returns the cells at the bottom of the merge.
        }
        if (this.mergeroot === "")
            return [this.p];
        return []; //If it's child in a merge, return nothing.
    };
    CellDetails.prototype.getHexBackgroundColour = function () {
        return this.backgroundcolour;
    };
    CellDetails.prototype.getHTML = function () {
        if (this.mergeroot !== "" && this.mergeroot !== this.p.toString())
            return ""; //Return nothing if this cell is hidden by being a child of a merge.
        var mergetext = "";
        if (this.mergeroot === this.p.toString()) {
            var size = this.getMergeSize();
            var h = size[0];
            var w = size[1];
            if (h !== 0) {
                mergetext += " rowspan='" + (h + 1).toString() + "'";
            }
            if (w !== 0) {
                mergetext += " colspan='" + (w + 1).toString() + "'";
            }
        }
        var html = "<td ";
        html += mergetext;
        //CSS styling
        var colour = this.getHexBackgroundColour();
        html += " style = '";
        if (colour !== "") {
            html += "background-color:" + colour + ";";
        }
        html += "border: 1px solid " + this.bordercolour + ";";
        html += "padding: 5px;";
        html += "text-align: center;";
        html += "border-style:" + this.borderstyle + ";";
        html += "'>" + escapeHTML(this.getData()) + "</td >\n";
        return html;
    };
    CellDetails.prototype.getTextHeight = function () {
        var lines = this.data.split("\n");
        return lines.length * 25;
    };
    CellDetails.prototype.setData = function (data) {
        this.data = data;
        this.width = this.getTextWidth();
        this.height = this.getTextHeight();
    };
    CellDetails.prototype.copy = function () {
        return Object.assign({}, this);
    };
    CellDetails.prototype.isVisible = function () {
        return (this.mergeroot === this.p.toString()) || (this.mergeroot === "");
    };
    CellDetails.prototype.calculateWidth = function (colwidths, horizontaldividersize) {
        if (this.mergeroot === this.p.toString()) {
            var colset_1 = new Set();
            colset_1.add(this.p.col);
            this.mergechildren.forEach(function (item) {
                var p = new TablePoint(undefined, undefined, item);
                colset_1.add(p.col);
            });
            var width_1 = 0;
            colset_1.forEach(function (x) { return width_1 = colwidths[x] + width_1 + horizontaldividersize; });
            width_1 = width_1 - horizontaldividersize;
            return width_1;
        }
        return colwidths[this.p.col];
    };
    CellDetails.prototype.calculateHeight = function (rowheights, verticaldividersize) {
        if (this.mergeroot === this.p.toString()) {
            var rowset_1 = new Set();
            rowset_1.add(this.p.row);
            this.mergechildren.forEach(function (item) {
                var p = new TablePoint(undefined, undefined, item);
                rowset_1.add(p.row);
            });
            var height_1 = 0;
            rowset_1.forEach(function (x) { return height_1 = rowheights[x] + height_1 + verticaldividersize; });
            height_1 = height_1 - verticaldividersize;
            return height_1;
        }
        return rowheights[this.p.row];
    };
    CellDetails.prototype.getparagraphcss = function () {
        //let styling: CSS.Properties = {
        //    textAlign: this.csstextalign as any,
        //}
        return { textAlign: this.csstextalign };
    };
    CellDetails.prototype.setTextAlignment = function (alignment) {
        this.csstextalign = alignment;
    };
    CellDetails.prototype.draw = function (xpixel, ypixel, colwidths, rowheights, horizontaldividersize, verticaldividersize, changeData, selectCell, deSelectCell, enableEditMode, disableEditMode, hlines) {
        if (this.isVisible()) {
            return (React.createElement(SVGCell, { key: this.p.toString(), cell: this, xpixel: xpixel, ypixel: ypixel, width: this.calculateWidth(colwidths, horizontaldividersize), height: this.calculateHeight(rowheights, verticaldividersize), changeData: changeData, selectcell: selectCell, deselectcell: deSelectCell, enableedit: enableEditMode, disableedit: disableEditMode, selected: this.selected, editing: this.editing, hlines: hlines, backgroundcolour: this.backgroundcolour, bordercolour: this.bordercolour, borderstyle: this.borderstyle, paragraphcss: this.getparagraphcss() }));
        }
    };
    return CellDetails;
}());
var MyTable = /** @class */ (function (_super) {
    __extends(MyTable, _super);
    function MyTable(props) {
        var _this = _super.call(this, props) || this;
        _this.chosencolour = "#ffffff";
        _this.colourpickerref = React.createRef();
        _this.addRow = _this.addRow.bind(_this);
        _this.addCol = _this.addCol.bind(_this);
        _this.state = { table: [], mincellheight: 40, mincellwidth: 50, dividerpixels: 0, horizontallines: true, selecting: false, startselectpoint: [0, 0], endselectpoint: [0, 0], bordermodify: [true, true, true, true], tab: 0 };
        _this.testPopulateTable();
        return _this;
    }
    //Creates and populates the initial table.
    MyTable.prototype.testPopulateTable = function () {
        for (var row = 0; row < 5; row++) {
            var rowarray = [];
            for (var col = 0; col < 5; col++) {
                var cell = new CellDetails(new TablePoint(row, col));
                rowarray.push(cell);
            }
            this.state.table.push(rowarray);
        }
    };
    /*
     * HELPER FUNCTIONS
     */
    MyTable.prototype.getRowCount = function () {
        return this.state.table.length;
    };
    MyTable.prototype.getColCount = function () {
        return this.state.table[0].length;
    };
    MyTable.prototype.getRow = function (rownum) {
        return this.state.table[rownum];
    };
    MyTable.prototype.getCol = function (colnum) {
        var colarray = [];
        for (var row = 0; row < this.getRowCount(); row++) {
            colarray.push(this.state.table[row][colnum]);
        }
        return colarray;
    };
    MyTable.prototype.getColWidth = function (col) {
        var colarray = this.getCol(col);
        var widths = colarray.map(function (x) { return x.width; });
        var largestwidth = widths.reduce(function (a, b) {
            return Math.max(a, b);
        });
        if (this.state.mincellwidth > largestwidth)
            return this.state.mincellwidth;
        return largestwidth;
    };
    MyTable.prototype.getRowHeight = function (row) {
        var rowarray = this.getRow(row);
        var heights = rowarray.map(function (x) { return x.height; });
        var largestheight = heights.reduce(function (a, b) {
            return Math.max(a, b);
        });
        if (this.state.mincellheight > largestheight)
            return this.state.mincellheight;
        return largestheight;
    };
    //Returns the selected cells as a list.
    MyTable.prototype.getSelectedCells = function () {
        var selectedcells = [];
        for (var row = 0; row < this.getRowCount(); row++) {
            for (var col = 0; col < this.getColCount(); col++) {
                var cell = this.state.table[row][col];
                if (cell.isSelected()) {
                    selectedcells.push(cell);
                }
            }
        }
        return selectedcells;
    };
    //Add a row to the bottom of the table.
    MyTable.prototype.addRow = function () {
        var newtable = this.state.table.map(function (x) { return x; });
        var row = [];
        for (var col = 0; col < this.getColCount(); col++) {
            console.log("temp");
            var cell = new CellDetails(new TablePoint(this.getRowCount(), col)); //May need to add 1 to getrowcount()
            row.push(cell);
        }
        newtable.push(row);
        this.setState({ table: newtable });
    };
    //Add a column to the right of the table.
    MyTable.prototype.addCol = function () {
        var newtable = this.state.table.map(function (x) { return x; });
        var colcount = this.getColCount();
        for (var row = 0; row < this.getRowCount(); row++) {
            var cell = new CellDetails(new TablePoint(row, colcount));
            console.log(cell.p.toString());
            newtable[row].push(cell);
        }
        this.setState({ table: newtable });
    };
    MyTable.prototype.moveCell = function () {
    };
    /*
     * Callback functions for interaction with individual cells
     */
    MyTable.prototype.selectCell = function (cell) {
        var newtable = this.state.table.map(function (x) { return x; });
        cell.select();
        this.setState({ table: newtable });
    };
    MyTable.prototype.deselectCell = function (cell) {
        var newtable = this.state.table.map(function (x) { return x; });
        cell.deselect();
        this.setState({ table: newtable });
    };
    MyTable.prototype.enableCellEdit = function (cell) {
        var newtable = this.state.table.map(function (x) { return x; });
        cell.enableEdit();
        this.setState({ table: newtable });
    };
    MyTable.prototype.disableCellEdit = function (cell) {
        var newtable = this.state.table.map(function (x) { return x; });
        cell.disableEdit();
        this.setState({ table: newtable });
    };
    MyTable.prototype.modifyCellData = function (cell, data) {
        var newtable = this.state.table.map(function (x) { return x; });
        cell.setData(data);
        this.setState({ table: newtable });
    };
    /*
     * Functions called when one of the buttons at the top of the table is clicked.
     */
    //Copies the latex to the clipboard.
    MyTable.prototype.copyLatex = function () {
        var copyText = document.getElementById("latextextarea");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy");
        var sel = document.getSelection();
        sel.removeAllRanges();
    };
    MyTable.prototype.copyHTML = function () {
        var copyText = document.getElementById("htmltextarea");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy");
        var sel = document.getSelection();
        sel.removeAllRanges();
    };
    MyTable.prototype.copyText = function () {
        var copyText = document.getElementById("texttextarea");
        copyText.className = "show";
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy");
        var sel = document.getSelection();
        sel.removeAllRanges();
        copyText.className = "hide";
    };
    MyTable.prototype.chooseColour = function (e) {
        this.chosencolour = e.target.value;
    };
    //Sets the colour of the selected cells to the chosen colour.
    MyTable.prototype.setCellBackgroundColours = function () {
        var _this = this;
        var selectedcells = this.getSelectedCells();
        selectedcells.forEach(function (item) {
            item.setBackgroundColour(_this.chosencolour);
        });
        var newtable = this.state.table.map(function (x) { return x; });
        this.setState({ table: newtable });
    };
    MyTable.prototype.setCellBorderColours = function () {
        var _this = this;
        var selectedcells = this.getSelectedCells();
        selectedcells.forEach(function (item) {
            item.setBorderColour(_this.chosencolour);
        });
        var newtable = this.state.table.map(function (x) { return x; });
        this.setState({ table: newtable });
    };
    MyTable.prototype.selectBorderToModify = function (border) {
        var bordermodify;
        bordermodify = __spreadArrays(this.state.bordermodify);
        bordermodify[border] = !bordermodify[border];
        this.setState({ bordermodify: bordermodify });
    };
    MyTable.prototype.chooseBorderStyle = function (e) {
        console.log(this.state.bordermodify);
        var selectedcells = this.getSelectedCells();
        selectedcells.forEach(function (item) {
            item.setBorderStyle(e.target.value);
        });
    };
    MyTable.prototype.deselectAllCells = function () {
        var selectedcells = this.getSelectedCells();
        selectedcells.forEach(function (item) {
            item.deselect();
        });
        var newtable = this.state.table.map(function (x) { return x; });
        this.setState({ table: newtable });
    };
    MyTable.prototype.selectAllCells = function () {
        for (var row = 0; row < this.getRowCount(); row++) {
            for (var col = 0; col < this.getColCount(); col++) {
                var cell = this.state.table[row][col];
                cell.select();
            }
        }
        var newtable = this.state.table.map(function (x) { return x; });
        this.setState({ table: newtable });
    };
    MyTable.prototype.openTextAlignment = function (e) {
        var popover = document.getElementById("alignmentpopover");
        popover.anchorEl = e.currentTarget;
    };
    //Merges the currently selected cells.
    //Uses the outer cells to create a rectangle of cells to merge if the selection is not a rectangle already.
    //Also includes the borders of other merged cells in this calculation.
    //Recurses when these extra cells are selected to check for new cells that should be included, otherwise performs the merge.
    MyTable.prototype.mergeCells = function () {
        var _this = this;
        var selectedcells = this.getSelectedCells();
        if (selectedcells.length <= 1)
            return;
        var minrow = Infinity;
        var mincol = Infinity;
        var maxrow = 0;
        var maxcol = 0;
        selectedcells.forEach(function (item) {
            var p = item.p;
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
        var recurse = false;
        var root = this.state.table[minrow][mincol];
        var children = [];
        for (var row = minrow; row <= maxrow; row++) {
            for (var col = mincol; col <= maxcol; col++) {
                var cell = this.state.table[row][col];
                if (!cell.p.equals(root.p)) {
                    children.push(cell);
                }
                //The following code ensures that any other contained merges are incorporated into this merge.
                if (!cell.isSelected())
                    recurse = true;
                cell.select();
                var cellchildren = cell.getMergeChildren();
                cellchildren.forEach(function (item2) {
                    var childpoint = new TablePoint(undefined, undefined, item2);
                    var childcell = _this.state.table[childpoint.row][childpoint.col];
                    if (!childcell.isSelected())
                        recurse = true;
                    childcell.select();
                });
            }
        }
        if (recurse) { //Recurses if any other merges need to be included.
            this.mergeCells();
        }
        else {
            root.deselect();
            children.forEach(function (item) {
                item.mergeAsChild(root.p.toString());
                item.deselect();
            });
            var childrenstrings = children.map(function (x) { return x.p.toString(); });
            root.mergeAsRoot(childrenstrings);
            var newtable = this.state.table.map(function (x) { return x; });
            this.setState({ table: newtable });
        }
    };
    //Splits the selected merged cells.
    MyTable.prototype.splitCells = function () {
        var _this = this;
        var selectedcells = this.getSelectedCells();
        if (selectedcells.length === 0)
            return;
        var roots = new Set();
        selectedcells.forEach(function (item) {
            if (item.getMergeRoot() !== "") {
                roots.add(item.getMergeRoot());
            }
            item.deselect();
        });
        var rootsarray = Array.from(roots);
        rootsarray.forEach(function (item) {
            var p = new TablePoint(undefined, undefined, item);
            var cell = _this.state.table[p.row][p.col];
            var children = cell.getMergeChildren();
            children.forEach(function (childitem) {
                var p2 = new TablePoint(undefined, undefined, childitem);
                var childcell = _this.state.table[p2.row][p2.col];
                childcell.unMerge();
            });
            cell.unMerge();
        });
        var newtable = this.state.table.map(function (x) { return x; });
        this.setState({ table: newtable });
    };
    //Sets CSS horizontal text alignment for the selected cells.
    MyTable.prototype.setHorizontalTextAlignment = function (alignment) {
        var cells = this.getSelectedCells();
        cells.forEach(function (cell) {
            cell.setTextAlignment(alignment);
        });
        var newtable = this.state.table.map(function (x) { return x; });
        this.setState({ table: newtable });
    };
    /*
     * Generates a latex representation of the current table.
     */
    MyTable.prototype.convertToLatex = function () {
        var _this = this;
        var collatex = "";
        for (var col = 0; col < this.getColCount(); col++) {
            collatex = collatex + "c ";
        }
        //Preprocess for horizontal lines.
        var horlines = Array(this.getRowCount()).fill(undefined).map(function () { return Array(_this.getColCount()).fill(false); });
        //let leftmergecells = {};
        var leftmergecells = {};
        for (var row = 0; row < this.getRowCount(); row++) {
            this.state.table[row].forEach(function (x) {
                var cells = x.getBottomLines();
                cells.forEach(function (cell) {
                    horlines[cell.row][cell.col] = true;
                });
                if (x.getMergeChildren().length !== 0) {
                    var leftcells = x.getLeftLines();
                    var width_2 = x.getMergeSize()[1];
                    leftcells.forEach(function (item) {
                        leftmergecells[item.toString()] = width_2;
                    });
                }
            });
        }
        var latextable = [];
        var _loop_1 = function (row) {
            var rowarray = this_1.state.table[row];
            var rowlatex = "";
            rowarray.forEach(function (x) {
                rowlatex = rowlatex + x.getLatex(leftmergecells);
            }); /* Escapes & characters and backslashes */
            if (rowlatex.charAt(rowlatex.length - 1) === '&')
                rowlatex = rowlatex.slice(0, -1);
            rowlatex = rowlatex + " \\\\";
            //make fized length array of bools
            var lines = horlines[row]; //[true, true, true, true, true];
            var drawingline = false;
            var l = " ";
            for (var i = 0; i < lines.length; i++) {
                var col = i + 1;
                if (lines[i] && !drawingline) {
                    drawingline = true;
                    l = l + "\\cline{" + col;
                }
                if ((i === lines.length - 1 && drawingline) || (drawingline && i !== lines.length - 1 && !lines[i + 1])) {
                    l = l + "-" + col + "}";
                    drawingline = false;
                }
            }
            if (this_1.state.horizontallines)
                rowlatex = rowlatex + l;
            latextable.push(rowlatex);
        };
        var this_1 = this;
        for (var row = 0; row < this.getRowCount(); row++) {
            _loop_1(row);
        }
        if (this.state.horizontallines && latextable.length > 0)
            latextable[0] = " \\hline" + "\n" + latextable[0];
        var bs = "\\";
        var cu1 = "{";
        var cu2 = "}";
        var latex = "";
        latex += "\\begin{center}";
        latex += "\n\\begin{tabular}{" + collatex + "}";
        latextable.forEach(function (x) {
            latex += "\n" + x;
        });
        latex += "\n\\end{tabular}";
        latex += "\n\\end{center}";
        return (React.createElement("div", null,
            React.createElement("textarea", { readOnly: true, rows: 10, cols: 25, className: "latex-box", id: "latextextarea", value: latex })));
    };
    /*
     * Generates a HTML representation of the current table.
     */
    MyTable.prototype.convertToHTML = function () {
        var html = "<table class='htmltable' >\n";
        for (var i = 0; i < this.getRowCount(); i++) {
            var row = this.getRow(i);
            html += "<tr>\n";
            row.forEach(function (x) {
                html += x.getHTML();
            }); /* TODO: Escape HTML */
            html += "</tr>\n";
        }
        html += "</table>\n";
        //dangerous TODO: maybe remove live html
        return (React.createElement("div", null,
            React.createElement("div", { dangerouslySetInnerHTML: { __html: html }, className: "html-table-displaybox" }),
            React.createElement("textarea", { readOnly: true, rows: 10, cols: 15, className: "latex-box", id: "htmltextarea", value: html })));
    };
    /*
     * Generates a text representation of the current table.
     */
    MyTable.prototype.convertToText = function () {
        var textdata = this.state.table.map(function (row) {
            return row.map(function (cell) {
                return cell.getData();
            });
        });
        var texttable = table_1.table(textdata);
        //console.log(texttable);
        return (React.createElement("div", null,
            React.createElement("textarea", { readOnly: true, rows: 10, cols: 15, id: "texttextarea", className: "hide", value: texttable }),
            React.createElement("code", { id: "textcodeblock" }, texttable)));
    };
    /*
     * Functions used for clicking and dragging to select cells.
     */
    //Initialises the select box when the mouse is clicked down.
    MyTable.prototype.svgCreateRect = function (ev) {
        var canvas = document.getElementById("svg");
        var rect = canvas.getBoundingClientRect();
        var x = ev.clientX - rect.left;
        var y = ev.clientY - rect.top;
        this.setState({ selecting: true, startselectpoint: [x, y], endselectpoint: [x, y] });
    };
    //Destroys the box after performing one last update of the box's position.
    //This triggers when click is released or the mouse moves outside of the table.
    MyTable.prototype.svgDestroyRect = function (ev) {
        //Uses string conversions to compare the arrays.
        if ((this.state.startselectpoint.toString() === this.state.endselectpoint.toString()) && (this.state.startselectpoint.toString() !== "0,0")) {
            console.log("Click select" + this.state.startselectpoint);
            this.selectWithClick(this.state.startselectpoint);
        }
        else {
            this.svgDragRect(ev);
        }
        this.setState({ selecting: false, startselectpoint: [0, 0], endselectpoint: [0, 0] });
    };
    //Updates the coordinates of the box as the mouse moves (while click is held).
    MyTable.prototype.svgDragRect = function (ev) {
        if (this.state.selecting) {
            var canvas = document.getElementById("svg");
            var rect = canvas.getBoundingClientRect();
            var x = ev.clientX - rect.left;
            var y = ev.clientY - rect.top;
            this.SelectWithBox();
            this.setState({ selecting: true, endselectpoint: [x, y] });
        }
    };
    //Draws the box using the currently supplied coordinates.
    MyTable.prototype.drawSelectRect = function () {
        if (this.state.selecting) {
            var start = this.state.startselectpoint;
            var end = this.state.endselectpoint;
            return (React.createElement("rect", { id: "svgselectrect", fill: "rgba(255,0,0,0.3)", x: Math.min(start[0], end[0]), y: Math.min(start[1], end[1]), width: Math.abs(start[0] - end[0]), height: Math.abs(start[1] - end[1]) }));
        }
    };
    MyTable.prototype.selectWithClick = function (coords) {
        var svg = document.getElementById("svg");
        var rect = svg.getBoundingClientRect();
        coords = [coords[0] + rect.left, coords[1] + rect.top];
        for (var row = 0; row < this.getRowCount(); row++) {
            for (var col = 0; col < this.getColCount(); col++) {
                var cell = this.state.table[row][col];
                if (cell.isVisible()) {
                    var svggroup = document.getElementById(cell.p.toString());
                    var rect_1 = svggroup.getBoundingClientRect();
                    if (coords[0] < rect_1.left + rect_1.width &&
                        coords[0] > rect_1.left &&
                        coords[1] < rect_1.top + rect_1.height &&
                        coords[1] > rect_1.top) {
                        if (cell.isSelected()) {
                            cell.deselect();
                        }
                        else {
                            cell.select();
                        }
                    }
                    else {
                        //cell.deselect();
                    }
                }
            }
        }
    };
    //Selects the cells highlighted by the box by checking for collision with each cell.
    MyTable.prototype.SelectWithBox = function () {
        var selectionrect = document.getElementById("svgselectrect").getBoundingClientRect();
        for (var row = 0; row < this.getRowCount(); row++) {
            for (var col = 0; col < this.getColCount(); col++) {
                var cell = this.state.table[row][col];
                if (cell.isVisible()) {
                    var svggroup = document.getElementById(cell.p.toString());
                    var rect = svggroup.getBoundingClientRect();
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
    };
    /*
     * Converts the SVG table to an image.
     * This can then be viewed and downloaded.
     */
    MyTable.prototype.convertToImage = function () {
        var _this = this;
        var selectedcells = this.getSelectedCells();
        selectedcells.forEach(function (item) {
            item.deselect();
        });
        var newtable = this.state.table.map(function (x) { return x; });
        this.setState({ table: newtable }, function () { return _this.convertToPNG(); });
    };
    MyTable.prototype.convertToPNG = function () {
        var svgthing = document.getElementById("svg");
        var svgData = new XMLSerializer().serializeToString(svgthing);
        var htmlcanvas = document.getElementById("mycanvas");
        htmlcanvas.className = "show";
        var ctx = htmlcanvas.getContext('2d');
        var img = document.createElement("img");
        img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));
        var w = window.open("");
        w.document.write(img.outerHTML);
        //window.open(htmlcanvas.toDataURL("image/png"));
        //let a = document.getElementById("dlbutton")!;
        //a.setAttribute("href", "data:application/octet-stream;base64,");
        //img.onload = function () {
        //    ctx.drawImage(img, 0, 0);
        //    console.log(htmlcanvas.toDataURL("image/png"));
        //};
    };
    /*
     * Draws the current representation of the table.
     */
    MyTable.prototype.drawTable = function () {
        var _this = this;
        var rowheights = [];
        var colwidths = [];
        for (var row = 0; row < this.getRowCount(); row++) {
            rowheights.push(this.getRowHeight(row));
        }
        for (var col = 0; col < this.getColCount(); col++) {
            colwidths.push(this.getColWidth(col));
        }
        var tablewidth = colwidths.reduce(function (a, b) { return a + b; }, 0) + (this.state.dividerpixels * this.getColCount());
        var tableheight = rowheights.reduce(function (a, b) { return a + b; }, 0) + (this.state.dividerpixels * this.getRowCount());
        return (React.createElement("div", { className: "maintablediv" },
            React.createElement("svg", { width: tablewidth, height: tableheight, id: "svg", onMouseDown: function (e) { return _this.svgCreateRect(e); }, onMouseUp: function (e) { return _this.svgDestroyRect(e); }, onMouseMove: function (e) { return _this.svgDragRect(e); }, onMouseLeave: function (e) { return _this.svgDestroyRect(e); } },
                this.state.table.map(function (innerArray, row) { return (innerArray.map(function (cell, col) {
                    return cell.draw((colwidths.slice(0, col)).reduce(function (a, b) { return a + b; }, 0) + (_this.state.dividerpixels * (col)), (rowheights.slice(0, row)).reduce(function (a, b) { return a + b; }, 0) + (_this.state.dividerpixels * (row)), //row * (this.state.mincellheight + this.state.dividerpixels),
                    colwidths, rowheights, _this.state.dividerpixels, _this.state.dividerpixels, function (cell, data) { return _this.modifyCellData(cell, data); }, function (cell) { return _this.selectCell(cell); }, function (cell) { return _this.deselectCell(cell); }, function (cell) { return _this.enableCellEdit(cell); }, function (cell) { return _this.disableCellEdit(cell); }, _this.state.horizontallines);
                })); }),
                this.drawSelectRect()),
            React.createElement("canvas", { id: "mycanvas", className: "hide", width: tablewidth, height: tableheight }),
            React.createElement("br", null)));
    };
    MyTable.prototype.componentDidMount = function () {
        this.colourpickerref.current.value = this.chosencolour;
    };
    MyTable.prototype.bigClick = function (e) {
    };
    MyTable.prototype.changeTab = function (e, v) {
        //let tabbar = document.getElementById("tabbar")!;
        //console.log(v);
        this.setState({ tab: v });
    };
    MyTable.prototype.getTabContent = function () {
        var _this = this;
        switch (this.state.tab) {
            case 1:
                return (React.createElement("div", { id: "HTMLDiv" },
                    this.convertToHTML(),
                    React.createElement(core_1.Button, { className: "table-buttons", type: "button", onClick: function () { return _this.copyHTML(); } }, "Copy to clipboard")));
            case 2:
                return (React.createElement("div", { id: "TextDiv" },
                    this.convertToText(),
                    React.createElement(core_1.Button, { className: "table-buttons", type: "button", onClick: function () { return _this.copyText(); } }, "Copy to clipboard")));
            case 3:
                return (React.createElement("div", { id: "PNGDiv" },
                    React.createElement(core_1.Button, { className: "table-buttons", type: "button", onClick: function () { return _this.convertToImage(); } }, "Generate PNG")));
            case 0:
            default:
                return (React.createElement("div", { id: "LaTexDiv" },
                    this.convertToLatex(),
                    React.createElement(core_1.Button, { className: "table-buttons", type: "button", onClick: function () { return _this.copyLatex(); } }, "Copy to clipboard")));
        }
    };
    MyTable.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", null,
            React.createElement(core_1.Drawer, { anchor: "left", variant: "permanent", open: true },
                React.createElement(core_1.List, null,
                    React.createElement(core_1.ListItem, null,
                        React.createElement("b", null, "Global Controls")),
                    React.createElement(core_1.ListItem, { button: true, onClick: function () { return _this.addRow(); } }, "Add Row"),
                    React.createElement(core_1.ListItem, { button: true, onClick: function () { return _this.addCol(); } }, "Add Column"),
                    React.createElement(core_1.ListItem, { button: true, onClick: function () { return _this.selectAllCells(); } }, "Select All"),
                    React.createElement(core_1.ListItem, { button: true, onClick: function () { return _this.deselectAllCells(); } }, "Select None"),
                    React.createElement(core_1.ListItem, { button: true, onClick: function () { return _this.setState({ horizontallines: !_this.state.horizontallines }); } }, "Toggle horizontal lines (Temp)"),
                    React.createElement(core_1.ListItem, { divider: true }),
                    React.createElement(core_1.ListItem, null,
                        React.createElement("b", null, "Selected Cell Controls")),
                    React.createElement(core_1.ListItem, { button: true, onClick: function () { return _this.mergeCells(); } },
                        React.createElement(core_1.ListItemText, { primary: "Merge", secondary: "Combine the selected cells into one" })),
                    React.createElement(core_1.ListItem, { button: true, onClick: function () { return _this.splitCells(); } },
                        React.createElement(core_1.ListItemText, { primary: "Split", secondary: "Undo a merge" })),
                    React.createElement(core_1.ListItem, null,
                        "Colour",
                        React.createElement("input", { type: "color", onChange: function (e) { return _this.chooseColour(e); }, ref: this.colourpickerref, className: "colour-picker" })),
                    React.createElement(core_1.ListItem, { button: true, onClick: function () { return _this.setCellBackgroundColours(); } },
                        React.createElement(core_1.ListItemText, { primary: "Set cell backgrounds to this colour" })),
                    React.createElement(core_1.ListItem, { button: true, onClick: function () { return _this.setCellBorderColours(); } },
                        React.createElement(core_1.ListItemText, { primary: "Set cell borders to this colour" })),
                    React.createElement(core_1.ListItem, null,
                        React.createElement(core_1.ListItemText, { primary: "Text Alignment:" }),
                        React.createElement(core_1.Button, { onClick: function () { return _this.setHorizontalTextAlignment("left"); } }, "Left"),
                        React.createElement(core_1.Button, { onClick: function () { return _this.setHorizontalTextAlignment("center"); } }, "Centre"),
                        React.createElement(core_1.Button, { onClick: function () { return _this.setHorizontalTextAlignment("right"); } }, "Right")),
                    React.createElement(core_1.ListItem, null,
                        React.createElement(core_1.ListItemText, { primary: "Border Style:" }),
                        React.createElement("select", { name: "chooseborderstyle", onChange: function (e) { return _this.chooseBorderStyle(e); } },
                            React.createElement("option", { value: "solid" }, "Solid"),
                            React.createElement("option", { value: "dotted" }, "Dotted"),
                            React.createElement("option", { value: "dashed" }, "Dashed"))))),
            React.createElement("div", { className: "root-div", onClick: function (e) { return _this.bigClick(e); } },
                this.drawTable(),
                React.createElement("div", null,
                    React.createElement(core_1.AppBar, { position: "static" },
                        React.createElement(core_1.Tabs, { id: "tabbar", value: this.state.tab, onChange: function (e, v) { return _this.changeTab(e, v); } },
                            React.createElement(core_1.Tab, { label: "LaTeX", tabIndex: 0 }),
                            React.createElement(core_1.Tab, { label: "HTML", tabIndex: 1 }),
                            React.createElement(core_1.Tab, { label: "Text", tabIndex: 2 }),
                            React.createElement(core_1.Tab, { label: "PNG", tabIndex: 3 }))),
                    React.createElement("div", { id: "tabContentDiv" }, this.getTabContent())))));
    };
    return MyTable;
}(React.Component));
exports.default = MyTable;
var SVGCell = /** @class */ (function (_super) {
    __extends(SVGCell, _super);
    function SVGCell(props) {
        return _super.call(this, props) || this;
    }
    SVGCell.prototype.changeData = function (e) {
        this.props.changeData(this.props.cell, e.target.value);
    };
    SVGCell.prototype.disableEdit = function (e) {
        this.props.disableedit(this.props.cell);
    };
    SVGCell.prototype.moveCursorToEnd = function (e) {
        var value = e.target.value;
        e.target.value = "";
        e.target.value = value;
    };
    SVGCell.prototype.getText = function () {
        var _this = this;
        var lines = this.props.cell.getData().split("\n");
        if (!this.props.editing) {
            //<text x={this.props.xpixel + this.props.width / 2} y={this.props.ypixel + 20} textAnchor={"middle"} alignmentBaseline={"central"} className="celltext">{lines[0]}</text>
            //if (lines.length === 1) {
            //let styling: CSS.Properties = {
            //     textAlign: "left",
            //}
            return (React.createElement("g", null,
                React.createElement("foreignObject", { x: this.props.xpixel, y: this.props.ypixel, width: this.props.width, height: this.props.height },
                    React.createElement("div", { className: "celldiv" },
                        React.createElement("p", { className: "celltext", style: this.props.paragraphcss }, this.props.cell.getData())))));
        }
        else {
            var rows = lines.length;
            return (React.createElement("foreignObject", { x: this.props.xpixel, y: this.props.ypixel, width: this.props.width, height: this.props.height },
                React.createElement("textarea", { className: "cell-input", value: this.props.cell.getData(), rows: 100, tabIndex: 0, onChange: function (e) { return _this.changeData(e); }, onBlur: function (e) { return _this.disableEdit(e); }, autoFocus: true, onFocus: function (e) { return _this.moveCursorToEnd(e); } })));
        }
    };
    SVGCell.prototype.clickCell = function (e) {
        /*if (this.props.selected) {
            this.props.deselectcell(this.props.cell);
        } else {
            this.props.selectcell(this.props.cell);
        }*/
    };
    SVGCell.prototype.getRectColour = function () {
        /*if (this.props.selected) {
            return "red";
        }*/
        if (this.props.backgroundcolour == "") {
            return "white";
        }
        return this.props.backgroundcolour;
    };
    SVGCell.prototype.getBorderColour = function () {
        //if (this.props.selected) {
        //    return "yellow";
        //}
        return this.props.bordercolour;
    };
    SVGCell.prototype.getSelectedStyling = function () {
        if (this.props.selected) {
            return (React.createElement("rect", { x: this.props.xpixel + 2, y: this.props.ypixel + 2, width: this.props.width - 4, height: this.props.height - 4, fill: "none", stroke: "red", strokeWidth: 2 }));
        }
    };
    SVGCell.prototype.getBorderStyle = function () {
        switch (this.props.borderstyle) {
            case "solid":
                return "";
            case "dotted":
                return "2,2";
            case "dashed":
                return "5,5";
        }
    };
    SVGCell.prototype.componentDidUpdate = function () {
    };
    SVGCell.prototype.render = function () {
        var _this = this;
        return (React.createElement("g", { onDoubleClick: function () { return _this.props.enableedit(_this.props.cell); }, onClick: function (e) { return _this.clickCell(e); }, id: this.props.cell.p.toString(), className: "ACell" },
            React.createElement("rect", { x: this.props.xpixel, y: this.props.ypixel, width: this.props.width, height: this.props.height, fill: this.getRectColour(), stroke: this.getBorderColour(), strokeWidth: this.props.hlines ? 1 : 0, strokeDasharray: this.getBorderStyle() }),
            this.getSelectedStyling(),
            this.getText()));
    };
    return SVGCell;
}(React.Component));
//# sourceMappingURL=MyTable.js.map