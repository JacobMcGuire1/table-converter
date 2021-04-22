export {escapeLatex, escapeHTML, TablePoint, moveTablePoint, Direction, BorderStyle}


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
    public readonly row: number;
    public readonly col: number;
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

function moveTablePoint(p: TablePoint, dir: Direction): TablePoint {
    switch(dir){
        case Direction.Up:
            return new TablePoint(p.row - 1, p.col, undefined);
        case Direction.Down:
            return new TablePoint(p.row + 1, p.col, undefined);
        case Direction.Left:
            return new TablePoint(p.row, p.col - 1, undefined);
        case Direction.Right:
            return new TablePoint(p.row, p.col + 1, undefined);
    }
          
}


enum Direction {
    Up,
    Down,
    Left,
    Right,
  }

enum BorderStyle {
    Solid = "solid",
    Dotted = "dotted",
    Dashed = "dashed",
    None = "none"
}
