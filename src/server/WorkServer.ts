
import { HTTPActList, HTTPActResult, HTTPProjList, HTTPProjResult, HTTPResult, HTTPWbGetResult, HTTPWbList, HTTPWbResult } from "../common/http/httpTypes";
import { StepJSON, TypeJSON, WorkbookJSON } from "../common/workbookJSON";
import { FilesFS, FilesFSSource } from "./files/FilesFS";
import { Step } from "./steps/Step";
import { TypeS } from "./steps/TypeS";


export class WorkServer {
    private static usersFolder():string{
        return "";
    }
    private static userFolder(email:string):string{
        return this.usersFolder+"/"+email;
    }
    static async addUser(userEmail: string, firstName: string, lastName: string): Promise<{ success: boolean; }> {
        throw new Error("Method not implemented.");
    }
    static async loginUser(userEmail: string): Promise<{ success: boolean; userEmail: string; firstName: string; lastName: string; }> {
        throw new Error("Method not implemented.");
    }
    static async activityList(email:string):Promise<HTTPActList>{
        let userFolder = new FilesFS(this.userFolder(email))
        let rslt:HTTPActList= {
            success:false,
            msg:"",
            data:{
                email:email,
                actList:[]
            }
        }
        if (userFolder && await userFolder.isFolder()){
            let actList = await userFolder.folderNames()
            rslt={
                success:true,
                msg:"",
                data:{
                    email:email,
                    actList:actList
                }
            }
        }
        return rslt;
    }
    private static activityFolder(email:string,actName:string):string{
        let userFolder = this.userFolder(email);
        return userFolder+"/"+actName;
    }
    private static activityFolderNamePath(email:string,actName:string):string{
        let activityFolderName = this.activityFolder(email,actName)
        return activityFolderName + "/.activityFolderName.txt";
    }
    static async activityAdd(email:string,actName:string,actFolderName:string):Promise<HTTPActResult>{
        let rslt:HTTPActResult={
            success:true,
            msg:"",
            data:{
                email:email,
                actName:actName,
            }
        }
        let actFolderN = this.activityFolder(email,actName)
        let fs = new FilesFSSource();
        let actF = await fs.getFolder(actFolderN,true)
        if (!actF){
            rslt = {success:false,msg:`failed to create ${actFolderN}`
                ,data:{
                    email:email,
                    actName:actName,
                }
            }
            return rslt;
        }
        let actFN = await fs.getFile(this.activityFolderNamePath(email,actName))
        await actFN.openW(false);
        actFN.writelnSync(actFolderName)
        await actFN.close();
        return rslt;
    }
    static async activityRem(email:string,actName:string):Promise<HTTPActResult>{
        let rslt:HTTPActResult = {
            success:true,
            msg:"",
            data:{
                email:email,
                actName:actName
            }
        }
        let actFolderN = this.activityFolder(email,actName)
        let fs = new FilesFSSource();
        let actF = await fs.getFolder(actFolderN,false)
        if (!actF){
            rslt = {success:true,msg:`no such activity`
                ,data:{
                    email:email,
                    actName:actName,
                }
            }
            return rslt;
        }
        let s = await actF.delete(true);
        if (s)
            rslt.msg=s;
        return rslt;
    }
    private static projFolderName(email:string,actName:string,projName:string):string{
        let aF = this.activityFolder(email,actName);
        return aF+"/"+projName;
    }
    static async projectList(email:string,actName:string):Promise<HTTPProjList>{
        let actFolder = new FilesFS(this.activityFolder(email,actName))
        let rslt:HTTPProjList= {
            success:false,
            msg:"",
            data:{
                email:email,
                actName:actName,
                projList:[]
            }
        }
        if (actFolder && await actFolder.isFolder()){
            let projList = await actFolder.folderNames()
            rslt.success=true;
            rslt.data.projList=projList;
        }
        return rslt;
    }
    static async projectAdd(email:string,actName:string,projName:string):Promise<HTTPProjResult>{
        let rslt:HTTPProjResult={
            success:true,
            msg:"",
            data:{
                email:email,
                actName:actName,
                projName:projName
            }
        }
        let projFolderN = this.projFolderName(email,actName,projName)
        let fs = new FilesFSSource();
        let projF = await fs.getFolder(projFolderN,false)
        if (projF && await projF.isFolder()){
            rslt.success=false;
            rslt.msg=`${projFolderN} already exists`
            return rslt;
        } else {
            projF = await fs.getFolder(projFolderN,true)
            if (!projF){
                rslt.success=false;
                rslt.msg=`failed to create ${projFolderN}`
            }
        }
        return rslt;
    }
    static async projectRem(email:string,actName:string,projName:string):Promise<HTTPProjResult>{
        let rslt:HTTPProjResult={
            success:true,
            msg:"",
            data:{
                email:email,
                actName:actName,
                projName:projName
            }
        }
        let projFolderN = this.projFolderName(email,actName,projName)
        let fs = new FilesFSSource();
        let projF = await fs.getFolder(projFolderN,false)
        if (projF && await projF.isFolder()){
            let r = await projF.delete(true)
            if (r){
                rslt.success=false;
                rslt.msg=`failed to delete ${projFolderN}`
            }
            return rslt;
        } else {
            rslt.msg=`no such folder ${projFolderN}`
        }
        return rslt;
    }
    static steps():{[stepId:string]:StepJSON}{
        let up = Step.uploadJSON();
        return up;
    }
    static types():TypeJSON[]{
        let up = TypeS.uploadJSON();
        return up
    }
    private static wbFolderName(email:string,actName:string,projName:string,wbName:string):string{
        let pF = this.projFolderName(email,actName,projName);
        return pF+"/"+wbName;
    }
    static async workbookList(email:string,actName:string,projName:string):Promise<HTTPWbList>{
        let projFolder = new FilesFS(this.projFolderName(email,actName,projName))
        let rslt:HTTPWbList= {
            success:false,
            msg:"",
            data:{
                email:email,
                actName:actName,
                projName:projName,
                wbList:[]
            }
        }
        if (projFolder && await projFolder.isFolder()){
            let wbList = await projFolder.folderNames()
            rslt.success=true;
            rslt.data.wbList=wbList;
        }
        return rslt;
    }
    static async workbookAdd(email:string,actName:string,projName:string,workbookName:string):Promise<HTTPWbResult>{
        let rslt:HTTPWbResult={
            success:true,
            msg:"",
            data:{
                email:email,
                actName:actName,
                projName:projName,
                wbName:workbookName
            }
        }
        let wbFolderN = this.wbFolderName(email,actName,projName,workbookName)
        let fs = new FilesFSSource();
        let wbF = await fs.getFolder(wbFolderN,false)
        if (wbF && await wbF.isFolder()){
            rslt.success=false;
            rslt.msg=`${wbFolderN} already exists`
            return rslt;
        } else {
            wbF = await fs.getFolder(wbFolderN,true)
            if (!wbF){
                rslt.success=false;
                rslt.msg=`failed to create ${wbFolderN}`
            }
        }
        return rslt;
    }
    static async workbookRem(email:string,actName:string,projName:string,workbookName:string):Promise<HTTPWbResult>{
        let rslt:HTTPWbResult={
            success:true,
            msg:"",
            data:{
                email:email,
                actName:actName,
                projName:projName,
                wbName:workbookName
            }
        }
        let wbFolderN = this.wbFolderName(email,actName,projName,workbookName)
        let fs = new FilesFSSource();
        let wbF = await fs.getFolder(wbFolderN,false)
        if (wbF && await wbF.isFolder()){
            let r = await wbF.delete(true)
            if (r){
                rslt.success=false;
                rslt.msg=`failed to delete ${wbFolderN}`
            }
            return rslt;
        } else {
            rslt.msg=`no such folder ${wbFolderN}`
        }
        return rslt;
    }
    private static workbookDataFile(email:string,actName:string,projName:string,workbookName:string):string{
        let wbF = this.wbFolderName(email,actName,projName,workbookName)
        return wbF+"/.wbData"
    }
    static async workbookGet(email:string,actName:string,projName:string,workbookName:string):Promise<HTTPWbGetResult>{
        let rslt:HTTPWbGetResult={
            success:true,
            msg:"",
            data:{
                email:email,
                actName:actName,
                projName:projName,
                wbName:workbookName,
                wbJSON:{}
            }
        }
        let wbFileN = this.workbookDataFile(email,actName,projName,workbookName)
        let fs = new FilesFSSource();
        let wbF = await fs.getFile(wbFileN,false)
        if (wbF && await wbF.isFile()){
            rslt.success=true;
            await wbF.openR();
            let jsonStr = await wbF.readAll();
            await wbF.close();
            let json = JSON.parse(jsonStr);
            rslt.data.wbJSON=json;
            return rslt;
        } else {
            wbF = await fs.getFile(wbFileN,true);
            if (!wbF){
                rslt.success=false;
                rslt.msg=`failed to create ${wbFileN}`
            } else {
                await wbF.openW(true)
                let jsonStr = "{}"
                await wbF.writeSync(jsonStr);
                await wbF.close()
                rslt.success=true;
                rslt.msg="created empty data file"
                rslt.data = {}
            }
        }
        return rslt;
    }
    static async workbookSave(email:string,actName:string,projName:string
        ,wbName:string,json:WorkbookJSON):Promise<HTTPResult>{

        let rslt:HTTPResult = {
            success:true,
            msg:""
        }
        let wbFileN = this.workbookDataFile(email,actName,projName,wbName);
        let fs = new FilesFSSource();
        let wbF = await fs.getFile(wbFileN,true);
        if (wbF && await wbF.isFile()){
            await wbF.openW(true);
            let jsonStr = JSON.stringify(json);
            await wbF.write(jsonStr);
            await wbF.close();
            return rslt;
        } else {
            rslt.success=false;
            rslt.msg=`failed to create ${wbFileN}`
            return rslt;
        }
    }
}