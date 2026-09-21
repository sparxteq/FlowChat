

export interface WorkNotifyI {
    start(label:string):void;
    end():void;
    logStatus(status:string):void;
    msg(msg:string):void;
}