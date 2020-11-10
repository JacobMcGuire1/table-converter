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
function escapeLatex(str) {
    str = str.split("\\").join("\\textbackslash");
    str = str.split("&").join("\\&");
    return str;
}
var MyTable = /** @class */ (function (_super) {
    __extends(MyTable, _super);
    function MyTable(props) {
        var _this = _super.call(this, props) || this;
        _this.addRow = _this.addRow.bind(_this);
        _this.addCol = _this.addCol.bind(_this);
        _this.state = { table: [], rows: 5, cols: 5, mincellheight: 50, mincellwidth: 150, dividerpixels: 5, colwidths: [], rowheights: [] };
        _this.testPopulateTable();
        return _this;
    }
    MyTable.prototype.testPopulateTable = function () {
        for (var i = 0; i < this.state.rows; i++) {
            var row = [];
            for (var j = 0; j < this.state.cols; j++) {
                row.push((i * j).toString());
            }
            this.state.table.push(row);
        }
        for (var i = 0; i < this.state.rows; i++) { //Must change this if we initialise table with data.
            this.state.rowheights.push(this.state.mincellheight);
        }
        for (var i = 0; i < this.state.cols; i++) { //Must change this if we initialise table with data.
            this.state.colwidths.push(this.state.mincellwidth);
        }
    };
    MyTable.prototype.addRow = function () {
        this.setState({ rows: this.state.rows + 1 });
        var newtable = this.state.table.map(function (x) { return x; });
        var row = [];
        for (var j = 0; j < this.state.cols; j++) {
            row.push("");
        }
        newtable.push(row);
        this.setState({ table: newtable });
    };
    MyTable.prototype.addCol = function () {
        this.setState({ cols: this.state.cols + 1 });
        var newtable = this.state.table.map(function (x) { return x; });
        for (var i = 0; i < this.state.rows; i++) {
            newtable[i].push("");
        }
        this.setState({ table: newtable });
    };
    MyTable.prototype.modifyCellData = function (x, y, data) {
        var newtable = this.state.table.map(function (x) { return x; });
        newtable[x][y] = data;
        var lines = data.split("\n");
        var largestwidth = 0;
        for (var i = 0; i < lines.length; i++) {
            //document.measureText(lines[i]);
            var width = this.checkTextSize(data).width * 1.75;
            if (width > largestwidth) {
                largestwidth = width;
            }
        }
        ;
        if (largestwidth > this.state.colwidths[y]) {
            var newcolwidths = this.state.colwidths.map(function (x) { return x; });
            newcolwidths[y] = largestwidth;
            this.setState({ table: newtable, colwidths: newcolwidths });
            //console.log(this.state.colwidths.toString());
        }
        else {
            if (largestwidth < this.state.colwidths[y]) {
                var newcolwidth = this.adjustColWidth(y);
                if (newcolwidth !== -1) {
                    var newcolwidths = this.state.colwidths.map(function (x) { return x; });
                    if (newcolwidth > this.state.mincellwidth) {
                        newcolwidths[y] = newcolwidth;
                    }
                    else {
                        newcolwidths[y] = this.state.mincellwidth;
                    }
                    this.setState({ table: newtable, colwidths: newcolwidths });
                }
                else {
                    this.setState({ table: newtable });
                }
            }
            else {
                this.setState({ table: newtable });
            }
        }
    };
    MyTable.prototype.adjustColWidth = function (col) {
        var currentwidth = this.state.colwidths[col];
        var largestwidth = 0;
        for (var i = 0; i < this.state.rows; i++) {
            var data = this.state.table[i][col];
            var lines = data.split("\n");
            for (var j = 0; j < lines.length; j++) {
                var width = this.checkTextSize(data).width * 1.75;
                if (width > largestwidth) {
                    largestwidth = width;
                }
            }
        }
        if (largestwidth < currentwidth) {
            return largestwidth;
        }
        else {
            return -1;
        }
    };
    MyTable.prototype.checkTextSize = function (text) {
        var canvas = document.createElement('canvas'), context = canvas.getContext('2d');
        return context === null || context === void 0 ? void 0 : context.measureText(text);
    };
    MyTable.prototype.resizeRow = function (width, height) {
    };
    MyTable.prototype.convertToLatex = function () {
        var collatex = "|";
        for (var i = 0; i < this.state.cols; i++) {
            collatex = collatex + "c|";
        }
        var latextable = [];
        var _loop_1 = function (i) {
            var row = this_1.state.table[i];
            var rowlatex = "";
            row.forEach(function (x) { return rowlatex = rowlatex + escapeLatex(x) + " & "; }); /* Escapes & characters and backslashes */
            rowlatex = rowlatex.slice(0, -3);
            rowlatex = rowlatex + " \\\\";
            latextable.push(rowlatex);
        };
        var this_1 = this;
        for (var i = 0; i < this.state.rows; i++) {
            _loop_1(i);
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
            latextable.map(function (x) { return React.createElement("div", { key: x }, x); }),
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
    MyTable.prototype.drawTable = function () {
        var _this = this;
        return (React.createElement("div", null,
            React.createElement("svg", { width: this.state.colwidths.reduce(function (a, b) { return a + b; }, 0) + (this.state.dividerpixels * this.state.cols), height: this.state.rowheights.reduce(function (a, b) { return a + b; }, 0) + (this.state.dividerpixels * this.state.rows), id: "svg" }, this.state.table.map(function (innerArray, x) { return (innerArray.map(function (item, y) {
                return React.createElement(SVGCell, { data: item, x: x, y: y, xpixel: (_this.state.colwidths.slice(0, y)).reduce(function (a, b) { return a + b; }, 0) + (_this.state.dividerpixels * (y)) /*xpixel={y * (this.state.mincellwidth + 10) /*Need to make these 2 count the heights/widths.*/, ypixel: x * (_this.state.mincellheight + _this.state.dividerpixels), width: _this.state.colwidths[y], height: _this.state.rowheights[x], changeData: function (x, y, data) { return _this.modifyCellData(x, y, data); }, resizeRow: function (width, height) { return _this.resizeRow(width, height); } });
            })); })),
            React.createElement("table", null,
                React.createElement("tbody", null, this.state.table.map(function (innerArray, i) { return (React.createElement("tr", { key: i }, innerArray.map(function (item, j) {
                    return React.createElement("td", { key: i + "," + j },
                        React.createElement(Cell, { data: item, x: i, y: j, changeData: function (x, y, data) { return _this.modifyCellData(x, y, data); } }));
                }))); }))),
            React.createElement("br", null),
            "LaTeX:",
            React.createElement("br", null),
            this.convertToLatex()));
    };
    MyTable.prototype.render = function () {
        return (React.createElement("div", null,
            React.createElement("h1", null, "Table:"),
            React.createElement("button", { type: "button", onClick: this.addRow }, "Add Row"),
            React.createElement("button", { type: "button", onClick: this.addCol }, "Add Column"),
            this.drawTable()));
    };
    return MyTable;
}(React.Component));
exports.default = MyTable;
var Cell = /** @class */ (function (_super) {
    __extends(Cell, _super);
    function Cell(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { data: _this.props.data };
        return _this;
    }
    Cell.prototype.changeData = function (e) {
        this.props.changeData(this.props.x, this.props.y, e.target.value);
    };
    Cell.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", null,
            React.createElement("textarea", { onChange: function (e) { return _this.changeData(e); }, value: this.props.data })));
    };
    return Cell;
}(React.Component));
var SVGCell = /** @class */ (function (_super) {
    __extends(SVGCell, _super);
    function SVGCell(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { editing: false };
        _this.ref = React.createRef();
        return _this;
        //this.state = { data: this.props.data };
    }
    SVGCell.prototype.toggleEditMode = function () {
        this.setState({ editing: !this.state.editing });
    };
    SVGCell.prototype.changeData = function (e) {
        this.props.changeData(this.props.x, this.props.y, e.target.value);
    };
    SVGCell.prototype.moveCursorToEnd = function (e) {
        var value = e.target.value;
        e.target.value = "";
        e.target.value = value;
    };
    SVGCell.prototype.getText = function () {
        var _this = this;
        if (!this.state.editing) {
            return (React.createElement("text", { x: this.props.xpixel + this.props.width / 2, y: this.props.ypixel + 20, textAnchor: "middle", alignmentBaseline: "central" /* Should let user choose alignment*/ }, this.props.data));
        }
        else {
            return (React.createElement("foreignObject", { x: this.props.xpixel, y: this.props.ypixel, width: this.props.width, height: this.props.height },
                React.createElement("div", null,
                    React.createElement("textarea", { onChange: function (e) { return _this.changeData(e); }, value: this.props.data, autoFocus: true, onBlur: function () { return _this.toggleEditMode(); }, onFocus: function (e) { return _this.moveCursorToEnd(e); } }))));
        }
    };
    SVGCell.prototype.componentDidUpdate = function () {
        var k = this.ref;
        var j = k.current;
        if (!this.state.editing) {
            //console.log(this.props.x.toString() + this.props.y.toString() + "dwad" + text.scrollWidth);
            var text = j.children[1];
            //text.
        }
        //console.log(text.clientWidth);
        //if (text is )
    };
    SVGCell.prototype.render = function () {
        var _this = this;
        return (React.createElement("g", { onDoubleClick: function () { return _this.toggleEditMode(); }, id: "cell:" + this.props.xpixel.toString() + this.props.ypixel.toString(), ref: this.ref },
            React.createElement("rect", { x: this.props.xpixel, y: this.props.ypixel, width: this.props.width, height: this.props.height, fill: "grey" }),
            this.getText()));
    };
    return SVGCell;
}(React.Component));
//# sourceMappingURL=MyTable.js.map