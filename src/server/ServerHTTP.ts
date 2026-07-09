import { DB } from "../../../Zing3/share/DB";
import { FlowChatContext } from "../common/FlowChatContext";
import { HTTPResult } from "../common/http/httpTypes";


export class ServerHTTP{
    constructor(){
    }
    async do(cmd:string,data:{[field:string]:any},req:any,res:any):Promise<HTTPResult>{
        let rslt:HTTPResult={success:false}
        switch(cmd){
            case "login":
                rslt = await this.login(data.email)
                break;
            case "newUser":
                rslt = await this.newUser(data.email,data.firstName,data.lastName)
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