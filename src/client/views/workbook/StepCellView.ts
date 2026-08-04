import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { ButtonUI } from "../../../../../Zing3/zui/ButtonUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { StepInstanceClient } from "../../workbook/StepInstanceClient";
import { UnitCellView } from "./UnitCellView";
import { NameString } from "../../../common/NameString";
import { DB } from "../../../../../Zing3/share/DB";
import { TextUI } from "../../../../../Zing3/zui/TextUI";



export class StepCellView extends UnitCellView{

    buildView(): ZUI {
        let inst = <StepInstanceClient>this.unitInst
        if (inst.displayOpen){
            return this.showOpen()
        } else {
            return this.showClosed()
        }
    }
    menu():ZUI {
        throw new Error("Method not implemented.");
    }
    protected outputBar():ZUI{
        let inst = this.unitInst;
        let outputs = inst.outputs;
        let outputList:ZUI[]=[];
        for (let output of outputs){
            let outputBlock = this.outputBlock(output);
            outputList.push(outputBlock);
        }
        return new DivUI(outputList);
    }
    protected outputBlock(output:string):ZUI{
        let div = new DivUI([
            new TextUI(NameString.toCapSpaced(output)).style("OutputBlockText")
        ]).style("OutputBlock")
        return div;
    }
    private showOpen():ZUI{
        let container=new DivUI([
            new DivUI([
                this.actionBar(()=>{
                    DB.msg(`do ${this.unitInst.typeId()}`)
                }).style("StepCellActionBar"),
                this.paramEdit().style("StepCellParam"),
                this.log().style("StepLog")
            ]).style("StepCellOpen"),
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
            this.actionBar().style("StepCellActionBar")
        ]).style("StepCellClosed")
        return container
    }
}