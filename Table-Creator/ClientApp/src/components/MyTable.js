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
    //table: String[][];
    function MyTable(props) {
        return _super.call(this, props) || this;
        //this.table = String[][];
    }
    MyTable.prototype.render = function () {
        return (React.createElement("div", null,
            React.createElement("h1", null, "test")));
    };
    return MyTable;
}(React.Component));
exports.default = MyTable;
/*type CardProps = {
    title: string,
    paragraph: string
}

export const Card = ({ title, paragraph }: CardProps) => <aside>
    <h2>{title}</h2>
    <p>
        {paragraph}
    </p>
</aside>

const el = <Card title="Welcome!" paragraph="To this example" />*/ 
//# sourceMappingURL=MyTable.js.map