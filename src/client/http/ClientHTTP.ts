import { DB } from "../../../../Zing3/share/DB";
import { HTTPActList, HTTPActResult, HTTPProjList, HTTPProjResult, HTTPResult, HTTPSteps, HTTPTypes, HTTPWbGetResult, HTTPWbList, HTTPWbResult, UserInfo } from "../../common/http/httpTypes";
import { WorkbookJSON } from "../../common/workbookJSON";


export class ClientHTTP{
    curUser?:UserInfo;
    async activityList(email:string):Promise<HTTPActList>{
        let rslt = <HTTPActList>await this.do("activityList",{email:email})
        return rslt;
    }
    async activityAdd(email:string,actName:string,actFolderName:string):Promise<HTTPActResult>{
        let rslt = <HTTPActResult>await this.do("activityAdd",{email:email,actName,actFolderName})
        return rslt;
    }
    async activityRem(email:string,actName:string):Promise<HTTPActResult>{
        let rslt = <HTTPActResult>await this.do("activityRem",{email:email,actName:actName})
        return rslt;
    }
    async login(email:string):Promise<boolean>{
        let rslt = await this.do("login",{email:email})
        if (rslt.success){
            this.curUser={
                email:rslt.data.email,
                firstName:rslt.data.firstName,
                lastName:rslt.data.lastName
            }
            DB.msg("curUser",this.curUser)
            return true;
        } else {
            this.curUser=undefined;
            return false;
        }
    }
    async newUser(email:string,firstName:string,lastName:string):Promise<HTTPResult>{
        let rslt = await this.do("newUser",{email:email,
            firstName:firstName,
            lastName:lastName
        })
        return rslt;
    }
    async projectList(email:string,actName:string):Promise<HTTPProjList>{
        let rslt = <HTTPProjList>await this.do("projectList",{email:email,actName:actName})
        return rslt;
    }
    async projectAdd(email:string,actName:string,projName:string):Promise<HTTPProjResult>{
        let rslt = <HTTPProjResult>await this.do("projectAdd"
            ,{email:email,actName:actName,projName:projName})
        return rslt;
    }
    async projectRem(email:string,actName:string,projName:string):Promise<HTTPProjResult>{
        let rslt = <HTTPProjResult>await this.do("projectRem"
            ,{email:email,actName:actName,projName:projName})
        return rslt;
    }

    async steps():Promise<HTTPSteps>{
        let rslt = <HTTPSteps> await this.do("steps",{})
        return rslt;
    }
    async types():Promise<HTTPTypes>{
        let rslt = <HTTPTypes> await this.do("types",{})
        return rslt;
    }
    async workbookList(email:string,actName:string,projName:string):Promise<HTTPWbList>{
        let rslt = <HTTPWbList>await this.do("workbookList"
            ,{email:email,actName:actName,projName:projName})
        return rslt;
    }
    async workbookAdd(email:string,actName:string,projName:string,workbookName:string):Promise<HTTPWbResult>{
        let rslt = <HTTPWbResult>await this.do("workbookAdd"
            ,{email:email,actName:actName,projName:projName,wbName:workbookName})
        return rslt;
    }
    async workbookRem(email:string,actName:string,projName:string,workbookName:string):Promise<HTTPWbResult>{
        let rslt = <HTTPWbResult>await this.do("workbookRem"
            ,{email:email,actName:actName,projName:projName,wbName:workbookName})
        return rslt;
    }
    async workbookGet(email:string,actName:string,projName:string,workbookName:string):Promise<HTTPWbGetResult>{
        let rslt = <HTTPWbGetResult>await this.do("workbookGet"
            ,{email:email,actName:actName,projName:projName,wbName:workbookName})
        return rslt;
    }
    async workbookSave(json:WorkbookJSON,wbName:string,projId:string,actName:string,email:string):Promise<HTTPResult>{
        let rslt = <HTTPResult> await this.do("workbookSave",
            {email:email,actName:actName,projName:projId,wbName:wbName,json:json}
        )
        return rslt;
    }


    private async do(cmd:string,data:{[name:string]:any}):Promise<HTTPResult>{
        let url = `${this.urlRoot()}do?cmd=${cmd}`;  

        let jsonStr = JSON.stringify(data);
        let response = await fetch(url,{
            method:"PUT",
            headers:{"Content-Type":"application/json"},
            body:jsonStr
        })
        if (!response.ok){
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const rslt = <HTTPResult>await response.json();
        if (!rslt.success){
            DB.msg(`http ${cmd} failed`,data)
        }
        return rslt;
    }
    private urlRoot(){
        return window.location.origin + "/"
    }
}

export var http:ClientHTTP = new ClientHTTP();