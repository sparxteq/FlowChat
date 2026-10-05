import { DB } from "../../../../../Zing3/share/DB";
import { PageManager } from "../../../../../Zing3/zui/PageManager";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { InteractiveViewTable } from "../InteractiveViewTable";




export class RangeRibbonUI extends ZUI {
    protected data:InteractiveViewTable;
    protected fieldName:string;
    protected dir:string;
    protected height=-1;
    constructor(data:InteractiveViewTable,fieldName:string,dir:"v"|"h",height=-1){
        super();
        this.data=data;
        this.fieldName=fieldName
        this.dir=dir
        this.height=height;
        PageManager.addAfterDOMNotice(()=>{
            if (!this.eventSetup && this.canvas){
                this.setupEventListeners();
                this.eventSetup=true;
            }
            
            this.paint();
        })
    }
    private eventSetup:boolean=false;
    setupEventListeners(){
        let canvas:JQuery = this.canvas;
        /*canvas.mousemove((event: Event) => {
            try {
                event.preventDefault();
                this.mouseMove(event);
            } catch (e) { DB.msg("mousemove ERR",e); }
        });*/
        canvas.mouseup((event:Event)=>{
            try {
                event.preventDefault();
                this.mouseUp(event)
            }catch (e) {DB.msg("mouseup Err",e)}
        })
        /*canvas.mousedown((event:Event)=>{
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
        })*/
    }
    private eventX(event:Event):number{
        let x=0;
        if (event instanceof MouseEvent){
            x = (<MouseEvent>event).clientX;
        } else if (event instanceof TouchEvent){
            x=(<TouchEvent>event).changedTouches[0].pageX
        } else {
            let oe = (<any>event).originalEvent
            if (oe){
                x = oe.clientX;
            } 
        }
        let rect = this.canvas[0].getBoundingClientRect();
        x = x-rect.left;
        return x;
    }
    private eventY(event:Event):number{
        let y=0;
        if (event instanceof MouseEvent){
            y = (<MouseEvent>event).clientY;
        } else if (event instanceof TouchEvent){
            y=(<TouchEvent>event).changedTouches[0].pageY
        } else {
            let oe = (<any>event).originalEvent
            if (oe){
                y = oe.clientY;
            } 
        }
        let rect = this.canvas[0].getBoundingClientRect();
        y = y-rect.top;
        return y;
    }
    private mouseUp(event:Event){
        let width = this.canvas.innerWidth();
        let height = this.canvas.innerHeight();
        let range = this.data.fieldRange(this.fieldName);
        if (!range) return;
        let val=0;
        let endMin=10;
        if (this.dir=="v"){ // vertical
            let evY=this.eventY(event);
            if (evY<endMin)
                evY=0;
            if ((height-evY)<endMin)
                evY=height;
            val = (height-evY)/height*(range.upper-range.lower)+range.lower
        } else { // horizontal
            let evX=this.eventX(event);
            if (evX<endMin)
                evX=0;
            if ((width-evX)<endMin)
                evX=width;
            val = (evX)/width*(range.upper-range.lower)+range.lower
        }
        let mid = (range.zoomMax+range.zoomMin)/2;
        let min=range.zoomMin;
        let max=range.zoomMax;
        if (val<mid){
            min=val;
        } else {
            max=val;
        }
        this.data.zoomSelect(this.fieldName,min,max);
        ZUI.notify();
        //DB.msg(`mouseUp(${x},${y})`)
    }
    private canvas:JQuery=<any>undefined;
    private graphics:CanvasRenderingContext2D=<any>null;
    private paint(){
        let g = this.graphics;
        if (!this.canvas) return;
        let width = this.canvas.innerWidth();
        let height = this.canvas.innerHeight();
        if (this.height>0)
            height = this.height;
        
        (<any>this.canvas[0]).width=width;
        (<any>this.canvas[0]).height=height;

        //DB.msg(`paint(${width},${height})`)
        g.fillStyle="#FFFFFF"
        g.fillRect(0,0,width,height);
        if (this.data){
            let range = this.data.fieldRange(this.fieldName);
            if (range){
                let ul = range.upper-range.lower;
                let maxMin = range.zoomMax-range.zoomMin;
                g.fillStyle="#AAAAAA"
                if (this.dir=="v"){ // vertical
                    let graphicsScale = height/ul
                    let bottom = height-(range.zoomMin-range.lower)*graphicsScale;
                    let top = height-(range.zoomMax-range.lower)*graphicsScale;
                    g.fillRect(0,top,width,bottom-top)
                } else { // horizontal
                    let graphicsScale = width/ul
                    let left = (range.zoomMin-range.lower)*graphicsScale
                    let right = (range.zoomMax-range.lower)*graphicsScale;
                    g.fillRect(left,0,right-left,height)
                }
            }
        }
    }
    renderJQ(): JQuery {
        this.eventSetup = false;
        let div = $(`<div class="RangeRibbonUI ${this.classStr()}"></div>`)
        if (this.data){
            this.canvas = $(`<canvas style="width:100%;height:100%"/>`);
            this.graphics = <CanvasRenderingContext2D>(<HTMLCanvasElement>this.canvas[0]).getContext("2d")
            div.append(this.canvas);
        }
        this.applyCSS(div);
        return div;
    }
}