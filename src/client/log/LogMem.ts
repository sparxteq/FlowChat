import { DB } from "../../../../Zing3/share/DB";
import { HTTPLog, HTTPLogEntry } from "../../common/http/httpTypes";
import { Log } from "./Log";
import { setImmediate } from "node:timers/promises";


export class LogMem extends Log {
    
    protected stackTop:number=0;
    protected sectionStack:HTTPLogEntry[] = [
        {   type:"Sc",
            name:"",
            messages:[]
        }
    ]
    protected subs:{[name:string]:LogMem}={}
    private echoToDB:boolean;
    private runStatus:"running"|"complete"|"failed" = "running"
    constructor(echoToDB=false){
        super()
        this.echoToDB=echoToDB
    }
    private lastBreath:number = Date.now();
    private async breath():Promise<void>{
        let now = Date.now();
        if (now-this.lastBreath>2000){
            this.lastBreath=now;
            await setImmediate()
        }
    }
    toJSON():HTTPLog{
        let rslt:HTTPLog = {
            success:this.runStatus!="failed",
            data:{
                stack:this.sectionStack,
                runStatus:this.runStatus
            }
        }
        return rslt;
    }
    static fromJSON(json:HTTPLog):LogMem{
        let rslt = new LogMem();
        rslt.sectionStack= json.data.stack;
        rslt.stackTop=rslt.sectionStack.length-1;
        return rslt;
    }
    /*async messageReload(msgs:string[],status:string,wb:WorkbookFiles,stepName:string){
        this.stackTop=0;
        this.sectionStack=[
            {   type:"Sc",
                name:"",
                messages:[]
            }
        ]
        this.subs={}
        this.indent=0;
        for (let logString of msgs){
            if (logString.charAt(3)==";"){
                let tag = logString.slice(0,4);
                if (tag=="&gt;")
                    this.start(logString.slice(4));
                else if (tag=="&lt;"){
                    this.end(logString.slice(4))
                } else {
                    this.msg(logString);
                }
            } else {
                this.msg(logString)
            }
        }
        this.status(status);
        await wb.saveProcessStepLog(stepName,this);
        this.refreshView();
    }*/
    start(sectionName: string) {
        let newSection:HTTPLogEntry = {
            type:"Sc",
            name:sectionName,
            messages:[],
            startTime:Date.now(),
            endTime:0
        }
        let top = this.sectionStack[this.stackTop]
        if (!top.messages)
            top.messages=[];
        top.messages.push(newSection);
        this.stackTop++;
        this.sectionStack[this.stackTop]=newSection;
        if (this.echoToDB)
            DB.start(sectionName);
        this.breath()
        //this.refreshView();
    }
    end(sectionName: string) {
        let top = this.sectionStack[this.stackTop]
        if (top.name!=sectionName)
            DB.msg(`LogMem.end(${sectionName}) does not match ${top.name}`)
        top.endTime=Date.now();
        this.stackTop--;
        if (this.echoToDB){
            DB.msg("<"+sectionName+this.timeStr(top))
            DB.end()
        }
        this.breath()
        //this.refreshView();
    }
    msg(text: string, data?: any) {
        let msg:HTTPLogEntry={
            type:"M",
            text:text,
            data:data
        }
        let top = this.sectionStack[this.stackTop]
        if (!top.messages)
            top.messages=[];
        top.messages.push(msg);
        if (this.echoToDB){
            DB.msg(text,data);
        }
        this.breath()
        //this.refreshView();
    }
    status(text: string) {
        let top = this.sectionStack[this.stackTop];
        top.status=text;
        if (this.echoToDB){
            DB.msg(text);
        }
        this.breath()
        //this.refreshView();
    }
    done(success: boolean): void {
        if (success)
            this.runStatus="complete"
        else
            this.runStatus="failed"
        
        this.breath()
    }
    
    dumpDB(name?:string){
        if (name){
            DB.start(name);
        }
        this.dumpSection(this.sectionStack[0])
        for (let logName in this.subs){
            let sub = this.subs[logName];
            sub.dumpDB("@"+logName);
        }
        if (name){
            DB.msg("<"+name)
            DB.end()
        }
    }
    private dumpSection(section:HTTPLogEntry){
        if (section.name){
            DB.start(section.name);
        }
        if (!section.messages)
            section.messages=[]
        for (let msg of section.messages){
            switch(msg.type){
                case "M":
                    DB.msg(<string>msg.text,msg.data);
                    break;
                case "Sc":
                    this.dumpSection(msg);
                    break;
            }
        }
        if (section.status && section.endTime && section.endTime<=0){
            DB.msg("$ "+section.status)
        }
        if (section.name){
            if (section.endTime && section.startTime && section.endTime>section.startTime){
                let timeSecs = (section.endTime-section.startTime)/1000
                DB.msg(`<${section.name} [${timeSecs.toFixed(1)}sec]`)
                DB.end();
            } else if (section.startTime && section.startTime>0){
                DB.msg(section.name)
                DB.end();
            }else 
                DB.end()
        }
    }
    private timeStr(top:HTTPLogEntry):string{
        if (top.endTime && top.startTime && top.endTime>top.startTime){
            let timeSecs = (top.endTime-top.startTime)/1000
            let hours = Math.floor(timeSecs/3600);
            timeSecs-=(hours*3600);
            let mins = Math.floor(timeSecs/60);
            timeSecs-=mins*60
            let str = "";
            if (hours>0)
                str = hours.toFixed(0)+":";
            if (mins>0 || hours>0)
                str += mins.toFixed(0)+":"
            str+=timeSecs.toFixed(1);
            return " ["+str+"]";
        } else {
            return "";
        }
    }
    protected indent=0;
    toString(name?:string):string{
        this.indent=0;
        return this.logToString(<string>name)
    }
    stringContents(): string {
        return this.toString();
    }
    private logToString(name:string):string{
        let r = "";
        if (name){
            r+=this.tsStart(name)
        }
        r+=this.sectionToString(this.sectionStack[0])
        for (let logName in this.subs){
            let sub = this.subs[logName]
            r+=sub.logToString("@"+logName)
        }
        if (name){
            r+=this.tsEnd(name)
        }
        return r;
    }
    private sectionToString(section:HTTPLogEntry):string{
        let r="";
        if (section.name){
            r+=this.tsStart(section.name)
        }
        if (!section.messages)
            section.messages=[];
        for (let msg of section.messages){
            switch(msg.type){
                case "M":
                    r+=this.tsMsg(<string>msg.text,msg.data);
                    break;
                case "Sc":
                    r+=this.sectionToString(msg);
                    break;
            }
        }
        if (section.status && section.endTime && section.endTime<0){
            r+=this.tsMsg("$ "+section.status);
        }
        if (section.name){
            if (section.endTime && section.startTime &&section.endTime>section.startTime){
                let timeSecs=(section.endTime-section.startTime)/1000;
                r+=this.tsEnd(`${section.name} [${timeSecs.toFixed(1)}sec]`)
            } else if (section.startTime && section.startTime>0)
                r+=this.tsEnd(section.name);
            else
                r+=this.tsEnd("-");
        }
        return r;
    }
    private tsStart(name:string):string{
        let r = this.tsIndent();
        r+=`>${name}\n`
        this.indent++;
        return r;
    }
    private tsEnd(name:string):string{
        this.indent--;
        let r= this.tsIndent();
        r+=`<${name}\n`;
        return r;
    }
    private tsMsg(msg:string,data?:any):string{
        let r=this.tsIndent();
        if (data){
            r+=msg+"["+data+"]";
        } else {
            r+=msg;
        }
        return r+"\n";
    }
    private tsIndent():string{
        let r="";
        for (let i=0;i<this.indent;i++){
            r+="   ";
        }
        return r;
    }
}