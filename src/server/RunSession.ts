import { DB } from "../../../Zing3/share/DB";
import { LogMem } from "../client/log/LogMem";
import { StepRunJSON } from "../common/WorkbookJSON";
import { Unit } from "./units/Unit";


export class RunSession {
    instanceInfo:StepRunJSON
    sessionId:string;
    log:LogMem;
    sessionDoneTime=0;
    constructor(instanceInfo:StepRunJSON){
        this.instanceInfo=instanceInfo;
        this.sessionId = RunSession.generateSessionId(this);
        this.log=new LogMem();
    }
    start():boolean{
        let unit = Unit.getUnit(this.instanceInfo.unitId)
        if (!unit)
            return false;
        try{
            unit.run(this.instanceInfo,this.log).then((success:boolean)=>{
                this.log.done(success);
                this.sessionDoneTime=Date.now();
            }).catch((reason:any)=>{
                DB.msg(`session ${this.instanceInfo.unitId} failed for`,reason)
                this.log.done(false);
            })
        } catch (e) {
            if (e instanceof Error){
                DB.msg(`session ${this.instanceInfo.unitId} failed for`,e.message)
                this.log.done(false);
            }
        }
        return true;
    }
    private static sessionRegistry:{[sessionId:string]:RunSession}={}
    private static generateSessionId(rs:RunSession):string{
        let sessionNum = Math.floor(Math.random()*100000000);
        let sessionId = "SID-"+sessionNum;
        while (this.sessionRegistry[sessionId]){
            sessionNum = Math.floor(Math.random()*100000000);
            sessionId = "SID-"+sessionNum;
        }
        this.sessionRegistry[sessionId]=rs;
        return sessionId;
    }
    static getSession(sessionId:string):RunSession{
        this.purgeSessions();
        return this.sessionRegistry[sessionId]
    }
    private static purgeSessions(){
        for (let id in this.sessionRegistry){
            let session = this.sessionRegistry[id];
            if (session.sessionDoneTime){
                let idleTime = Date.now()-session.sessionDoneTime;
                if (idleTime>60*1000){
                    delete this.sessionRegistry[id]
                }
            }
        }
    }
}