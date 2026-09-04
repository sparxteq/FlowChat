import { ZField } from "../../common/ZT";



export abstract class TableAb {
    protected columns:ZField[]=[];
    private colNameToIdx:{[colName:string]:number}={}
    
        /**
         * 
         * @returns the descriptions of the columns of this table in the
         * order they should be received.
         */
    getColTypes():ZField[]{
        return [...this.columns]
    }
    setColTypes(types:ZField[]){
        this.columns = [...types]
        this.colNameToIdx={}
        for (let colI in this.columns){
            let name = this.columns[colI].fieldName.trim();
            let colN = Number.parseInt(colI)
            this.colNameToIdx[name]=colN;
        }
    }
        /**
         * Returns the index of the column with the given name.
         *
         * @param colName - The internal name of the column to look up.
         * @returns The zero-based index of the column if found, or -1 if not found.
         */
    columnIdx(colName: string): number {
        const rslt = this.colNameToIdx[colName];
        if (!rslt && rslt !== 0)
            return -1;
        else
            return rslt;
    }
    hasCol(cid:string):boolean{
        return this.colNameToIdx[cid]?true:false
    }
    colName(colIdx:number):string |undefined{
        if (this.columns[colIdx])
            return this.columns[colIdx].fieldName
    }
    colNames():string[]{
        let names:string[]=[];
        for (let col of this.columns){
            names.push(col.fieldName.trim())
        }
        return names;
    }
    nCols():number{
        return this.columns.length;
    }
        /**
         * 
         * @param columnValues values to be added as a new row to the
         * end of this table
         */
    abstract addRow(columnValues:any[]):void;
        /**
         * @returns the number of rows in the table
         */
    abstract nRows():number;
        /**
         * Restarts reading or writing of rows at 0
         */
    abstract startRows():void;
        /**
        * reads the next row of the table 
        * @returns an array of the contents of the row
        * or null if there is no next row
        */
    abstract nextRow():Promise<any[]|null>;
    async processRows(processRow:(rowRec:{[columnName:string]:any})=>Promise<void>){
        let colNames = this.colNames();
        let row=await this.nextRow();
        while (row){
            let rec:{[columnName:string]:any}={};
            for (let r=0;r<row.length;r++){
                rec[colNames[r]]=row[r];
            }
            await processRow(rec);
            row = await this.nextRow();
        }
    }
        /**
         * 
         * @param outCols A list of columns from an output
         * @param inCols A list of columns from an input
         * @returns true if outCols are type compatible with inCols
         */
    static typeCheckColumns(outCols:ZField[],inCols:ZField[]):boolean{

        if (outCols.length > inCols.length)
            return false
        for (let i in outCols){
            const col = inCols[i];
            const colO = outCols[i];
            if (col.type.typeMatch(colO.type)!="")
                return false;
        }
        return true;
    }
        /**
         * Checks if the value matches the type of the column at the given index.
         *
         * @param colIdx - The zero-based index of the column to check.
         * @param val - The value to be type-checked against the column's type.
         * @returns True if type checking is disabled or the value matches the column's type; false otherwise.
         */
    colTypeCheck(colIdx: number, val: any): boolean {
        if (colIdx < 0 || colIdx >= this.columns.length)
            return false;
        let col = this.columns[colIdx];
        return col.type.valueTypeCheck(val)=="";
    }
    

    async toJSON():Promise<any>{
        let json:any = { _type:this.constructor.name}
        let columnDescs:any[] = [];
        for (let col of this.columns){
            columnDescs.push(col.toJSON())
        }
        json.descs = columnDescs;
        let rows:any[][] = [];
        let nr = this.nRows();
        for (let r=0;r<nr;r++){
            let row = await this.nextRow();
            if(row)
                rows.push(row)
        }
        json.rows=rows;
        return json;
    }
    fromJSON(json:any){
        let cols:ZField[]=[];
        let descs = json.descs;
        for (let desc of descs){
            let col:ZField = ZField.fromJSON(desc);
            cols.push(col)
        }
        this.setColTypes(cols);
        const rows = json.rows;
        for (let row of rows){
            this.addRow(row)
        }
    }
    
}