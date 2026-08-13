import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { TextAreaUI } from "../../../../../Zing3/zui/TextAreaUI";
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
import { ZT } from "../../../common/ZT";
import { ZTValueEdit } from "../ZTValueEdit";
import { showPopup } from "../../popupZUI";
import { Menu, MenuItem } from "../../menu/Menu";




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
    
    protected inputConnection(inputId:string):"none" | "good" | "bad"{
        let connection = this.unitInst.flowSheet.inputConnection(this.unitInst,inputId)
        return connection;
    }
    protected inputSelected(inputId:string):boolean{
        let flow = this.unitInst.flowSheet;
        let {row,col}= this.unitInst.getCell();
        if (flow.selectedCell && flow.selectedCell.row==row && flow.selectedCell.col==col){
            if (flow.selectedInput){
                if (flow.selectedInput==inputId)
                    return true;
                else
                    return false;
            }
            return true;
        }
        return false;
    }
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
    private _menu:Menu | undefined;
    menu():Menu{
        if (this._menu)
            return this._menu;
        let menu = new Menu("unit menu","description");
        menu.addItem("Create_view",[],(parameters:any[])=>{
            DB.msg("Create_view ",this.unitInst.instanceId)
        },"create a view")
        menu.addItem("Connect_input",[],(parameters:any[])=>{
            DB.msg("Connect_input ",this.unitInst.instanceId)
        },"connect an input")
        let createMenu = new Menu("create","create desc");
            createMenu.addItem("Dog",[],(parameters:any[])=>{
                DB.msg("create a dog")
            },"will create a new dog")
            createMenu.addItem("Cat",[],(parameters:any[])=>{
                DB.msg("create a cat")
            },"will create a new cat")
        menu.addItem("Create",[],createMenu,"creates animals")
        this._menu=menu;
        return menu;
    }
    protected menuButton():ZUI{
        let mb = new ImageButtonUI([{
            name:"menu",
            imageSource:"/icons/MenuButton.png"
        }],"menu").click(()=>{
            //DB.msg("menu clicked")
            let menu = this.menu();
            let menuZUI = menu.menuZUI((menuItem:MenuItem)=>{
                
            })
            showPopup(menuZUI,mb.jq[0].id,()=>{
                //DB.msg("menu closed")
            })
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
                //DB.msg("note clicked "+this.unitInst.instanceId)
                //DB.msg("   note ",this.unitInst.note)
                this.editNote(nb.jq[0].id,()=>{
                    let note = this.unitInst.note;
                    if (note.length==0)
                        nb.state="add"
                    else
                        nb.state="edit"
                    //DB.msg("check icon")
                })
            })
        let note = this.unitInst.note;
        if (note.length==0)
            nb.state="add"
        else
            nb.state="edit"
        nb.style("NoteButton")
        return nb;
    }
        protected editNote(id:string,checkIcon:()=>void){
            DB.msg("edit note for "+id) 
            let inst = this.unitInst;
            let saveNote = inst.note;
            let noteEdit = new TextAreaUI()
                .getF(()=>{
                    return inst.note;
                })
                .setF((str:string)=>{
                    inst.note=str;
                })
                .placeHolder("enter a note here")
                .style("NoteEdit")
            let content = new DivUI([noteEdit]).style("NoteEditContainer")
            showPopup(content,id,()=>{
                DB.msg("saveNote",saveNote)
                inst.note = noteEdit.val();
                DB.msg("inst.note",inst.note)
                if (saveNote!=inst.note){
                    checkIcon();
                    inst.workbook.dirty();
                }
            })
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
        if (!this.unitInst.displayOpen)
            return new DivUI([]).style("InputBlockClosed")
        let div = new DivUI([
            new TextUI(NameString.toCapSpaced(input.id)).style("InputBlockText")
        ])
        let style = ""
        switch (this.inputConnection(input.id)){
            case "none":
                style+="InputBlockNone"
                break;
            case "good":
                style+="InputBlockGood"
                break;
            case "bad":
                style+="InputBlockBad"
        }
        if (this.inputSelected(input.id))
            style+=" InputBlockSelected"
        div.style(style)
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
    protected paramEdit():ZUI|undefined{
        let pType:ZT = this.unitInst.paramType();
        if (pType.empty())
            return undefined;
        let pValue = this.unitInst.paramValue
        let wb = this.unitInst.workbook;
        let projectId = wb.project;
        let activityId = wb.activity;
        let email = wb.userEmail;
        return new ZTValueEdit(pType,pValue,(pData:any)=>{
                this.unitInst.paramValue = pData;
                wb.dirty();
            },projectId,activityId,email)
        
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
                this.unitInst.workbook.dirty()
                this.rebuild();
            })
        ocBtn.style("OpenCloseButton")
        return ocBtn
    }
}