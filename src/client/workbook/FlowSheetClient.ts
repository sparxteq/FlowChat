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
                if (source.dataRef){
                    let {refRow,refCol}=this.resolveRef(source.dataRef,unitInst)
                    let sourceInst = this.rcInstance(refRow,refCol);
                    if (sourceInst){
                        if (unitInst.inputTypeCheck(inputId,<StepInstanceClient>sourceInst))
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
    outputConnection(unitInst:StepInstanceClient,outputId:string):"none" | "good" | "bad"{
        let {row,col} = unitInst.getCell();
        let workbook = this.workbook;
        for (let inputUnitId in this.unitInstances){
            if (inputUnitId !=unitInst.instanceId){
                let inputInst = workbook.getUnitInstance(inputUnitId)
                for (let inputSource of inputInst.inputSources){
                    let dataRef = inputSource.dataRef;
                    if (dataRef){
                        let {refRow,refCol} = this.resolveRef(dataRef,inputInst)
                        if (row==refRow && col==refCol){
                            return "good"
                        }
                    }
                }
            }
        }
        return "bad"
    }
    private resolveRef(dataRef:DataSourceRef,unitInst:UnitInstanceClient):{refRow:number,refCol:number}{
        let {row,col}=unitInst.getCell();
        let refRow = dataRef.row;
        if (!dataRef.rowAbsolute)
            refRow+=row
        let refCol = dataRef.col;
        if (!dataRef.colAbsolute)
            refCol+=col;
        return {refRow,refCol}
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
            let {row:iRow,col:iCol}=ui.getCell();
            if (iRow==row && iCol==col)
                return ui;
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
        for (let unitInstId in this.unitInstances){
            let unitInst = this.workbook.getUnitInstance(unitInstId)
            let {row,col} = unitInst.getCell();
            if (row>=rowAdd){
                unitInst.setCell(row+nRowsToAdd,col)
            }
            unitInst.moveInputRows(rowAdd,nRowsToAdd)
        }
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
                } else {
                    unitInst.setCell(row-nRowsToDel,col)
                }
            }
            unitInst.moveInputRows(rowDel,-nRowsToDel)
        }
        this.dirty()
    }
    
    addCol(colAdd:number,nColsToAdd=1){
        for (let unitInstId in this.unitInstances){
            let unitInst = this.workbook.getUnitInstance(unitInstId)
            let {row,col} = unitInst.getCell();
            if (col>=colAdd){
                unitInst.setCell(row,col+nColsToAdd)
            }
            unitInst.moveInputCols(colAdd,nColsToAdd)
        }
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
                } else {
                    unitInst.setCell(row,col-nColsToDel)
                }
            }
            unitInst.moveInputCols(colDel,-nColsToDel)
        }
        this.dirty()
    }
    private dirty(){
        this.workbook.dirty();
    }
    static fromJSON(json:FlowSheetJSON,workbook:WorkbookClient):FlowSheetClient{
        let ft = new FlowSheetClient(workbook);
        ft.unitInstances={};
        for (let ui of json.unitInstances){
            ft.unitInstances[ui]=true;
        }
        return ft;
    }
    toJSON():FlowSheetJSON{
        let rslt:FlowSheetJSON = {
            unitInstances:Object.keys(this.unitInstances)
        }
        return rslt;
    }
}