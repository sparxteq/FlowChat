import { ButtonUI } from "../../../../Zing3/zui/ButtonUI";
import { DivUI } from "../../../../Zing3/zui/DivUI";
import { Modal } from "../../../../Zing3/zui/Modal";
import { OpenCloseUI } from "../../../../Zing3/zui/OpenCloseUI";
import { TextUI } from "../../../../Zing3/zui/TextUI";
import { TextFieldUI } from "../../../../Zing3/zui/TextFieldUI";
import { ZUI } from "../../../../Zing3/zui/ZUI";
import { DB } from "../../../../Zing3/share/DB";
import { ImpPageManager } from "../../../../Zing3/zui/ImpPageManager";
import { HTTPResult, UserInfo } from "../../common/http/httpTypes";
import { http } from "../http/ClientHTTP";


export class LoginView extends ZUI{
    private email:string="";
    private confirmEmail:string="";
    private firstName:string="";
    private lastName:string="";
    constructor(){
        super();
        let login = new DivUI([
            new TextUI("Login").style("Login-title"),
            new TextUI("email").style("col-6"),
            new TextFieldUI("email")
                .getF(()=>{ return this.email})
                .setF((userId:string)=>{this.email=userId})
                .placeHolder("email")
                .style("col-6"),
            new ButtonUI("Login").click(()=>{
                if (!this.email || this.email==""){
                    Modal.alert("missing email")
                    return;
                }
                http.login(this.email).then((rslt:boolean)=>{
                    if (rslt){
                        ImpPageManager.PUSHTO("work",{})
                    } else {
                        Modal.alert(`login "${this.email}" failed`)
                    }
                })
            }).style("col-12")
        ]).style("Login-block")
        let newUser = new DivUI([
            new TextUI("New User").style("Login-title"),
            new TextUI("email").style("col-6"),
            new TextFieldUI("email")
                .getF(()=>{ return this.email})
                .setF((email:string)=>{this.email=email})
                .placeHolder("email")
                .style("col-6"),
            new TextUI("confirm email").style("col-6"),
            new TextFieldUI("email")
                .getF(()=>{ return this.confirmEmail})
                .setF((email:string)=>{this.confirmEmail=email})
                .placeHolder("confirm email")
                .style("col-6"),
            
            new TextUI("first name").style("col-6"),
            new TextFieldUI()
                .getF(()=>{ return this.firstName})
                .setF((firstName:string)=>{this.firstName=firstName})
                .placeHolder("first name")
                .style("col-6"),
            new TextUI("last name").style("col-6"),
            new TextFieldUI()
                .getF(()=>{ return this.lastName})
                .setF((lastName:string)=>{this.lastName=lastName})
                .placeHolder("last name")
                .style("col-6"),
            new ButtonUI("New User").click(()=>{
                if (!this.email || this.email==""){
                    Modal.alert("missing email")
                    return;
                }
                if (this.email != this.confirmEmail){
                    Modal.alert("email addresses do not match")
                    return
                }
                if (!this.firstName || this.firstName==""){
                    Modal.alert("missing first name")
                    return;
                }
                
                if (!this.lastName || this.lastName==""){
                    Modal.alert("missing last name")
                    return;
                }
                http.newUser(this.email,this.firstName,this.lastName).then((rslt:HTTPResult)=>{
                    if (rslt.success){
                        Modal.alert(`created user ${rslt.data.email}`)
                    } else {
                        Modal.alert(rslt.msg!);
                    }
                })
            }).style("col-12")
        ]).style("col-12")
        let newOC = new OpenCloseUI(new TextUI("New User"),
            ()=>{return newUser}).style("Login-block")
        this.content = new DivUI([login,newOC]).style("col-12")
    }
}