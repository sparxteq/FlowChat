import { FlowTableJSON, UnitInstanceId, UnitTypeId } from "../../common/WorkbookJSON";
import { UnitInstanceClient } from "./UnitInstanceClient";
import { WorkbookClient } from "./WorkbookClient";



export class FlowTableClient {
    workbook:WorkbookClient;
    constructor(workbook:WorkbookClient){
        this.workbook=workbook;
    }
    unitInstances:{[instanceId:UnitInstanceId]:boolean}={}
    addUnitInstance(row:number,col:number,unitTypeId:UnitTypeId):UnitInstanceId{
        let newId = this.workbook.newUnitInstanceId(unitTypeId);
        let inst=this.workbook.getUnitInstance(newId);
        inst.resolveUnit()
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
        return nr+1;
    }
    nCols():number{
        let nc=0;
        for (let uId in this.unitInstances){
            let ui = this.workbook.getUnitInstance(uId);
            let {col} = ui.getCell()
            if (col>nc)
                nc=col;
        }
        return nc+1;
    }
    addRow(rowAdd:number,nRowsToAdd=1){
        for (let unitInstId in this.unitInstances){
            let unitInst = this.workbook.getUnitInstance(unitInstId)
            let {row,col} = unitInst.getCell();
            if (row>=rowAdd){
                unitInst.setCell(row+nRowsToAdd,col)
            }
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
        }
        this.dirty()
    }
    private dirty(){
        this.workbook.dirty();
    }
    static fromJSON(json:FlowTableJSON,workbook:WorkbookClient):FlowTableClient{
        let ft = new FlowTableClient(workbook);
        ft.unitInstances={};
        for (let ui of json.unitInstances){
            ft.unitInstances[ui]=true;
        }
        return ft;
    }
    toJSON():FlowTableJSON{
        let rslt:FlowTableJSON = {
            unitInstances:Object.keys(this.unitInstances)
        }
        return rslt;
    }
}