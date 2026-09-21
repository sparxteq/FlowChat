import { Log } from "../../client/log/Log";
import { WorkNotifyI } from "./WorkNotifyI";



export class WorkNotify implements WorkNotifyI{
    log:Log;
    constructor(log:Log){
        this.log=log;
    }
    private startStack:string[]=[]
    start(label: string): void {
        this.log.start(label);
        this.startStack.push(label)
    }
    end(): void {
        let endLabel = this.startStack.pop()
        this.log.end(endLabel!);
    }
    logStatus(status: string): void {
        this.log.status(status);
    }
    msg(msg: string): void {
        this.log.msg(msg);
    }
    
}