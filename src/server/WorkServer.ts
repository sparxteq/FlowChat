
import { HTTPActList, HTTPActResult, HTTPProjList, HTTPProjResult, HTTPResult, HTTPWbGetResult, HTTPWbList, HTTPWbResult } from "../common/http/httpTypes";


export class WorkServer {
    static async activityList(email:string):Promise<HTTPActList>{
        return {
            success:false,
            msg:"activityAdd not done yet",
            data:{
                email:email,
                actList:[]
            }
        }
    }
    static async activityAdd(email:string,actName:string,actFolderName:string):Promise<HTTPActResult>{
        return {
            success:false,
            msg:"activityAdd not done yet",
            data:{
                email:email,
                actName:actName,
                actFolderName:actFolderName,
            }
        }
    }
    static async activityRem(email:string,actName:string):Promise<HTTPActResult>{
        return {
            success:false,
            msg:"activityRem not done yet",
            data:{
                email:email,
                actName:actName
            }
        }
    }
    static async projectList(email:string,actName:string):Promise<HTTPProjList>{
        return {
            success:false,
            msg:"projectList not done yet",
            data:{
                email:email,
                actName:actName,
                projList:[]
            }
        }
    }
    static async projectAdd(email:string,actName:string,projName:string):Promise<HTTPProjResult>{
        return {
            success:false,
            msg:"projectAdd not done yet",
            data:{
                email:email,
                actName:actName,
                projName:projName
            }
        }
    }
    static async projectRem(email:string,actName:string,projName:string):Promise<HTTPProjResult>{
        return {
            success:false,
            msg:"projectRem not done yet",
            data:{
                email:email,
                actName:actName,
                projName:projName
            }
        }
    }
    static async workbookList(email:string,actName:string,projName:string):Promise<HTTPWbList>{
        return {
            success:false,
            msg:"workbookList not done yet",
            data:{
                email:email,
                actName:actName,
                projName:projName,
                wbList:[]
            }
        }
    }
    static async workbookAdd(email:string,actName:string,projName:string,workbookName:string):Promise<HTTPWbResult>{
        return {
            success:false,
            msg:"workbookAdd not done yet",
            data:{
                email:email,
                actName:actName,
                projName:projName,
                wbName:workbookName
            }
        }
    }
    static async workbookRem(email:string,actName:string,projName:string,workbookName:string):Promise<HTTPWbResult>{
        return {
            success:false,
            msg:"workbookRem not done yet",
            data:{
                email:email,
                actName:actName,
                projName:projName,
                wbName:workbookName
            }
        }
    }
    static async workbookGet(email:string,actName:string,projName:string,workbookName:string):Promise<HTTPWbGetResult>{
        return {
            success:false,
            msg:"workbookGet not done yet",
            data:{
                email:email,
                actName:actName,
                projName:projName,
                wbName:workbookName,
                wbJSON:{}
            }
        }
    }
}