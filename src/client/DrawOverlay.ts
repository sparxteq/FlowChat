import { DB } from "../../../Zing3/share/DB";


var rebuildOverlay_:()=>void|undefined;
export function rebuildOverlayCallback(rebuildOverlay:()=>void){
    rebuildOverlay_=rebuildOverlay;
    //DB.msg("setting rebuildOverlay_",rebuildOverlay_)
}
export function resize(){
    if (!init()) return;
    //DB.start("DrawOverlay.resize")
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth *dpr;
    //DB.msg("width",canvas.width)
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    redrawOverlay();
    //DB.end();
}
var draw:OverlayDraw=[]
export function clearOverlay(){
    draw=[];
}
export function overlayStroke(width:number,color:string){
    draw.push({kind:"stroke",x1:width,y1:0,x2:0,y2:0,color:color})
}
export function overlayLine(x1:number,y1:number,x2:number,y2:number,width=-1,color=""){
    if (width!=-1)
        overlayStroke(width,color);
    //DB.msg("width",canvas.getBoundingClientRect().width)
    //DB.msg("height",canvas.getBoundingClientRect().height)
    draw.push({kind:"line",x1:x1,y1:y1,x2:x2,y2:y2})
}
export function overlayRect(left:number,top:number,width:number,height:number){
    draw.push({
        kind:"rect",x1:left,y1:top,x2:left+width,y2:top+height
    })
}
export function overlayCurve(x1:number,y1:number,cp1x:number,cp1y:number
        ,cp2x:number,cp2y:number,x2:number,y2:number){
    draw.push({ kind:"curve",
        x1:x1,y1:y1,x2:cp1x,y2:cp1y,x3:cp2x,y3:cp2y,x4:x2,y4:y2
    })    
}


var canvas:HTMLCanvasElement 
var ctx:CanvasRenderingContext2D 
function init():boolean{
    if (!canvas)
        canvas = document.getElementById("drawCanvas") as HTMLCanvasElement;
    if (canvas && !ctx)
        ctx = canvas.getContext("2d")!;
    return !!canvas && !!ctx;
}
function redrawOverlay(){
    if (!init()) return;
    //DB.start("DrawOverlay.redrawOverlay")
    //DB.msg("rebuildOverlay_",rebuildOverlay_)
    if (rebuildOverlay_){
        rebuildOverlay_();
    }
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    let color = "";
    DB.msg("draw",draw)
    for (let el of draw){
        switch(el.kind){
            case "stroke":
                ctx.lineWidth=el.x1;
                ctx.strokeStyle=<string>el.color;
                color = <string>el.color;
                break;
            case "line":
                ctx.beginPath();
                ctx.moveTo(el.x1,el.y1);
                ctx.lineTo(el.x2,el.y2);
                ctx.stroke();
                break;
            case "rect":
                if (el.color)
                    ctx.fillStyle = <string>el.color;
                else 
                    ctx.fillStyle=color;
                if (el.x1>el.x2){
                    let tmp = el.x1;
                    el.x1=el.x2;
                    el.x2=tmp;
                }
                if (el.y1>el.y2){
                    let tmp = el.y1;
                    el.y1=el.y2;
                    el.y2=tmp;
                }
                ctx.fillRect(el.x1,el.y1,el.x2-el.x1,el.y2-el.y1)
                break;
            case "curve":
                ctx.beginPath();
                ctx.moveTo(el.x1,el.y1);
                ctx.bezierCurveTo(el.x2,el.y2,el.x3!,el.y3!,el.x4!,el.y4!)
                ctx.stroke();
                break;
        }
    }
    //DB.end()
}
resize();
window.addEventListener("resize",()=>{
    //DB.start("event listener")
    resize()
    //DB.end();
})

type OverlayDraw=OverlayElement[];
type OverlayKind = "stroke" | "line" | "rect" | "curve"
type OverlayElement = {
    kind:OverlayKind,
    x1:number,
    y1:number,
    x2:number,
    y2:number,
    x3?:number,
    y3?:number,
    x4?:number,
    y4?:number,
    color?:string,
}