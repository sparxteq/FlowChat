import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { ButtonUI } from "../../../../../Zing3/zui/ButtonUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { StepInstanceClient } from "../../workbook/StepInstanceClient";
import { UnitCellView } from "./UnitCellView";
import { NameString } from "../../../common/NameString";
import { DB } from "../../../../../Zing3/share/DB";
import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { UnitInstanceClient } from "../../workbook/UnitInstanceClient";
import { Menu } from "../../menu/Menu";



export class StepCellView extends UnitCellView{

    buildView(): ZUI {
        let inst = <StepInstanceClient>this.unitInst
        if (inst.displayOpen){
            return this.showOpen()
        } else {
            return this.showClosed()
        }
    }
    protected outputConnection(outputId:string):"none" | "good" | "bad"{
        let connection = this.unitInst.flowSheet.outputConnection(<StepInstanceClient>this.unitInst,outputId)
        return connection;
    }
    protected outputSelected(outputId:string):boolean{
        let flow = this.unitInst.flowSheet;
        let {row,col}=this.unitInst.getCell();
        if (flow.selectedCell && flow.selectedCell.row==row && flow.selectedCell.col==col){
            if (flow.selectedOutput){
                if (flow.selectedOutput==outputId)
                    return true;
                else
                    return false
            }
            return true;
        }
        return false;
    }
    protected outputBar():ZUI{
        let inst = <StepInstanceClient>this.unitInst;
        let unit = inst.unitClient;
        let outputTypes = unit.outputTypes;
        let outputs:string[]=[];
        for (let ot of outputTypes){
            let name = NameString.toCapSpaced(ot.outputId);
            outputs.push(name)
        }
        let outputList:ZUI[]=[];
        for (let output of outputs){
            let outputBlock = this.outputBlock(output);
            outputList.push(outputBlock);
        }
        return new DivUI(outputList);
    }
    protected outputBlock(output:string):ZUI{
        if (!this.unitInst.displayOpen)
            return new DivUI([]).style("OutputBlockClosed")
        let div = new DivUI([
            new TextUI(NameString.toCapSpaced(output)).style("OutputBlockText")
        ]).style("OutputBlock")
        return div;
    }
    private showOpen():ZUI{
        let doList:ZUI[]=[];
            doList.push(this.actionBar(()=>{
                    DB.msg(`do ${this.unitInst.typeId()}`)
                }).style("StepCellActionBar"))
            let pe = this.paramEdit()
            if (pe)
                doList.push(pe.style("StepCellParam"))
            doList.push(this.log().style("StepLog"))
        let container=new DivUI([
            new DivUI(doList).style("StepCellOpen"),
            this.inputBar().style("StepInputBar"),
            this.outputBar().style("StepOutputBar")
        ]).style("StepOpenContainer")
        return container
    }
    
    private log():ZUI{
        return new DivUI([
            new TextUI("log")
        ])
    }
    private showClosed():ZUI{
        let container=new DivUI([
            this.actionBar().style("StepCellActionBar"),
            this.inputBar().style("StepInputBar"),
            this.outputBar().style("StepOutputBar")
        ]).style("StepCellClosed")
        return container
    }
}