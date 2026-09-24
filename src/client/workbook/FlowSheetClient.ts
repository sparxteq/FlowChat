import { DataSourceRef, FlowSheetJSON, UnitInstanceId, UnitTypeId } from "../../common/WorkbookJSON";
import { StepInstanceClient } from "./StepInstanceClient";
import { UnitInstanceClient } from "./UnitInstanceClient";
import { WorkbookClient } from "./WorkbookClient";



export class FlowSheetClient {
    workbook:WorkbookClient;
    instanceId?:UnitInstanceId;
    
    constructor(workbook:WorkbookClient,instanceId?:UnitInstanceId){
        this.workbook=workbook;
        this.instanceId=instanceId;
    }
    varFilePath():string{
        if (this.instanceId){
            return `/${this.instanceId}.sheet`
        } else {
            return "/";
        }
    }
    inputConnection(unitInst:UnitInstanceClient,inputId:string):"none" | "good" | "bad"{
        let sources = unitInst.inputSources
        for (let source of sources){
            if (source.id==inputId){
                if (source.srcRef){
                    let srcOutputId = source.srcRef.outputId;
                    let srcInstId= source.srcRef.srcInstId;
                    let sourceInst = this.workbook.getUnitInstance(srcInstId);
                    if (sourceInst){
                        if (unitInst.inputTypeCheck(inputId,<StepInstanceClient>sourceInst,srcOutputId))
                            return "good"
                        else
                            return "bad"
                    } else {
                        return "bad"
                    }
                } else {
                    return "none"
                }
            }
        }
        return "bad"
    }
    inputSource(unitInst:UnitInstanceClient,inputId:string):{instance?:UnitInstanceClient,outputId:string}{
        let source = unitInst.inputSource(inputId)
        return source;
    }
    outputConnection(unitInst:StepInstanceClient,outputId:string):"none" | "good" | "bad"{
        let workbook = this.workbook;
        let srcInstId = unitInst.instanceId;
        for (let inputUnitId in this.unitInstances){
            if (inputUnitId !=unitInst.instanceId){
                let inputInst = workbook.getUnitInstance(inputUnitId)
                for (let inputSource of inputInst.inputSources){
                    let srcRef = inputSource.srcRef;
                    if (srcRef){
                        if (srcInstId==srcRef.srcInstId){
                            return "good"
                        }
                    }
                }
            }
        }
        return "bad"
    }
    unitInstances:{[instanceId:UnitInstanceId]:boolean}={}
    addUnitInstance(row:number,col:number,unitTypeId:UnitTypeId):UnitInstanceId{
        let newId = this.workbook.newUnitInstanceId(unitTypeId);
        let inst=this.workbook.getUnitInstance(newId);
        let oldInst = this.rcInstance(row,col)
        if (oldInst){
            this.delUnitInstance(oldInst.instanceId)
        }
        inst.setCell(row,col);
        this.unitInstances[newId]=true;
        this.dirty();
        return newId;
    }
    rcInstance(row:number,col:number):UnitInstanceClient|undefined{
        for (let uId in this.unitInstances){
            let ui = this.workbook.getUnitInstance(uId);
            if (ui){
                let {row:iRow,col:iCol}=ui.getCell();
                if (iRow==row && iCol==col)
                    return ui;
            }
        }
        return undefined;
    }
    
    delUnitInstance(instanceId:string){
        let inst = this.unitInstances[instanceId];
        if (inst){
            delete this.unitInstances[instanceId]
            this.workbook.delUnitInstance(instanceId);
            this.dirty();
        }
    }
    nRows():number{
        let nr=0;
        for (let uId in this.unitInstances){
            let ui = this.workbook.getUnitInstance(uId);
            let {row} = ui.getCell()
            if (row>nr)
                nr=row;
        }
        return nr+2;
    }
    private columnWidths:number[]=[]
    private initColWidth = 200;
    private lastColWidth=50;
    getColWidths():number[]{
        if (this.columnWidths.length > this.nCols())
            this.columnWidths.length = this.nCols()
        else if (this.columnWidths.length<this.nCols()){
            let diff = this.nCols()-this.columnWidths.length;
            for (let i=0;i<diff;i++)
                this.columnWidths.push(this.initColWidth)
        }
        return this.columnWidths
    }
    setColWidths(newWidths:number[]){
        if (this.columnWidths.length>newWidths.length)
            this.columnWidths.length = newWidths.length;
        for (let i=0;i<newWidths.length;i++){
            this.columnWidths[i]=newWidths[i];
        }
        this.columnWidths[this.nCols()-1]=this.lastColWidth;
        this.workbook.dirty();
    }
    nCols():number{
        let nc=0;
        for (let uId in this.unitInstances){
            let ui = this.workbook.getUnitInstance(uId);
            let {col} = ui.getCell()
            if (col>nc)
                nc=col;
        }
        return nc+2;
    }
    addRow(rowAdd:number,nRowsToAdd=1){
        this.moveRegionInstances(0,rowAdd,this.nCols(),this.nRows()
            ,0,rowAdd+nRowsToAdd)
        this.dirty();
    }
    delRow(rowDel:number,nRowsToDel:number){
        let rowBeyond = rowDel+nRowsToDel;
        for (let unitInstId in this.unitInstances){
            let unitInst = this.workbook.getUnitInstance(unitInstId)
            let {row,col} = unitInst.getCell();
            if (row>=rowDel){
                if (row<rowBeyond){
                    this.delUnitInstance(unitInstId)
                } 
            }
        }
        this.moveRegionInstances(0,rowDel+nRowsToDel,this.nCols(),this.nRows()
            ,0,rowDel)
        this.dirty()
    }
    
    addCol(colAdd:number,nColsToAdd=1){
        this.moveRegionInstances(colAdd,0,this.nCols(),this.nRows()
            ,colAdd+nColsToAdd,0)
        this.dirty();
    }
    delCol(colDel:number,nColsToDel:number){
        let colBeyond = colDel+nColsToDel;
        for (let unitInstId in this.unitInstances){
            let unitInst = this.workbook.getUnitInstance(unitInstId)
            let {row,col} = unitInst.getCell();
            if (col>=colDel){
                if (col<colBeyond){
                    this.delUnitInstance(unitInstId)
                } 
            }
        }
        this.moveRegionInstances(colDel+nColsToDel,0,this.nCols(),this.nRows()
            ,colDel,0)
            
        this.dirty()
    }
    nextInstanceBelow(rowIdx:number,colIdx:number):string{
        let wb = this.workbook;
        let nextRow = 10000;
        let nextInst = ""
        for (let instId in this.unitInstances){
            let inst = wb.getUnitInstance(instId)
            let {row,col} = inst.getCell();
            if (col==colIdx && row>rowIdx && row<nextRow){
                nextRow=row;
                nextInst = instId;
            }
        }
        return nextInst;
    }
    nextInstanceToRight(rowIdx:number,colIdx:number):string{
        let wb = this.workbook;
        let nextCol = 10000;
        let nextInst = ""
        for (let instId in this.unitInstances){
            let inst = wb.getUnitInstance(instId)
            let {row,col} = inst.getCell();
            if (row==rowIdx && col>colIdx && col<nextCol){
                nextCol=col;
                nextInst = instId;
            }
        }
        return nextInst;
    }
    moveRegionInstances(leftCol:number,topRow:number,rightCol:number,botRow:number
        ,newLeft:number,newTop:number){
        let wb = this.workbook;
        let colDiff = newLeft-leftCol;
        let rowDiff = newTop-topRow;
        for (let instId in this.unitInstances){
            let inst = wb.getUnitInstance(instId);
            let {row,col} = inst.getCell();
            if (col>=leftCol && col<=rightCol && row>=topRow && row<=botRow){
                inst.setCell(row+rowDiff,col+colDiff);
            }
            //this.moveRegionInputs(inst,leftCol,topRow,rightCol,botRow,newLeft,newTop)
        }
    }
        /*private moveRegionInputs(inst:UnitInstanceClient,
            leftCol:number,topRow:number,rightCol:number,botRow:number
            ,newLeft:number,newTop:number){
            let colDiff = newLeft-leftCol;
            let rowDiff = newTop-topRow;
            let inputs = inst.inputSources;
            for (let input of inputs){
                if (input.Ref){
                    let d=input.dataRef;
                    if (d.col<leftCol || d.col>rightCol || d.row<topRow || d.row>botRow){
                        // reference outside leave references alone
                    } else {
                        // reference to inside that is moving. Adjust references
                        d.col+=colDiff;
                        d.row+=rowDiff;
                    }
                }
            }
        }*/
    private dirty(){
        this.workbook.dirty();
    }
    static fromJSON(json:FlowSheetJSON,workbook:WorkbookClient):FlowSheetClient{
        let ft = new FlowSheetClient(workbook);
        ft.unitInstances={};
        for (let ui of json.unitInstances){
            ft.unitInstances[ui]=true;
        }
        ft.columnWidths=json.colWidths;
        return ft;
    }
    toJSON():FlowSheetJSON{
        let rslt:FlowSheetJSON = {
            unitInstances:Object.keys(this.unitInstances),
            colWidths:this.columnWidths
        }
        return rslt;
    }
}