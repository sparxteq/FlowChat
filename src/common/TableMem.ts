import { TableAb } from "./TableAb";
import { ZAny, ZField } from "./ZT";



export class TableMem extends TableAb{
    protected cells:any[][]=[];
    private nextRowIdx=0;

    addRow(columnValues: any[]): void {
        this.cells.push(columnValues);
    }
    nRows(): number {
        return this.cells.length;
    }
    startRows(): void {
        this.nextRowIdx=0;;
    }
    async nextRow(): Promise<any[] | null> {
        let row = this.cells[this.nextRowIdx];
        if (row)
            this.nextRowIdx++;
        return row;
    }
    fromString(csvStr:string){
        let csvLines = csvStr.split("\n")
        for (let i=0;i<csvLines.length;i++){
            let line = csvLines[i];
            csvLines[i]=line.trim();
        }
        this.addHeaders(csvLines[0])
        for (let lineI=1;lineI<csvLines.length;lineI++){
            let row = this.strToRow(csvLines[lineI])
            this.addRow(row);
        }
    }
    private addHeaders(headers:string){
        let colNames = headers.split(",");
        let colTypes:ZField[]=[];
        for (let rawCol of colNames){
            let col = rawCol.trim();
            let ct = new ZField(col,new ZAny())
            colTypes.push(ct);
        }
        this.setColTypes(colTypes);
    }
    private strToRow(line:string):any[]{
        let row:any[]=[];
        let items:string[]=line.split(",")
        for (let item of items){
            let tItem = item.trim();
            if (typeof tItem == "number"){
                row.push(Number.parseFloat(tItem))
            } else if (typeof tItem == "string"){
                row.push(tItem)
            } else {
                row.push(undefined);
            }
        }
        return row;
    }
    isEmpty():boolean{
        return !this.cells || this.cells.length==0
    }
    setCell(rowIdx: number, colIdx: number, val: any): void {
        if (rowIdx < 0 || colIdx < 0) throw 'setCell: negative index';
        if (!this.colTypeCheck(colIdx, val))
            throw 'setCell typecheck failure';
        if (!this.cells[rowIdx])
            this.cells[rowIdx] = [];
        this.cells[rowIdx][colIdx] = val;
    }
    getCell(rowIdx: number, colIdx: number): any {
        if (colIdx==-1)
            return rowIdx;
        if (rowIdx >= 0 && rowIdx < this.cells.length) {
            const row = this.cells[rowIdx];
            if (row && colIdx >= 0 && colIdx < row.length) {
                return row[colIdx];
            }
        } 
        return null;
    }
    getRow(row:number):any[]{
        return this.cells[row]
    }
}