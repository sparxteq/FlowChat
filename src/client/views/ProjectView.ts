import { DivUI } from "../../../../Zing3/zui/DivUI";
import { TextUI } from "../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../Zing3/zui/ZUI";
import { BreakUI } from "../../../../Zing3/zui/BreakUI";
import { DropDownChoiceUI } from "../../../../Zing3/zui/DropDownChoiceUI";
import { http } from "../http/ClientHTTP";
import { HTTPActResult, HTTPProjList, HTTPProjResult } from "../../common/http/httpTypes";
import { TextFieldUI } from "../../../../Zing3/zui/TextFieldUI";
import { ButtonUI } from "../../../../Zing3/zui/ButtonUI";
import { LoginView } from "./LoginView";
import { Modal } from "../../../../Zing3/zui/Modal";
import { ActivityView } from "./ActivityView";
import { LoadContext } from "./LoadContext";


export class ProjectView extends ZUI{
    static curProj="-";
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
        http.projectList(http.curUser!.email,ActivityView.curActivity).then((rslt:HTTPProjList)=>{
            let list = <string[]>rslt.data.projList;
            let choice = new DropDownChoiceUI()
                .getF(()=>{ return ProjectView.curProj})
                .setF((select:string)=>{
                    ProjectView.curProj = select;
                    this.context.reloadViews();
                })
                .choice("-","select a project")
            for (let ch of list){
                choice.choice(ch,ch)
            }
            choice.style("col-3")
            let newProject=""
            let proj = new DivUI([
                new TextUI("<b>Project</b>").style("col-1"),
                choice,
                new ButtonUI("create project").click(()=>{
                    if (newProject==""){
                        Modal.alert("no project id entered")
                        return;
                    }

                    http.projectAdd(LoginView.email,ActivityView.curActivity,newProject).then((rslt:HTTPProjResult)=>{
                        if (rslt.success){
                            ProjectView.curProj=rslt.data;
                            this.context.reloadViews();
                        } else {
                            Modal.alert(`could not create project ${newProject}`)
                        }
                    })
                }).style("col-2"),
                new TextFieldUI("text")
                                .getF(()=>{ return newProject})
                                .setF((proj:string)=>{
                                    newProject=proj
                                })
                                .placeHolder("new project id")
                                .style("col-2"),
                new ButtonUI("Del").click(()=>{
                    if (ProjectView.curProj=="-"){
                        Modal.alert("no currently selected project to delete")
                        return;
                    }
                    Modal.confirm(`Are you sure you want to delete project ${ProjectView.curProj}`,(yes:boolean):void=>{
                        if (yes){
                            http.projectRem(LoginView.email,ActivityView.curActivity,ProjectView.curProj).then((rslt:HTTPActResult)=>{
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