
import { HTTPActList, HTTPActResult, HTTPProjList, HTTPProjResult, HTTPResult, HTTPSteps, HTTPWbGetResult, HTTPWbList, HTTPWbResult } from "../common/http/httpTypes";
import { http } from "./http/ClientHTTP";


export class WorkClient {
    curEmail?:string;
    curAct?:string;
    curProj?:string;
    curWb?:string;

    async activityList(email?:string):Promise<HTTPActList>{
        if (!email) email = this.curEmail;
        this.curEmail = email
        let rslt=await http.activityList(email!)
        return rslt;
    }
    async activityAdd(actName:string,actFolderName:string,email?:string):Promise<HTTPActResult>{
        if (!email) email = this.curEmail;
        this.curEmail = email
        this.curAct = actName;
        let rslt=await http.activityAdd(email!,actName,actFolderName)
        return rslt;
    }
    async activityRem(actName:string,email?:string):Promise<HTTPActResult>{
        if (!email) email = this.curEmail!;
        this.curEmail = email
        this.curAct = actName;
        let rslt=await http.activityRem(email,actName)
        return rslt;
    }
    async steps():Promise<HTTPSteps>{
        let rslt=(await http.steps())
        return rslt;
    }
    async projectList(actName:string,email?:string):Promise<HTTPProjList>{
        if (!email) email = this.curEmail;
        this.curEmail = email
        this.curAct = actName;
        let rslt=await http.projectList(email!,actName!)
        return rslt;
    }
    async projectAdd(projName:string,actName?:string,email?:string):Promise<HTTPProjResult>{
        if (!email) email = this.curEmail;
        this.curEmail = email
        if (!actName) actName=this.curAct;
        this.curAct = actName;
        this.curProj = projName;
        let rslt=await http.projectAdd(email!,actName!,projName)
        return rslt;
    }
    async projectRem(projName:string,actName?:string,email?:string):Promise<HTTPProjResult>{
        if (!email) email = this.curEmail;
        this.curEmail = email
        if (!actName) actName=this.curAct;
        this.curAct = actName;
        this.curProj = projName;
        let rslt=await http.projectRem(email!,actName!,projName)
        return rslt;
    }
    async workbookList(projName:string,actName?:string,email?:string):Promise<HTTPWbList>{
        if (!email) email = this.curEmail;
        this.curEmail = email
        if (!actName) actName=this.curAct;
        this.curAct = actName;
        this.curProj = projName;
        let rslt=await http.workbookList(email!,actName!,projName!)
        return rslt;
    }
    async workbookAdd(workbookName:string,projName?:string,actName?:string,email?:string):Promise<HTTPWbResult>{
        if (!email) email = this.curEmail;
        this.curEmail = email
        if (!actName) actName=this.curAct;
        this.curAct = actName;
        if (!projName) projName=this.curProj;
        this.curProj = projName;
        this.curWb = workbookName;
        let rslt=await http.workbookAdd(email!,actName!,projName!,workbookName)
        return rslt;
    }
    async workbookRem(workbookName:string,projName?:string,actName?:string,email?:string):Promise<HTTPWbResult>{
        if (!email) email = this.curEmail;
        this.curEmail = email
        if (!actName) actName=this.curAct;
        this.curAct = actName;
        if (!projName) projName=this.curProj;
        this.curProj = projName;
        this.curWb = workbookName;
        let rslt=await http.workbookRem(email!,actName!,projName!,workbookName)
        return rslt;
    }
    async workbookGet(workbookName:string,projName?:string,actName?:string,email?:string):Promise<HTTPWbGetResult>{
        if (!email) email = this.curEmail;
        this.curEmail = email
        if (!actName) actName=this.curAct;
        this.curAct = actName;
        if (!projName) projName=this.curProj;
        this.curProj = projName;
        this.curWb = workbookName;
        let rslt = await http.workbookGet(email!,actName!,projName!,workbookName)
        return rslt;
    }
}