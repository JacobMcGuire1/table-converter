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
        this.editing = false;
        this.selected = false;
        this.mergeroot = "";
        this.mergechildren = [];
        this.data = "";
        this.backgroundcolour = "";
        this.width = 0;
        this.height = 0;
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
    CellDetails.prototype.getLatex = function () {
        var data = escapeLatex(this.getData());
        if (this.mergeroot === "") {
            return data + " &";
        }
        if (this.mergeroot === this.p.toString()) {
            var size = this.getMergeSize();
            var h = size[0];
            var w = size[1];
            if (w == 0) {
                return "\\multirow{" + (h + 1).toString() + "} {*} {" + data + "} &";
            }
            if (h == 0) {
                return "\\multicolumn{" + (w + 1).toString() + "}{|c|}{" + data + "} &";
            }
            //return data + " &"; //Should return multi thing here.
            return "\\multicolumn{" + (w + 1).toString() + "}{|c|}{" + "\\multirow{" + (h + 1).toString() + "} {*} {" + data + "}" + "} &";
        }
        //return "THIS CELL SHOULD NOT BE DISPLAYED";
        var rootp = new TablePoint(undefined, undefined, this.mergeroot);
        if (this.p.row > rootp.row) {
            return "&";
        }
        return "";
    };
    CellDetails.prototype.getTextHeight = function () {
        var lines = this.data.split("\n");
        return lines.length * 20;
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
    CellDetails.prototype.draw = function (xpixel, ypixel, colwidths, rowheights, horizontaldividersize, verticaldividersize, changeData, selectCell, deSelectCell, enableEditMode, disableEditMode, hlines) {
        if (this.isVisible()) {
            return (React.createElement(SVGCell, { key: this.p.toString(), cell: this, xpixel: xpixel, ypixel: ypixel, width: this.calculateWidth(colwidths, horizontaldividersize), height: this.calculateHeight(rowheights, verticaldividersize), changeData: changeData, selectcell: selectCell, deselectcell: deSelectCell, enableedit: enableEditMode, disableedit: disableEditMode, selected: this.selected, editing: this.editing, hlines: hlines, backgroundcolour: this.backgroundcolour }));
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
        _this.state = { table: [], mincellheight: 40, mincellwidth: 50, dividerpixels: 0, horizontallines: true, selecting: false, startselectpoint: [0, 0], endselectpoint: [0, 0] };
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
            rowarray.forEach(function (x) {
                rowlatex = rowlatex + x.getLatex();
            }); /* Escapes & characters and backslashes */
            //rowlatex = rowlatex.slice(0, -3);
            if (rowlatex.charAt(rowlatex.length - 1) === '&')
                rowlatex = rowlatex.slice(0, -1);
            rowlatex = rowlatex + " \\\\";
            if (this_1.state.horizontallines)
                rowlatex = rowlatex + " \\hline";
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
        /*
         * {bs}begin{cu1}center{cu2}
                <br />
                {bs}begin{cu1}tabular{cu2}{cu1}{collatex}{cu2}
                <br />
                {latextable.map((x, i) => <div key={i}>{x}</div>)}
                {bs}end{cu1}tabular{cu2}
                <br />
                {bs}end{cu1}center{cu2}
        */
        return (React.createElement("div", null,
            React.createElement("textarea", { readOnly: true, rows: 15, cols: 15, className: "latex-box", id: "latextextarea", value: latex })));
    };
    MyTable.prototype.svgCreateRect = function (ev) {
        var canvas = document.getElementById("svg");
        var rect = canvas.getBoundingClientRect();
        var x = ev.clientX - rect.left;
        var y = ev.clientY - rect.top;
        this.setState({ selecting: true, startselectpoint: [x, y], endselectpoint: [x, y] });
    };
    MyTable.prototype.svgDestroyRect = function (ev) {
        this.setState({ selecting: false, startselectpoint: [0, 0], endselectpoint: [0, 0] });
    };
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
    MyTable.prototype.drawSelectRect = function () {
        if (this.state.selecting) {
            var start = this.state.startselectpoint;
            var end = this.state.endselectpoint;
            //let size = [Math.abs(this.state.endselectpoint[0] - start[0]), Math.abs(this.state.endselectpoint[1] - start[1])]
            //return <rect x={start[0]} y={start[1]} width={size[0]} height={size[1]} stroke="black" strokeWidth={2} fill="none" />
            return (React.createElement("rect", { id: "svgselectrect", fill: "rgba(255,0,0,0.3)", x: Math.min(start[0], end[0]), y: Math.min(start[1], end[1]), width: Math.abs(start[0] - end[0]), height: Math.abs(start[1] - end[1]) }));
        }
    };
    //Selects the cells highlighted by the box by checking for collision with each cell.
    MyTable.prototype.SelectWithBox = function () {
        var selectionrect = document.getElementById("svgselectrect").getBoundingClientRect();
        for (var row = 0; row < this.getRowCount(); row++) {
            for (var col = 0; col < this.getColCount(); col++) {
                var cell = this.state.table[row][col];
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
    };
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
            React.createElement("svg", { width: tablewidth, height: tableheight, id: "svg", onMouseDown: function (e) { return _this.svgCreateRect(e); }, onMouseUp: function (e) { return _this.svgDestroyRect(e); }, onMouseMove: function (e) { return _this.svgDragRect(e); }, onMouseLeave: function (e) { return _this.svgDestroyRect(e); } },
                this.state.table.map(function (innerArray, row) { return (innerArray.map(function (cell, col) {
                    return cell.draw((colwidths.slice(0, col)).reduce(function (a, b) { return a + b; }, 0) + (_this.state.dividerpixels * (col)), (rowheights.slice(0, row)).reduce(function (a, b) { return a + b; }, 0) + (_this.state.dividerpixels * (row)), //row * (this.state.mincellheight + this.state.dividerpixels),
                    colwidths, rowheights, _this.state.dividerpixels, _this.state.dividerpixels, function (cell, data) { return _this.modifyCellData(cell, data); }, function (cell) { return _this.selectCell(cell); }, function (cell) { return _this.deselectCell(cell); }, function (cell) { return _this.enableCellEdit(cell); }, function (cell) { return _this.disableCellEdit(cell); }, _this.state.horizontallines);
                })); }),
                this.drawSelectRect()),
            React.createElement("br", null),
            React.createElement("h2", null, "LaTeX"),
            React.createElement("button", { className: "table-buttons", type: "button", onClick: function () { return _this.copyLatex(); } }, "Copy LaTeX to clipboard"),
            this.convertToLatex()));
    };
    //Colour Stuff
    MyTable.prototype.chooseColour = function (e) {
        this.chosencolour = e.target.value;
    };
    MyTable.prototype.setCellBackgroundColours = function () {
        var _this = this;
        var selectedcells = this.getSelectedCells();
        selectedcells.forEach(function (item) {
            item.setBackgroundColour(_this.chosencolour);
        });
        var newtable = this.state.table.map(function (x) { return x; });
        this.setState({ table: newtable });
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
    MyTable.prototype.componentDidMount = function () {
        this.colourpickerref.current.value = this.chosencolour;
    };
    MyTable.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", { className: "table-div" },
            React.createElement("h2", null, "Table"),
            React.createElement("div", { className: "table-buttons-div" },
                React.createElement("h3", null, "Global Controls"),
                React.createElement("button", { type: "button", onClick: function () { return _this.addRow(); } }, "Add Row"),
                React.createElement("button", { className: "table-buttons", type: "button", onClick: function () { return _this.addCol(); } }, "Add Column"),
                React.createElement("button", { className: "table-buttons", type: "button", onClick: function () { return _this.mergeCells(); } }, "Merge Selected Cells"),
                React.createElement("button", { className: "table-buttons", type: "button", onClick: function () { return _this.splitCells(); } }, "Split Selected Cells"),
                React.createElement("button", { className: "table-buttons", type: "button", onClick: function () { return _this.setState({ horizontallines: !_this.state.horizontallines }); } }, "Toggle horizontal lines"),
                React.createElement("button", { className: "table-buttons", type: "button", onClick: function () { return _this.deselectAllCells(); } }, "Deselect All Cells"),
                React.createElement("button", { className: "table-buttons", type: "button", onClick: function () { return _this.selectAllCells(); } }, "Select All Cells")),
            React.createElement("div", { className: "table-buttons-div" },
                React.createElement("h3", null, "Selected Cell Controls"),
                React.createElement("input", { type: "color", onChange: function (e) { return _this.chooseColour(e); }, ref: this.colourpickerref }),
                React.createElement("button", { className: "table-buttons", type: "button", onClick: function () { return _this.setCellBackgroundColours(); } }, "Set Selected Cells to this colour")),
            this.drawTable()));
    };
    MyTable.prototype.copyLatex = function () {
        var copyText = document.getElementById("latextextarea");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy");
        var sel = document.getSelection();
        sel.removeAllRanges();
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
            if (lines.length === 1) {
                return (React.createElement("g", null,
                    React.createElement("text", { x: this.props.xpixel + this.props.width / 2, y: this.props.ypixel + 20, textAnchor: "middle", alignmentBaseline: "central", className: "celltext" }, lines[0])));
            }
            return (React.createElement("g", null, lines.map(function (line, i) {
                return React.createElement("text", { x: _this.props.xpixel + _this.props.width / 2, y: _this.props.ypixel + 9 + (i * 20), textAnchor: "middle", alignmentBaseline: "central", className: "celltext" }, line);
            })));
        }
        else {
            var rows = lines.length;
            return (React.createElement("foreignObject", { x: this.props.xpixel, y: this.props.ypixel, width: this.props.width, height: this.props.height },
                React.createElement("textarea", { className: "cell-input", value: this.props.cell.getData(), rows: 100, tabIndex: 0, onChange: function (e) { return _this.changeData(e); }, onBlur: function (e) { return _this.disableEdit(e); }, autoFocus: true, onFocus: function (e) { return _this.moveCursorToEnd(e); } })));
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
        return "black";
    };
    SVGCell.prototype.getSelectedStyling = function () {
        if (this.props.selected) {
            return (React.createElement("rect", { x: this.props.xpixel + 2, y: this.props.ypixel + 2, width: this.props.width - 4, height: this.props.height - 4, fill: "none", stroke: "red", strokeWidth: 2 }));
        }
    };
    SVGCell.prototype.componentDidUpdate = function () {
    };
    SVGCell.prototype.render = function () {
        var _this = this;
        return (React.createElement("g", { onDoubleClick: function () { return _this.props.enableedit(_this.props.cell); }, onClick: function (e) { return _this.clickCell(e); }, id: this.props.cell.p.toString(), className: "ACell" },
            React.createElement("rect", { x: this.props.xpixel, y: this.props.ypixel, width: this.props.width, height: this.props.height, fill: this.getRectColour(), stroke: this.getBorderColour(), strokeWidth: this.props.hlines ? 2 : 0 }),
            this.getSelectedStyling(),
            this.getText()));
    };
    return SVGCell;
}(React.Component));
//# sourceMappingURL=MyTable.js.map