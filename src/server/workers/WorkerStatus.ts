import { LogWorkerResponse } from "./LogWorker";


export type WorkerStatus = {
    session:number,
    state: WorkerState,
    log:LogWorkerResponse,
    userId:string,
    templateId:string,
    actPath:string,
    projId:string,
    wbId:string,
    stepName:string,
    stepType:string,
    params:any
}
export type WorkerState = "idle" | "running" 
        | "failed" | "success" | "cancelled";