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
var MyTable = /** @class */ (function (_super) {
    __extends(MyTable, _super);
    function MyTable(props) {
        var _this = _super.call(this, props) || this;
        _this.init = false;
        _this.addRow = _this.addRow.bind(_this);
        _this.addCol = _this.addCol.bind(_this);
        _this.state = { table: [], rows: 5, cols: 5 };
        return _this;
        //this.table = null;
        //this.table = [];
    }
    MyTable.prototype.testPopulateTable = function () {
        for (var i = 0; i < this.state.rows; i++) {
            var row = [];
            for (var j = 0; j < this.state.cols; j++) {
                row.push((i * j).toString());
            }
            this.state.table.push(row);
        }
        this.init = true;
        //this.table = newtable;
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
        //this.setState({ table: [] });
        var newtable = this.state.table.map(function (x) { return x; });
        for (var i = 0; i < this.state.rows; i++) {
            newtable[i].push("");
        }
        this.setState({ table: newtable });
    };
    MyTable.prototype.modifyCellData = function (x, y, data) {
        var newtable = this.state.table.map(function (x) { return x; });
        newtable[x][y] = data;
        this.setState({ table: newtable });
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
            row.forEach(function (x) { return rowlatex = rowlatex + x + " & "; });
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
            latextable.map(function (x) { return React.createElement("div", null, x); }),
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
        //alert("Drawing table!");
        var _this = this;
        if (!this.init) {
            this.testPopulateTable();
        }
        return (React.createElement("div", null,
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
/*type CellState = {
    data: string
}*/
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
//# sourceMappingURL=MyTable.js.map