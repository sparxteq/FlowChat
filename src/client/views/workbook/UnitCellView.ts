import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { ImageButtonUI } from "../../../../../Zing3/zui/ImageButtonUI"
import { UnitInstanceClient } from "../../workbook/UnitInstanceClient";
import { SheetCellView } from "./SheetCellView";
import { NameString } from "../../../common/NameString"
import { FlowSheetClient } from "../../workbook/FlowSheetClient";
import { DB } from "../../../../../Zing3/share/DB";
import { ButtonUI } from "../../../../../Zing3/zui/ButtonUI";
import { DataSourceRef } from "../../../common/WorkbookJSON";




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
    
    protected stepInstanceName():string{
        return NameString.toCapSpaced(this.unitInst.typeId())
    }
    protected name():ZUI{
        let name= this.stepInstanceName()
        return new TextUI(`<b>${name}</b>`).style("UnitInstanceName")
    }
    protected actionButton(click:()=>void):ZUI{
        let btn = new ButtonUI(this.stepInstanceName()).click(()=>{
            click();
        }).style("StepDo")
        return btn;
    }
    abstract menu():ZUI
    protected menuButton():ZUI{
        let mb = new ImageButtonUI([{
            name:"menu",
            imageSource:"/icons/MenuButton.png"
        }],"menu").click(()=>{
            DB.msg("menu clicked")
        })
        mb.style("MenuButton")
        return mb;
    }
    protected noteButton():ZUI{
        let nb = new ImageButtonUI([{
                name:"add",
                imageSource:"/icons/AddNote.png"
            },{
                name:"edit",
                imageSource:"/icons/EditNote.png"
            }],"add")
            .click(()=>{
                DB.msg("menu clicked "+nb.state)
            })
        nb.style("NoteButton")
        return nb;
    }
    protected inputBar():ZUI{
        let inst = this.unitInst;
        let inputs = inst.inputSources;
        let inputList:ZUI[]=[];
        for (let input of inputs){
            let inputBlock = this.inputBlock(input);
            inputList.push(inputBlock);
        }
        return new DivUI(inputList);
    }
    protected inputBlock(input:{id: string,dataRef?: DataSourceRef}):ZUI{
        let div = new DivUI([
            new TextUI(NameString.toCapSpaced(input.id)).style("InputBlockText")
        ]).style("InputBlock")
        return div;
    }
    

    protected actionBar(click?:()=>void):ZUI{
        
        let list:ZUI[]=[]
        if (click){
            list = [
                    this.openCloseButton(),
                    this.actionButton(click),
                    this.menuButton(),
                    this.noteButton()
                ]
        } else {
            list = [
                    this.openCloseButton(),
                    this.name(),
                    this.menuButton(),
                    this.noteButton()
                ]
        }
        return new DivUI(list);
    }
    protected paramEdit():ZUI{
        return new DivUI([
            this.openCloseButton(),
            new TextUI("parameter edit")
        ])
    }
    protected openCloseButton():ZUI{
        let state = "closed";
        if (this.unitInst.displayOpen){
            state = "open"
        }
        let ocBtn = new ImageButtonUI([{
                name:"closed",
                imageSource:"/icons/RightArrow.png",

            },{
                name:"open",
                imageSource:"/icons/DownArrow.png"
            }],state)
            .click(()=>{
                let s = ocBtn.state;
                if (s=="open"){
                    this.unitInst.displayOpen=false;
                    ocBtn.state="closed"
                }else{
                    this.unitInst.displayOpen=true
                    ocBtn.state="open"
                }
                this.rebuild();
            })
        ocBtn.style("OpenCloseButton")
        return ocBtn
    }
}