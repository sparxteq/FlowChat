import { Log } from "../../client/log/Log";
import { WorkNotifyI } from "./WorkNotifyI";



export class WorkNotify implements WorkNotifyI{
    log:Log;
    constructor(log:Log){
        this.log=log;
    }
    logStatus(status: string): void {
        this.log.status(status);
    }
    msg(msg: string): void {
        this.log.msg(msg);
    }
    
}