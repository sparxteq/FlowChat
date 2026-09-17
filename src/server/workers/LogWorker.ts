import { DB } from "../../../../Zing3/share/DB";
import { Log } from "../../client/log/Log";

export class LogWorker {
    private contents:LogWorkerSection
    private current:LogWorkerSection
    private currentStack:LogWorkerSection[];
    private statusStr=""
    constructor(logStart:string){
        this.contents = {start:logStart,startMillis:0,endMillis:0,contents:[]}
        this.current = this.contents;
        this.currentStack = []
    }
    start(sectionName: string): void {
        //DB.msg("starting ",sectionName)
        let now = Date.now();
        //DB.msg("start now",now)
        let section:LogWorkerSection={start:sectionName,startMillis:now,endMillis:0,contents:[]}
        if (!this.current){
            this.current =this.contents;
            this.current.contents.push("log stack underflow")
        }
        this.current.contents.push(section);
        this.currentStack.push(section);
        this.current=section;
        //DB.msg("start contents",this.contents)
    }
    end(): void {
        /*if (sectionName!=this.current.start){
            DB.msg(`LogWorker.end start="${this.current.start}" end="${sectionName}"  missmatch`
                ,this.current)
            
        } */
        //DB.msg("end stack",this.currentStack)
        if (!this.current){
            this.current=this.contents;
            this.msg("log stack underflow")
        }
        this.current.endMillis=Date.now();
        let pop = this.currentStack.pop()
        if (!pop){
            DB.msg(`LogWorker.end no pending section`)
        } else {
            //DB.msg("ending",this.current.start)
            this.current = this.currentStack[this.currentStack.length-1];
        }
        //DB.msg("contents end",this.contents)
    }
    msg(text: string, data?: any): void {
        let str = text;
        if (data){
            str+=" - "+JSON.stringify(data);
        }
        if (!this.current){
            this.current = this.contents;
            this.current.contents.push("log stack underflow")
        }
        this.current.contents.push(str);
    }
    status(text: string): void {
        if (!text)
            text="?"
        this.statusStr=text;
    }
    subLog(name: string, sub: Log): void {
        throw new Error("Method not implemented.");
    }
    stringContents(): string {
        throw new Error("Method not implemented.");
    }
    logResponse():LogWorkerResponse{
        return {status:this.statusStr,
            log:this.contents
        }
    }
}
export type LogWorkerContents = LogWorkerItem[];
export type LogWorkerItem = string | LogWorkerSection;
export type LogWorkerSection = {
    start:string,
    startMillis:number,
    endMillis:number,
    contents:LogWorkerContents
}
export type LogWorkerResponse = {
    status:string,
    log:LogWorkerSection
}