import { DB } from "../../../../../Zing3/share/DB";
import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { OpenCloseUI } from "../../../../../Zing3/zui/OpenCloseUI";
import { PageManager } from "../../../../../Zing3/zui/PageManager";
import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { ZDict, ZT } from "../../../common/ZT";
import { DecisionAccuracy } from "../../../server/units/decisionClassifiers/DecisionTrainer";
import { DisplayInstanceClient } from "../../workbook/DisplayInstanceClient";
import { FlowSheetClient } from "../../workbook/FlowSheetClient";
import { UnitInstanceClient } from "../../workbook/UnitInstanceClient";
import { JSONDownload } from "../JSONDownload";



export class AccuracyChart extends DisplayInstanceClient{
    paramType(): ZT {
        return new ZDict();
    }
    inputTypes(): { [inputId: string]: string; } {
        return {
            accuracy:this.checkType("Accuracy")
        };
    }
    defaultParam() {
        return {};
    }
    make(flowSheet: FlowSheetClient): UnitInstanceClient {
        return new AccuracyChart(flowSheet);
    }
    
    protected decisionAccuracy:{[decision:string]:DecisionAccuracy}={}
    async computeDisplay():Promise<ZUI>{
        this.drawBars=[];
        let jsonStr = await this.getVarJSON("accuracy");
        if (jsonStr==""){
            return new TextUI(`table error on table in ${this.name()}`)
        }
        this.decisionAccuracy = <{[decision:string]:DecisionAccuracy}>JSON.parse(jsonStr);
        let name = this.name();
        let chartList:ZUI[]=[]
        let first=true;
        for (let decision in this.decisionAccuracy){
            let acc = this.decisionAccuracy[decision];
            let ocChart = new OpenCloseUI(new TextUI(decision),()=>{
                return this.decisionChart(decision,acc)
            },first)
            first=false;
            chartList.push(ocChart);
        }
        return new DivUI([
            ...chartList,
            this.selectionsBar(),
            new JSONDownload(jsonStr,name)
        ])
    }
    private decisionChart(decision:string,acc:DecisionAccuracy):ZUI{
        let ab = this.accuracyBar(acc).style("col-12")
        let parts = decision.split(" | ");
        let decision1 = parts[0];
        let decision2 = parts[1];
        let outcome1 = this.outcomeBar(decision1
            ,this.assembleOutcomeExamples(decision1,acc))
        let outcome2 = this.outcomeBar(decision2
            ,this.assembleOutcomeExamples(decision2,acc))
        return new DivUI([
            ab,
            outcome1,
            outcome2
        ])
    }
    private accuracyBar(acc:DecisionAccuracy):ZUI{
        return new DivUI([
            new TextUI("<b>Accuracy</b>").style("col-2"),
            new TextUI("min: "+(acc.min*100).toFixed()+"%").style("col-3"),
            new TextUI("ave: "+((acc.avSum/acc.avCount)*100).toFixed()+"%").style("col-3"),
            new TextUI("max: "+(acc.max*100).toFixed()+"%").style("col-3"),
        ])
    }
    private assembleOutcomeExamples(outcome:string,acc:DecisionAccuracy):OutcomeExamples{
        let rslt:OutcomeExamples={outcome:outcome,examples:[]};
        for (let exId in acc.failedExamples){
            let fEx = acc.failedExamples[exId]
            if (fEx.outcome == outcome){
                rslt.examples.push({exId:exId,confidence:-fEx.confidence})
            }
        }
        for (let exId in acc.successExamples){
            let sEx = acc.successExamples[exId]
            if (sEx.outcome == outcome){
                rslt.examples.push({exId:exId,confidence:sEx.confidence})
            }
        }
        rslt.examples.sort((a,b)=>{
            return b.confidence-a.confidence;
        })
        return rslt;
    }
    private outcomeBar(decision:string,oEx:OutcomeExamples):ZUI{
        return new DivUI([
            new TextUI(decision).style("col-2"),
            new DrawBar(decision,oEx,this).style("col-10")
        ])
    }
    selections:string[]=[];
    select(exId:string){
        let selIdx = this.selections.indexOf(exId)
        if (selIdx<0){
            this.selections.push(exId)
        } else {
            this.selections.splice(selIdx,1)
        }
        this.paint()
    }
    private selectionsBar():ZUI{
        return new TextUI(()=>{
            let selDescs:string[]=[];
            for (let sel of this.selections){
                let selInfo = this.exInfoFromExId(sel);
                selDescs.push(selInfo)
            }
            return selDescs.join("<br>")
        }).style("col-12")
    }
    private exInfoFromExId(exId:string):string{
        for (let decision in this.decisionAccuracy){
            let acc = this.decisionAccuracy[decision];
            for (let fExId in acc.failedExamples){
                let fEx = acc.failedExamples[fExId]
                if (fExId==exId){
                    return `${exId}:${fEx.outcome}`
                }
            }
            for (let sExId in acc.successExamples){
                let sEx = acc.successExamples[sExId]
                if (sExId==exId){
                    return `${exId}:${sEx.outcome}`
                }
            }
        }
        return `${exId}??`
    }
    private drawBars:DrawBar[]=[]
    addDrawBar(drawBar:DrawBar){
        this.drawBars.push(drawBar);
    }
    paint(){
        for (let db of this.drawBars){
            db.paint();
        }
    }
}
type OutcomeExamples = {
    outcome:string,
    examples:{exId:string,confidence:number}[]
}
class DrawBar extends ZUI{
    decision:string;
    oEx:OutcomeExamples;
    protected htmlClass="XYChart2D"
    protected accuracyChart:AccuracyChart;
    constructor(decision:string,oEx:OutcomeExamples,accuracyChart:AccuracyChart){
        super();
        this.decision=decision;
        this.oEx=oEx;
        this.accuracyChart=accuracyChart;
        accuracyChart.addDrawBar(this);
        PageManager.addAfterDOMNotice(()=>{
            if (!this.eventSetup && this.canvas){
                this.setupEventListeners();
                this.eventSetup=true;
            }
            this.paint();
        })
        this.paint();
    }
    protected canvas:JQuery=<any>undefined;
    private eventSetup=false;
    setupEventListeners(){
        let canvas:JQuery = <JQuery>this.canvas;
        canvas.mousemove((event: Event) => {
            try {
                event.preventDefault();
                this.mouseMove(event);
            } catch (e) { DB.msg("mousemove ERR",e); }
        });
        canvas.mouseup((event:Event)=>{
            try {
                event.preventDefault();
                this.mouseUp(event)
            }catch (e) {DB.msg("mouseup Err",e)}
        })
        canvas.mousedown((event:Event)=>{
            try {
                event.preventDefault();
                this.mouseDown(event)
            }catch (e) {DB.msg("mousedown Err",e)}
        })
        
        canvas.mouseleave((event:Event)=>{
            try {
                event.preventDefault();
                this.mouseLeave(event)
            }catch (e) {DB.msg("mouseleave Err",e)}
        })
        canvas.mouseenter((event:Event)=>{
            try {
                event.preventDefault();
                this.mouseEnter(event)
            }catch (e) {DB.msg("mouseenter Err",e)}
        })
    }
    private exIdx=-1
    private mouseMove(event:Event){
        this.eventToExIdx(event);
        if (this.exIdx!=-1)
            this.paint();
        //DB.msg(`mouseMove(${x},${y})`)
    }
    private mouseUp(event:Event){
        this.eventToExIdx(event);
        if (this.exIdx!=-1){
            let ex = this.oEx.examples[this.exIdx]
            this.accuracyChart.select(ex.exId);
            ZUI.notify();
            this.paint();
        }
        //DB.msg(`mouseUp(${x},${y})`)
    }
    
    private mouseDown(event:Event){
        this.eventToExIdx(event);
        if (this.exIdx!=-1)
            this.clickDown(this.exIdx)
        this.paint();
        //DB.msg(`mouseDown(${x},${y})`)
    }
    private clickDown(exIdx:number){

    }
    private mouseLeave(event:Event){
        this.exIdx=-1
        this.paint();
    }
    private mouseEnter(event:Event){
        this.eventToExIdx(event);
        this.paint();
        //DB.msg(`mouseEnter(${x},${y})`)
    }
    private barHeightPixels=25;
    protected graphics:CanvasRenderingContext2D=(<any>undefined);
    private labelFont = "10px sans-serif"
    private barWidth=0;
    private exWidth=0;
    paint(){
        let g = this.graphics;
        if (!this.canvas) return;
        this.barWidth = this.canvas.innerWidth();
        (<any>this.canvas[0]).width=this.barWidth;
        (<any>this.canvas[0]).height=this.barHeightPixels;
        g.font = this.labelFont;
        this.computeGeometry()
        this.paintBar();
        this.paintExampleMarks();
        this.paintSelections();
        this.paintInteraction();
    }
    private eventToExIdx(event:Event):number{
        let x = 0;
        if (event instanceof MouseEvent){
            x=(<MouseEvent>event).clientX;
        } else if (event instanceof TouchEvent){
            x=(<TouchEvent>event).changedTouches[0].pageX
        } else {
            let oe = (<any>event).originalEvent;
            if (oe){
                x=oe.clientX;
            }
        }
        let rect = this.canvas[0].getBoundingClientRect();
        x = x-rect.left;
        let exIdx = Math.floor(x/this.exWidth)
        if (exIdx<0 || exIdx>=this.oEx.examples.length)
            exIdx=-1;
        this.exIdx=exIdx;
        return exIdx;
    }
    private exIdxToLeft(exIdx:number):number{
        let left = exIdx*this.exWidth;
        return left;
    }
    private computeGeometry(){
        this.exWidth = this.barWidth/this.oEx.examples.length;
    }
    private paintBar(){
        for (let exIdx=0;exIdx<this.oEx.examples.length;exIdx++){
            let ex = this.oEx.examples[exIdx];
            let conf = ex.confidence;
            let color = this.confToColor(conf);
            this.graphics.fillStyle=color;
            let left = this.exIdxToLeft(exIdx);
            this.graphics.fillRect(left,0,this.exWidth,this.barHeightPixels)
        }
    }
    private confToColor(confidence:number):string{
        let r = 0;
        let g = 0
        let b = 0;
        if (confidence>0){
            g=255;
            r = Math.round((1-confidence)*255)
        } else {
            r = 255
            g = Math.round((1+confidence)*255)
        }
        let rslt = `rgb(${r},${g},${b})`
        return rslt;
    }
    private paintExampleMarks(){
        let firstFail=0 ;
        this.graphics.strokeStyle="black"
        this.graphics.lineWidth=1;
        this.graphics.beginPath()
        for (let exIdx=0;exIdx<this.oEx.examples.length;exIdx++){
            let ex = this.oEx.examples[exIdx];
            let conf = ex.confidence;
            if (firstFail==0 && conf<=0)
                firstFail=exIdx;
            let center = this.exIdxToLeft(exIdx)+(this.exWidth/2);
            this.graphics.moveTo(center,0)
            this.graphics.lineTo(center,this.barHeightPixels)
        }
        this.graphics.stroke()
        if (firstFail==0){
            firstFail = this.oEx.examples.length+1
        }
        let zeroX = this.exIdxToLeft(firstFail);
        this.graphics.lineWidth=3;
        this.graphics.beginPath();
        this.graphics.moveTo(zeroX-1,3)
        this.graphics.lineTo(zeroX-1,this.barHeightPixels-3)
        this.graphics.stroke();
    }
    private paintSelections(){
        let selections = this.accuracyChart.selections;
        this.graphics.strokeStyle="black"
        this.graphics.lineWidth=1;
        for (let selId of selections){
            let selIdx = this.exIdToIdx(selId);
            if (selIdx>=0){
                let center = this.exIdxToLeft(selIdx)+this.exWidth/2;
                this.graphics.strokeRect(center-3,2,6,this.barHeightPixels-4)
            }
        }
    }
    private exIdToIdx(exId:string):number{
        for (let exIdx=0;exIdx<this.oEx.examples.length;exIdx++){
            if (this.oEx.examples[exIdx].exId==exId)
                return exIdx;
        }
        return -1;
    }
    private paintInteraction(){
        if (this.exIdx==-1)
            return;
        let id = this.oEx.examples[this.exIdx].exId;
        this.graphics.fillStyle="black";
        this.graphics.font=this.labelFont;
        let center = this.exIdxToLeft(this.exIdx)+this.exWidth/2;
        this.graphics.textAlign="center"
        this.graphics.fillText(id,center,this.barHeightPixels/2)
        this.graphics.textAlign="left"
    }
    private canvasId="";
    renderJQ():JQuery{
        this.eventSetup=false;
        if (this.canvasId==""){
            this.canvasId=`CNVS${(Math.random()*10000).toFixed(0)}`
        }
        this.canvas = $(`<canvas style="width:100%;height:${this.barHeightPixels}px"/>`);
        this.graphics = <CanvasRenderingContext2D>(<HTMLCanvasElement>this.canvas[0]).getContext("2d")
        let div = $(`<div id="${this.canvasId}" class="${this.htmlClass}"></div>`)
        div.append(this.canvas);
        this.applyCSS(div);
        return div;

    }
}