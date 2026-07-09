import { DB } from "../../../../Zing3/share/DB";
import { HTTPResult, UserInfo } from "../../common/http/httpTypes";


export class ClientHTTP{
    curUser?:UserInfo;
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