import { TableMem } from "./TableMem";



export class TableMemBest extends TableMem{
    private sortColumn="";
    private maxRows:number;
    private sortColIdx=-1;
    constructor(sortColumn:string,maxRows=5000){
        super();
        this.sortColumn=sortColumn;
        this.maxRows=maxRows;
    }
    addRow(columnValues: any[]): void {
        if (this.sortColIdx<0)
            this.sortColIdx = this.columnIdx(this.sortColumn);
        let sortVal = <number>columnValues[this.sortColIdx];
        if (this.cells.length<this.maxRows){
            this.cells.push(columnValues)
            this.reorderLast();
        } else {
            let lastRow = this.cells[this.cells.length-1]
            if (lastRow[this.sortColIdx]<sortVal){
                this.cells[this.cells.length-1]=columnValues;
                this.reorderLast();
            }
        }
    }
    private reorderLast(){
        let curRowIdx = this.cells.length-1;
        while (curRowIdx>0){
            let curSortVal = this.cells[curRowIdx][this.sortColIdx]
            let prevSortVal = this.cells[curRowIdx-1][this.sortColIdx]
            if (curSortVal>prevSortVal){
                let tmp = this.cells[curRowIdx];
                this.cells[curRowIdx]=this.cells[curRowIdx-1]
                this.cells[curRowIdx-1]=tmp;
                curRowIdx--
            } else {
                return;
            }
        }
    }
}