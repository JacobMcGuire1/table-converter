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
                row.push(React.createElement(Cell, { data: (i * j).toString() }));
            }
            this.state.table.push(row);
        }
        //this.table = newtable;
    };
    MyTable.prototype.addRow = function () {
        this.setState({ table: [] });
        this.setState({ rows: this.state.rows + 1 });
    };
    MyTable.prototype.addCol = function () {
        this.setState({ table: [] });
        this.setState({ cols: this.state.cols + 1 });
    };
    MyTable.prototype.drawTable = function () {
        this.testPopulateTable();
        return (React.createElement("table", null,
            React.createElement("tbody", null, this.state.table.map(function (innerArray, i) { return (React.createElement("tr", { key: i }, innerArray.map(function (item, j) { return React.createElement("td", { key: (i + 1) * (j + 1) }, item); }))); }))));
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
        _this.data = _this.props.data;
        return _this;
    }
    Cell.prototype.render = function () {
        return (React.createElement("div", null, this.data));
    };
    return Cell;
}(React.Component));
//# sourceMappingURL=MyTable.js.map