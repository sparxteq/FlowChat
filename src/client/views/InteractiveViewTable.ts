import { DB } from "../../../../Zing3/share/DB";
import { ZUI } from "../../../../Zing3/zui/ZUI";
import { TableAb } from "../../common/TableAb";
import { TableMem } from "../../common/TableMem";




export class InteractiveViewTable extends TableAb{
    private baseTable:TableMem=<any>undefined;
    private ranges:FieldRanges={};
    private activeColumnNames:{[colName:string]:boolean}={}
    constructor(base?:TableMem){
        super();
        if (base){
            this.setBase(base);
        }
    }
    isEmpty():boolean{
        if (!this.baseTable)   
            return true;
        let nCol = this.baseTable.nCols();
        let nRow = this.baseTable.nRows();
        if (nCol<=0 || nRow<=0)
            return true;
        else
            return false;
    }
    setBase(base:TableMem){
        this.baseTable=base;
        this.initRows();
        this.initCols();
        this.initRanges();
        this.initHighlights();
        this.initSorts();
        
        this.evalView();
    }
    private rowViewtoB:number[]=[]
    private initRows(){
        let nr = this.baseTable.nRows();
        this.rowViewtoB=[];
        this.rowViewtoB.length=nr;
        for (let r=0;r<nr;r++){
            this.rowViewtoB[r]=r;
        }
    }
    addRow(columnValues: any[]): void {
        throw new Error("Method not implemented.");
    }
    nRows(): number {
        return this.rowViewtoB.length;
    }
    nRowsV():number{
        return this.nRows()
    }
    nRowsB():number{
        return this.baseTable.nRows();
    }
    startRows(): void {
        throw new Error("Method not implemented.");
    }
    nextRow(): Promise<any[] | null> {
        throw new Error("Method not implemented.");
    }
    rowVtoB(viewRow:number):number{
        if (viewRow>=0 && viewRow<this.rowViewtoB.length)
            return this.rowViewtoB[viewRow]
        else
            return -1;
    }
    rowBtoV(baseRow:number):number{
        for (let vr=0;vr<this.rowViewtoB.length;vr++){
            if (this.rowViewtoB[vr]==baseRow)
                return vr;
        }
        return -1;
    }
    private columnVtoB:number[]=[];
    private columnNameToV:{[name:string]:number}={}
    private initCols(){
        let ncB = this.baseTable.nCols();
        this.columnVtoB=[];
        this.columnVtoB.length=ncB;
        for (let cB=0;cB<ncB;cB++){
            this.columnVtoB[cB]=cB;
            let cNam = this.baseTable.colName(cB);
            this.columnNameToV[<string>cNam]=cB;
        }
    }
    colNtoV(colName:string):number{
        let cv = this.columnNameToV[colName]
        if (cv || cv==0)
            return cv;
        else
            return -1
    }
    colVtoN(viewIdx:number):string{
        for (let cn in this.columnNameToV){
            if (this.columnNameToV[cn]==viewIdx)
                return cn;
        }
        return "";
    }
    columnIdx(name:string):number{
        return this.colNtoV(name)
    }
    nCols():number{
        return this.nColsV()
    }
    nColsV():number{
        return this.columnVtoB.length;
    }
    nColsB():number{
        return this.baseTable.nCols();
    }
    colNamesB():string[]{
        return this.baseTable.colNames();
    }
    colNamesV():string[]{
        let s:string[]=[];
        for (let baseIdx of this.columnVtoB){
            let bName = this.baseTable.colName(baseIdx);
            s.push(<string>bName);
        }
        return s;
    }
    colNames():string[]{
        return this.colNamesV();
    }
    hasCol(name:string):boolean{
        return this.colNtoV(name)>=0
    }
    colName(viewIdx:number):string{
        return this.colVtoN(viewIdx)
    }
    colNtoB(colName:string):number{
        return this.baseTable.columnIdx(colName);
    }
    colBtoN(baseIdx:number):string{
        let n = this.baseTable.colName(baseIdx)
        if (n)
            return n
        else 
            return "";
    }
    colVtoB(viewIdx:number):number{
        let b = this.columnVtoB[viewIdx];
        if(!b && b!=0)
            return -1;
        return b;
    }
    colBtoV(baseIdx:number):number{
        let nc=this.columnVtoB.length;
        for (let v=0;v<nc;v++){
            let b = this.columnVtoB[v];
            if (b==baseIdx)
                return v;
        }
        return -1;
    }
    
    private rowSort:{columnName:string,descending:boolean}|undefined
    setRowSort(columnName?:string,descending?:boolean){
        if (columnName){
            this.rowSort={columnName:columnName,descending:descending?true:false}
        } else {
            this.rowSort = undefined;
        }
        this.evalSort();
    }
    getRowSort():{columnName:string,descending:boolean}|undefined{
        return this.rowSort;
    }
    
    private colSort:{rowIdxB:number,descending:boolean}={rowIdxB:-1,descending:true}
    setColSort(rowIdxB:number,descending?:boolean){
        this.colSort={rowIdxB:rowIdxB,descending:descending?true:false}
        this.evalSort();
    }
    getColSort():{rowIdxB:number,descending:boolean}{
        return this.colSort;
    }
    private initSorts(){
        this.rowSort=undefined;
        this.colSort={rowIdxB:-1,descending:true};
    }
    evalSort(){
        this.sortRows();
        this.sortCols();
    }
        private sortRows(){
            if (!this.rowSort)
                return;
            let descending = this.rowSort.descending;
            let colB = this.baseTable.columnIdx(this.rowSort.columnName)
            this.rowViewtoB.sort((aRowB:number,bRowB:number)=>{
                let aVal = this.baseTable.getCell(aRowB,colB)
                let bVal = this.baseTable.getCell(bRowB,colB);
                let rslt = this.compareTSTableCells(aVal,bVal)
                if (descending)
                    return -rslt;
                else
                    return rslt;
            })
        }
            private compareTSTableCells(aVal:TSTableCell,bVal:TSTableCell):number{
                let rslt=0;
                if (typeof aVal == "number"){
                    if (typeof bVal == "number"){
                        rslt = aVal - bVal
                    } else {
                        rslt = 1;
                    }
                } else {
                    if (typeof bVal == "number"){
                        rslt = -1;
                    } else if (aVal){
                        rslt = aVal.localeCompare(bVal)
                    } else {
                        DB.msg("aVal="+aVal)
                    }
                }
                return rslt;
            }
        private sortCols(){
            if (!this.colSort )
                return;
            let descending = this.colSort.descending;
            let rowB = this.colSort.rowIdxB;
            if (rowB<0)
                return;
            this.columnVtoB.sort((aColB:number,bColB:number)=>{
                let aVal = this.baseTable.getCell(rowB,aColB);
                let bVal = this.baseTable.getCell(rowB,bColB);
                let rslt = this.compareTSTableCells(aVal,bVal);
                if (descending)
                    return -rslt;
                else
                    return rslt;
            })
        }

    
    private nRowHighlights=2;
    getNRowHighlights():number{return this.nRowHighlights}
    setNRowHighlights(n:number){
        this.nRowHighlights=n;
        this.evalView();
    }
    private rowHighlightsB:number[]=[];
    private initHighlights(){
        this.rowHighlightsB=[];
    }
    addHighlightRowB(baseRow:number){
        let i = this.rowHighlightsB.indexOf(baseRow);
        if (i>=0)
            this.rowHighlightsB.splice(i,1);
        else {
            this.rowHighlightsB.push(baseRow)
            //if(this.rowHighlightsB.length>this.nRowHighlights)
            //    this.rowHighlightsB.splice(0,1);
        }
        this.viewChange();
    }
    addHighlightRowV(viewRow:number){
        let b = this.rowVtoB(viewRow)
        this.addHighlightRowB(b);
    }
    highlightRowsV():number[]{
        let va:number[]=[];
        for (let b of this.rowHighlightsB){
            let v = this.rowBtoV(b);
            va.push(v);
        }
        return va;
    }
    highlightRowsB():number[]{
        return this.rowHighlightsB;
    }


    private nColumnHighlights=2;
    nColHighlights():number{return this.nColumnHighlights}
    setNColHighlights(n:number){
        this.nColumnHighlights=n;
        this.evalView();
    }
    private colHighlightsB:number[]=[];
    addHighlightColB(baseCol:number){
        let i = this.colHighlightsB.indexOf(baseCol);
        if (i>=0)
            this.colHighlightsB.splice(i,1);
        else 
            this.colHighlightsB.push(baseCol)
       
        this.viewChange();
    }
    addHighlightColV(viewCol:number){
        let b = this.colVtoB(viewCol)
        this.addHighlightColB(b);
    }
    highlightColsV():number[]{
        let va:number[]=[];
        for (let b of this.colHighlightsB){
            let v = this.colBtoV(b);
            va.push(v);
        }
        return va;
    }
    highlightColsB():number[]{
        return this.colHighlightsB;
    }
    private listeners:{[listener:string]:ViewListener}={}
    addListener(listener:ViewListener){
        let id = listener.listenerId();
        this.listeners[id]=listener;
    }
    remListener(listener:ViewListener){
        let id = listener.listenerId();
        if (this.listeners[id]){
            delete this.listeners[id]
        }
    }
    private viewChange(){
        for (let lId in this.listeners){
            let l = this.listeners[lId];
            l.viewChange();
        }
        ZUI.notify();
    }
    setCell(viewRow:number,viewCol:number,val:TSTableCell){
        let rB = this.rowViewtoB[viewRow]
        let cB = this.columnVtoB[viewCol]
        this.baseTable.setCell(rB,cB,val)
    }
    getCell(viewRow:number,viewCol:number):TSTableCell{
        let rB = this.rowViewtoB[viewRow]
        if (viewCol==-1)
            return rB;
        let cB = this.columnVtoB[viewCol]
        return this.baseTable.getCell(rB,cB)
    }
    getRow(viewRow:number):TSTableCell[]{
        let bRow = this.rowViewtoB[viewRow]
        let row:TSTableCell[]=[];
        for (let bCol of this.columnVtoB){
            let cell = this.baseTable.getCell(bRow,bCol);
            row.push(cell)
        }
        return row;
    }
    getRowB(baseRow:number):TSTableCell[]{
        return this.baseTable.getRow(baseRow);
    }
    getRowV(viewRow:number):TSTableCell[]{
        return this.getRow(viewRow);
    }

    initRanges(){
        this.ranges={}
    }
    clearRanges(){
        for (let field in this.ranges){
            let range = this.ranges[field];
            range.zoomMax=range.upper;
            range.zoomMin=range.lower;
        }
        this.evalView();
    }
    zoomSelect(field:string,min:number,max:number,field2?:string,min2?:number,max2?:number){

        let range = this.ranges[field];
        if (range){
            if (min<range.lower)
                range.zoomMin=range.lower;
            else
                range.zoomMin = min;
            if (max>range.upper)
                range.zoomMax=range.upper
            else
                range.zoomMax=max;
        }
        if (field2){
            range = this.ranges[field2];
            if (range){
                if (<number>min2<range.lower)
                    range.zoomMin=range.lower;
                else
                    range.zoomMin = <number>min2;
                if (<number>max2>range.upper)
                    range.zoomMax=range.upper
                else
                    range.zoomMax=<number>max2;
            }
        }
        this.evalView();
    }
    getRanges():FieldRanges{
        return this.ranges;
    }
    fieldRange(field:string):FieldRange{
        let range = this.ranges[field];
        return range;
    }
    private evalRanges(){
        this.rowViewtoB=[]
        let nbr = this.baseTable.nRows();
        for (let rb =0; rb<nbr;rb++){
            let row = this.baseTable.getRow(rb);
            if (this.rowInRange(row,rb))
                this.rowViewtoB.push(rb)
        }
    }
        private rowInRange(rowB:TSTableCell[],rowNumber:number):boolean{
            for (let field in this.ranges){
                let range = this.ranges[field];
                let cellV = <number>rowB[range.colB];
                if (range.colB<0) { // row number
                    cellV=rowNumber
                }
                if (cellV>=range.zoomMax || cellV <=range.zoomMin)
                    return false;
            }
            return true;
        }
    evalView(){
        this.evalRanges();
        this.evalSort()
        this.viewChange();
    }
}
type TSTableCell = number | string ;
type FieldRange = {
    colB:number;
    upper:number;       // maximum number for this range
    zoomMax:number;     // maximum number selected
    zoomMin:number;     // minimum number selected
    lower: number;      // lowest number for this range
}

export type FieldRanges = {[fieldName:string]:FieldRange}
export interface ViewListener {
    viewChange():void;
    listenerId():string;
}