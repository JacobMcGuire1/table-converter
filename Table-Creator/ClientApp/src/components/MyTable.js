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
Object.defineProperty(exports, "__esModule", { value: true });
//import React from 'react'; // we need this to make JSX compile
var React = require("react");
require("./MyTable.css");
function escapeLatex(str) {
    str = str.split("\\").join("\\textbackslash");
    str = str.split("&").join("\\&");
    return str;
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
        this.editing = true;
        this.selected = false;
        this.mergeroot = "";
        this.mergechildren = [];
        this.data = "";
        this.width = 0;
        this.height = 0;
        this.p = p;
        this.setData(p.toString());
    }
    CellDetails.prototype.select = function () {
        this.selected = true;
    };
    CellDetails.prototype.deselect = function () {
        this.selected = false;
    };
    CellDetails.prototype.merge = function (p) {
        this.mergeroot = p.toString();
    };
    CellDetails.prototype.enableEdit = function () {
        this.editing = true;
    };
    CellDetails.prototype.disableEdit = function () {
        this.editing = false;
    };
    CellDetails.prototype.getWidth = function () {
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
    CellDetails.prototype.getHeight = function () {
        var lines = this.data.split("\n");
        return this.height;
    };
    CellDetails.prototype.setData = function (data) {
        this.data = data;
        this.width = this.getWidth();
        this.height = this.getHeight();
    };
    CellDetails.prototype.copy = function () {
        return Object.assign({}, this);
    };
    CellDetails.prototype.isVisible = function () {
        return (this.mergeroot === this.p.toString()) || (this.mergeroot === "");
    };
    CellDetails.prototype.draw = function (xpixel, ypixel, width, height, changeData, selectCell, deSelectCell, enableEditMode, disableEditMode) {
        if (this.isVisible()) {
            return (React.createElement(SVGCell, { key: this.p.toString(), cell: this, xpixel: xpixel, ypixel: ypixel, width: width, height: height, changeData: changeData, selectcell: selectCell, deselectcell: deSelectCell, enableedit: enableEditMode, disableedit: disableEditMode, selected: this.selected, editing: this.editing }));
        }
    };
    return CellDetails;
}());
var MyTable = /** @class */ (function (_super) {
    __extends(MyTable, _super);
    function MyTable(props) {
        var _this = _super.call(this, props) || this;
        _this.addRow = _this.addRow.bind(_this);
        _this.addCol = _this.addCol.bind(_this);
        _this.state = { table: [], mincellheight: 40, mincellwidth: 50, dividerpixels: 5 };
        _this.testPopulateTable();
        return _this;
    }
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
    MyTable.prototype.getRowCount = function () {
        return this.state.table.length;
    };
    MyTable.prototype.getColCount = function () {
        return this.state.table[0].length;
    };
    MyTable.prototype.getRow = function (row) {
        return this.state.table[row];
    };
    MyTable.prototype.getCol = function (col) {
        var colarray = [];
        for (var row = 0; row < this.getRowCount(); row++) {
            colarray.push(this.state.table[row][col]);
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
    MyTable.prototype.addRow = function () {
        var newtable = this.state.table.map(function (x) { return x; });
        var row = [];
        for (var col = 0; col < this.getColCount(); col++) {
            var cell = new CellDetails(new TablePoint(this.getRowCount(), col)); //May need to add 1 to getrowcount()
            row.push(cell);
        }
        newtable.push(row);
        this.setState({ table: newtable });
    };
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
    MyTable.prototype.modifyCellData = function (cell, data) {
        var newtable = this.state.table.map(function (x) { return x; });
        cell.setData(data);
        this.setState({ table: newtable });
    };
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
    MyTable.prototype.convertToLatex = function () {
        var collatex = "|";
        for (var col = 0; col < this.getColCount(); col++) {
            collatex = collatex + "c|";
        }
        var latextable = [];
        var _loop_1 = function (row) {
            var rowarray = this_1.state.table[row];
            var rowlatex = "";
            rowarray.forEach(function (x) { return rowlatex = rowlatex + escapeLatex(x.getData()) + " & "; }); /* Escapes & characters and backslashes */
            rowlatex = rowlatex.slice(0, -3);
            rowlatex = rowlatex + " \\\\";
            latextable.push(rowlatex);
        };
        var this_1 = this;
        for (var row = 0; row < this.getRowCount(); row++) {
            _loop_1(row);
        }
        var bs = "\\";
        var cu1 = "{";
        var cu2 = "}";
        return (React.createElement("div", null,
            bs,
            "begin",
            cu1,
            "center",
            cu2,
            React.createElement("br", null),
            bs,
            "begin",
            cu1,
            "tabular",
            cu2,
            cu1,
            collatex,
            cu2,
            React.createElement("br", null),
            latextable.map(function (x, i) { return React.createElement("div", { key: i }, x); }),
            bs,
            "end",
            cu1,
            "tabular",
            cu2,
            React.createElement("br", null),
            bs,
            "end",
            cu1,
            "center",
            cu2));
    };
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
        return (React.createElement("div", null,
            React.createElement("svg", { width: tablewidth, height: tableheight, id: "svg" }, this.state.table.map(function (innerArray, row) { return (innerArray.map(function (cell, col) {
                return cell.draw((colwidths.slice(0, col)).reduce(function (a, b) { return a + b; }, 0) + (_this.state.dividerpixels * (col)), row * (_this.state.mincellheight + _this.state.dividerpixels), colwidths[col], rowheights[row], function (cell, data) { return _this.modifyCellData(cell, data); }, function (cell) { return _this.selectCell(cell); }, function (cell) { return _this.deselectCell(cell); }, function (cell) { return _this.enableCellEdit(cell); }, function (cell) { return _this.disableCellEdit(cell); });
            })); })),
            React.createElement("br", null),
            React.createElement("h2", null, "LaTeX"),
            this.convertToLatex()));
    };
    MyTable.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", { className: "table-div" },
            React.createElement("h2", null, "Table"),
            React.createElement("div", { className: "table-buttons-div" },
                React.createElement("button", { type: "button", onClick: function () { return _this.addRow(); } }, "Add Row"),
                React.createElement("button", { className: "table-buttons", type: "button", onClick: function () { return _this.addCol(); } }, "Add Column"),
                React.createElement("button", { className: "table-buttons", type: "button" }, "Merge Selected Cells"),
                React.createElement("button", { className: "table-buttons", type: "button" }, "Split Selected Cells")),
            this.drawTable()));
    };
    return MyTable;
}(React.Component));
exports.default = MyTable;
var SVGCell = /** @class */ (function (_super) {
    __extends(SVGCell, _super);
    function SVGCell(props) {
        return _super.call(this, props) || this;
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
    SVGCell.prototype.changeData = function (e) {
        //let data = this.ref2!.current?.firstChild?.textContent;
        var data = e.target.textContent;
        if (data != null) {
            this.props.changeData(this.props.cell, data);
        }
    };
    SVGCell.prototype.getText = function () {
        var _this = this;
        if (!this.props.editing) {
            return (React.createElement("text", { x: this.props.xpixel + this.props.width / 2, y: this.props.ypixel + 20, textAnchor: "middle", alignmentBaseline: "central" }, this.props.cell.getData()));
        }
        else {
            return (React.createElement("foreignObject", { x: this.props.xpixel, y: this.props.ypixel, width: this.props.width, height: this.props.height },
                React.createElement("div", { contentEditable: true, onBlur: function () { return _this.props.disableedit(_this.props.cell); }, tabIndex: 0, onInput: function (e) { return _this.changeData(e); }, suppressContentEditableWarning: true }, this.props.cell.getData())));
        }
    };
    SVGCell.prototype.clickCell = function (e) {
        if (this.props.selected) {
            this.props.deselectcell(this.props.cell);
        }
        else {
            this.props.selectcell(this.props.cell);
        }
    };
    SVGCell.prototype.getRectColour = function () {
        if (this.props.selected) {
            return "red";
        }
        else {
            return "grey";
        }
    };
    SVGCell.prototype.render = function () {
        var _this = this;
        return (React.createElement("g", { onDoubleClick: function () { return _this.props.enableedit(_this.props.cell); }, onClick: function (e) { return _this.clickCell(e); }, id: "cell:" + this.props.cell.p.toString() },
            React.createElement("rect", { x: this.props.xpixel, y: this.props.ypixel, width: this.props.width, height: this.props.height, fill: this.getRectColour() }),
            this.getText()));
    };
    return SVGCell;
}(React.Component));
//# sourceMappingURL=MyTable.js.map