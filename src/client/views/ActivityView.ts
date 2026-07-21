import { DivUI } from "../../../../Zing3/zui/DivUI";
import { TextUI } from "../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../Zing3/zui/ZUI";
import { DropDownChoiceUI } from "../../../../Zing3/zui/DropDownChoiceUI";
import { http } from "../http/ClientHTTP";
import { HTTPActList, HTTPActResult } from "../../common/http/httpTypes";
import { TextFieldUI } from "../../../../Zing3/zui/TextFieldUI";
import { ButtonUI } from "../../../../Zing3/zui/ButtonUI";
import { LoginView } from "./LoginView";
import { Modal } from "../../../../Zing3/zui/Modal";
import { LoadContext } from "./LoadContext";


export class ActivityView extends ZUI{
    static curActivity="-";
    private context:LoadContext;
    constructor(context:LoadContext){
        super();
        this.context=context;
        this.content=new TextUI("activity")
        this.load();
    }
    load(){
        http.activityList(http.curUser!.email).then((rslt:HTTPActList)=>{
            let list = <string[]>rslt.data.actList;
            let choice = new DropDownChoiceUI()
                .getF(()=>{ return ActivityView.curActivity})
                .setF((select:string)=>{
                    ActivityView.curActivity = select;
                    this.context.reloadViews();
                })
                .choice("-","select an activity")
            for (let ch of list){
                choice.choice(ch,ch)
            }
            choice.style("col-3")
            let newActivity=""
            let newActFolder="";
            let act = new DivUI([
                new TextUI("<b>Activity</b>").style("col-1"),
                choice,
                new ButtonUI("create activity").click(()=>{
                    if (newActivity==""){
                        Modal.alert("no activity id entered")
                        return;
                    }
                    if (newActFolder==""){
                        Modal.alert("no folder for activity data entered")
                        return;
                    }

                    http.activityAdd(LoginView.email,newActivity,newActFolder).then((rslt:HTTPActResult)=>{
                        if (rslt.success){
                            ActivityView.curActivity=rslt.data;
                            this.context.reloadViews();
                        } else {
                            Modal.alert(`could not create activity ${newActivity} at folder ${newActFolder}`)
                        }
                    })
                }).style("col-2"),
                new TextFieldUI("text")
                                .getF(()=>{ return newActivity})
                                .setF((act:string)=>{
                                    newActivity=act
                                })
                                .placeHolder("new activity id")
                                .style("col-2"),
                new TextFieldUI("text")
                                .getF(()=>{ return newActFolder})
                                .setF((act:string)=>{newActFolder=act})
                                .placeHolder("activity data folder")
                                .style("col-3"),
                new ButtonUI("Del").click(()=>{
                    if (ActivityView.curActivity=="-"){
                        Modal.alert("no currently selected activity to delete")
                        return;
                    }
                    Modal.confirm(`Are you sure you want to delete activity ${ActivityView.curActivity}`,(yes:boolean):void=>{
                        if (yes){
                            http.activityRem(LoginView.email,ActivityView.curActivity).then((rslt:HTTPActResult)=>{
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
            this.content=act;
            ZUI.notify();
        })
    }

    

}