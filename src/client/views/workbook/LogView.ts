import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { HTTPLog, HTTPLogEntry } from "../../../common/http/httpTypes";




export class LogView extends ZUI{
    log?:HTTPLog
    divId:string;
    private html:string="no log"
    constructor(instanceId:string){
        super();
        this.divId = instanceId+"-LOG"
    }
    setLog(log:HTTPLog){
        this.log=log;
        this.html=this.logToHTML(log)
        let div = $(`#${this.divId}`)
        div.html(this.html);
    }
    running(){
        let top:HTTPLogEntry = {
            type:"Sc",
            status:"running"
        }
        this.setLog({
            success:true,
            data:{
                stack:[top],
                runStatus:"running"
            }
        })
    }
    private logToHTML(log:HTTPLog | undefined):string{
        if (!log){
            return "no log"
        }
        let html="";
        let stack:HTTPLogEntry[]=log.data.stack;
        switch(log.data.runStatus){
            case "complete":
                html="<b>success</b><br>"
                break;
            case "failed":
                html=`<b>FAILED</b><br> ${log.msg}`
                break;
            case "running":
                html="<br>";
                if (stack[stack.length-1] && stack[stack.length-1].status)
                    html=`<b>${stack[stack.length-1].status}</b><br>`
                break;
            case "pending":
                html="<b>pending</b>"
                break;
        }
        for (let si of stack){
            html+=this.stackElToHTML(si)
        }
        return html;
    }
    private stackElToHTML(si:HTTPLogEntry):string{
        let rslt="";
        switch(si.type){
            case "Sc":
                let header = `<div class="LogSectionHeader">&gt;${si.name!} - ${this.time(si)}</div>`
                let messages:string[]=[header];
                if (si.messages){
                    for (let msg of si.messages){
                        let str = this.stackElToHTML(msg)
                        messages.push(str);
                    }
                }
                
                let trailer = `<div class="LogSectionHeader">&lt;${si.name!} - ${this.time(si)}</div>`
                messages.push(trailer);
                let all = messages.join("<br>")
                rslt = `<div class="LogSection">${all}</div>`
                break
            case "M":
                rslt = `<div class="LogMessage">${si.text}</div>`
                break;
        }
        
        return rslt;
    }
    private time(si:HTTPLogEntry):string{
        if (!si.endTime || !si.startTime)
            return "-";
        let secs = Math.round((si.endTime-si.startTime)/1000);
        let hours = Math.floor(secs/3600);
        secs = secs-(hours*3600);
        let minutes = Math.floor(secs/60);
        secs = secs-(minutes*60)
        if (hours !=0)
            return `${hours}:${minutes}:${secs}`
        else if (minutes !=0)
            return `${minutes}:${secs}`
        else
            return `${secs} secs`
    }
    renderJQ(): JQuery {
        this.jq = $(`<div id="${this.divId}" class="StepLog">${this.html}</div>`)
        this.refresh()
        return this.jq;
    }
    refresh(){
        if (!this.jq)
            this.renderJQ()
        this.jq.removeClass();
        this.jq.addClass(this.classStr())
        this.jq.html(this.html)
        this.applyCSS(this.jq);
    }
}