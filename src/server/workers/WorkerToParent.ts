import { LogWorker } from "./LogWorker"
import { WorkerStatus } from "./WorkerStatus";
import { WorkNotifyI } from "./WorkNotifyI"


export class WorkerToParent implements WorkNotifyI{
    private parentPort:MessagePort;
    private log:LogWorker;
    status:WorkerStatus
    constructor(label:string,status:WorkerStatus,parentPort:MessagePort){
        this.parentPort = parentPort
        this.log = new LogWorker(label)
        this.status=status;
    }
    sleep(ms:number):Promise<void>{
        return new Promise((resolve)=>setTimeout(resolve,ms))
    }
    getLog():LogWorker{
        return this.log;
    }
    start(sectionName:string):void{
        this.log.start(sectionName)
        this.checkStatusUpdate()
    }
    end():void{
        this.log.end();
        this.checkStatusUpdate()
    }
    msg(text:string,data?:any):void{
        this.log.msg(text,data);
        this.checkStatusUpdate()
    }
    logStatus(text:string):void{
        this.log.status(text);
        this.checkStatusUpdate();
    }
    private lastStatusTime = Date.now();
    private checkStatusUpdate(){
        let now = Date.now();
        if (now-this.lastStatusTime > 3000){
            this.lastStatusTime=now;
            this.postStatus();
        }
    }
    private postStatus(){
        this.status.log = this.log.logResponse();
        this.parentPort.postMessage({type:"status",status:this.status})
    }
    postRunning(){
        this.status.state="running"
        this.postStatus();
    }
    postSuccess(){
        this.status.state="success";
        this.postStatus();
        process.exit(0);
    }
    private getExceptionStack(err: unknown): string {

        if (err instanceof Error) {
            return err.stack ?? err.message;
        }

        if (typeof err === "object" && err !== null && "stack" in err) {
            return String((err as any).stack);
        }

        return String(err);
    }
    private logExceptionStack(err:unknown){
        let stackStr = this.getExceptionStack(err);
        let splits = stackStr.split("\n");
        for (let split of splits){
            this.log.msg(split);
        }
    }
    postRunCatch(e:unknown){
        this.status.state="failed";
        this.log.start("** exception ** "+String(e))
        this.logExceptionStack(e)
        this.log.end()
        this.postStatus();
        process.exit(1);
    }
    postBadStepType(){
        this.status.state="failed";
        this.log.msg("bad step type "+this.status.stepType);
        this.postStatus()
        process.exit(2);
    }
    postException(e:unknown){
        this.status.state="failed";
        this.log.msg("step exception "+(e instanceof Error ? e.message : String(e)))
        this.postStatus();
        process.exit(1);
    }
    postFail(reason:string){
        this.status.state="failed";
        this.log.msg("failed "+reason)
        this.postStatus();
        process.exit(1)
    }
}