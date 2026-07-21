import { DivUI } from "../../../../Zing3/zui/DivUI";
import { TextUI } from "../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../Zing3/zui/ZUI";
import { BreakUI } from "../../../../Zing3/zui/BreakUI";
import { DropDownChoiceUI } from "../../../../Zing3/zui/DropDownChoiceUI";
import { http } from "../http/ClientHTTP";
import { HTTPActResult, HTTPProjList, HTTPProjResult, HTTPWbList } from "../../common/http/httpTypes";
import { TextFieldUI } from "../../../../Zing3/zui/TextFieldUI";
import { ButtonUI } from "../../../../Zing3/zui/ButtonUI";
import { LoginView } from "./LoginView";
import { Modal } from "../../../../Zing3/zui/Modal";
import { ActivityView } from "./ActivityView";
import { LoadContext } from "./LoadContext";
import { ProjectView } from "./ProjectView";


export class WorkbookView extends ZUI{
    static curWorkbook="-";
    private context:LoadContext;
    constructor(context:LoadContext){
        super();
        this.context=context;
        this.content=new BreakUI()
        this.load();
    }
    load(){
        if (ActivityView.curActivity=="-")
            return;
        if (ProjectView.curProj=="-")
            return;
        http.workbookList(http.curUser!.email,ActivityView.curActivity,ProjectView.curProj).then((rslt:HTTPWbList)=>{
            let list = <string[]>rslt.data.wbList;
            let choice = new DropDownChoiceUI()
                .getF(()=>{ return WorkbookView.curWorkbook})
                .setF((select:string)=>{
                    WorkbookView.curWorkbook = select;
                    this.context.reloadViews();
                })
                .choice("-","select a workbook")
            for (let ch of list){
                choice.choice(ch,ch)
            }
            choice.style("col-3")
            let newWorkbook=""
            let proj = new DivUI([
                new TextUI("<b>Workbook</b>").style("col-1"),
                choice,
                new ButtonUI("create workbook").click(()=>{
                    if (newWorkbook==""){
                        Modal.alert("no workbook id entered")
                        return;
                    }

                    http.workbookAdd(LoginView.email,ActivityView.curActivity,ProjectView.curProj,newWorkbook).then((rslt:HTTPProjResult)=>{
                        if (rslt.success){
                            WorkbookView.curWorkbook=rslt.data;
                            this.context.reloadViews();
                        } else {
                            Modal.alert(`could not create workbook ${newWorkbook}`)
                        }
                    })
                }).style("col-2"),
                new TextFieldUI("text")
                                .getF(()=>{ return newWorkbook})
                                .setF((proj:string)=>{
                                    newWorkbook=proj
                                })
                                .placeHolder("new workbook id")
                                .style("col-2"),
                new ButtonUI("Del").click(()=>{
                    if (WorkbookView.curWorkbook=="-"){
                        Modal.alert("no currently selected workbook to delete")
                        return;
                    }
                    Modal.confirm(`Are you sure you want to delete workbook ${WorkbookView.curWorkbook}`,(yes:boolean):void=>{
                        if (yes){
                            http.workbookRem(LoginView.email,ActivityView.curActivity
                                        ,ProjectView.curProj,WorkbookView.curWorkbook).then((rslt:HTTPActResult)=>{
                                if (!rslt.success){
                                    Modal.alert(rslt.msg!)
                                    return
                                }
                                this.context.reloadViews();
                            })
                        }
                    })
                })
            ]).style("ManagementLine")
            this.content=proj;
            ZUI.notify();
        })
    }

}