import { DB } from "../../../Zing3/share/DB";
import { FlowChatContext } from "../common/FlowChatContext";
import { HTTPResult } from "../common/http/httpTypes";
import { WorkServer } from "./WorkServer";


export class ServerHTTP{
    constructor(){
    }
    async do(cmd:string,data:{[field:string]:any},req:any,res:any):Promise<HTTPResult>{
        let rslt:HTTPResult={success:false}
        switch(cmd){
            case "activityAdd":
                rslt = await WorkServer.activityAdd(data.email,data.actName,data.actFolderName)
                break;
            case "activityList":
                rslt = await WorkServer.activityList(data.email)
                break;
            case "activityRem":
                rslt = await WorkServer.activityRem(data.email,data.actName)
                break;
            case "login":
                rslt = await this.login(data.email)
                break;
            case "newUser":
                rslt = await this.newUser(data.email,data.firstName,data.lastName)
                break;
            case "projectList":
                rslt = await WorkServer.projectList(data.email,data.actName)
                break;
            case "projectAdd":
                rslt = await WorkServer.projectAdd(data.email,data.actName,data.projName)
                break;
            case "projectRem":
                rslt = await WorkServer.projectRem(data.email,data.actName,data.projName)
                break;
            case "steps":
                rslt = { success:true, msg:"",data:await WorkServer.steps()}
                break;
            case "workbookAdd":
                rslt = await WorkServer.workbookAdd(data.email,data.actName,data.projName,data.wbName)
                break;
            case "workbookList":
                rslt = await WorkServer.workbookList(data.email,data.actName,data.projName)
                break;
            case "workbookRem":
                rslt = await WorkServer.workbookRem(data.email,data.actName,data.projName,data.wbName)
                break;
            case "workbookGet":
                rslt = await WorkServer.workbookGet(data.email,data.actName,data.projName,data.wbName)
                break;
        }
        return rslt;
    }
    private async login(email:string):Promise<HTTPResult>{
        if (email=="olsen@sparxteq.com"){
            return {
                success:true,
                data:{
                    email:email,
                    firstName:"Dan",
                    lastName:"Olsen"
                }
            }
        } else {
            return {
                success:false,
                msg:`no such user "${email}"`
            }
        }
    }
    private async newUser(email:string,firstName:string,lastName:string):Promise<HTTPResult>{
        return {
            success:false,
            msg:"not implemented yet"
        }
    }
}