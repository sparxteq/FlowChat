import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { UnitInstanceClient } from "../../workbook/UnitInstanceClient";
import { SheetCellView } from "./SheetCellView";
import { NameString } from "../../../common/NameString"
import { FlowSheetClient } from "../../workbook/FlowSheetClient";




export abstract class UnitCellView extends SheetCellView{
    unitInst:UnitInstanceClient;
    constructor(unitInst:UnitInstanceClient){
        super()
        this.unitInst=unitInst;
        let {row, col}=unitInst.getCell();
        this.str = `Unit ${unitInst.instanceId}:${unitInst.typeId()} [${row},${col}]`
        this.content = this.buildView();
    }
    protected str:string=""
    rebuild(){
        this.content=this.buildView();
        ZUI.notify();
    }
    abstract buildView():ZUI
    
    protected closedButton():ZUI{
        return new TextUI("right")
    }
    protected name():ZUI{
        let name=NameString.toCapSpaced(this.unitInst.typeId())
        return new TextUI(name).style("UnitInstanceName")
    }
    abstract menu():ZUI
    protected inputBar():ZUI{
        return new TextUI("?inputBar")
    }
    protected openButton():ZUI{
        return new TextUI("O")
    }
    protected paramEdit():ZUI{
        return new TextUI("param edit")
    }
}