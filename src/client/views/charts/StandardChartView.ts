import { DB } from "../../../../../Zing3/share/DB";
import { ButtonUI } from "../../../../../Zing3/zui/ButtonUI";
import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { PageManager } from "../../../../../Zing3/zui/PageManager";
import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { NameString } from "../../../common/NameString";
import { TableMem } from "../../../common/TableMem";
import { ZDict, ZT } from "../../../common/ZT";
import { DisplayInstanceClient } from "../../workbook/DisplayInstanceClient";
import { FlowSheetClient } from "../../workbook/FlowSheetClient";
import { UnitInstanceClient } from "../../workbook/UnitInstanceClient";
import { InteractiveViewTable } from "../InteractiveViewTable";
import { TableDownload } from "../TableDownload";
import { RangeRibbonUI } from "./RangeRibbonUI";



export class StandardChartView extends DisplayInstanceClient{
    paramType(): ZT {
        return new ZDict()
            .str("xColumn")
            .str("yColumn")
            .code("style",["dot","spike","line","matchStick"])
            .str("multiChartCol")
            .num("chartHeightPixels",{decimals:0});
    }
    inputTypes(): { [inputId: string]: string; } {
        return {
            table:this.checkType("CSV")
        };
    }
    defaultParam():StandardChartParam {
        return {xColumn:"mz",yColumn:"rt",style:"dot",multiChartCol:"decision",
            chartHeightPixels:400
        };
    }
    make(flowSheet: FlowSheetClient): UnitInstanceClient {
        return new StandardChartView(flowSheet);
    }
    subClassAdjust(draw:StandardChartDraw){
        // may be overridden by subclass
    }
    adjustViewSort(draw:StandardChartDraw){
        // may be overridden by subclass
    }
    name():string{
        let name = super.name();
        let p = this.paramValue;
        let yName = p.yColumn;
        let xName = p.xColumn;
        let rslt = `[${xName}-${yName}] ${name}`
        return rslt;
    }
    protected table:InteractiveViewTable = <any>undefined;
    async computeDisplay():Promise<ZUI>{
        let param = <StandardChartParam>this.paramValue
        let variable = await this.getVarInteractive("table")
        if (typeof variable == "string"){
            return new TextUI(`table error on table in ${this.name()}`)
        }
        let name = this.name();
        if (variable instanceof InteractiveViewTable){
            this.table = variable;
            let chartView = this.chartContent(this.table,param)

            return new DivUI([
                chartView,
                new TableDownload(this.table.baseTable,name).style("col-12")
            ])
        }
        return new TextUI(`display ${name} error ${variable}`).style("col-12")
    }

    protected chartContent (iTable:InteractiveViewTable,param:StandardChartParam,chartName?:string):ZUI{
        let chartDraw = new StandardChartDraw(iTable,param,this)
        let ribbonRight = new RangeRibbonUI(iTable,param.yColumn,"v",param.chartHeightPixels)
        ribbonRight.style("XYChartRight")
        let ribbonBelow = new RangeRibbonUI(iTable,param.xColumn,"h")
        ribbonBelow.style("XYChartBelow")
        let resetButton = new ButtonUI("x").click(()=>{
            iTable.clearRanges();
            ZUI.notify();
        })
        resetButton.style("XYChartReset")
        return new DivUI([
            chartDraw,
            ribbonRight,
            ribbonBelow,
            resetButton
        ])
    }
}
export class StandardChartDraw extends ZUI{
    viewTable:InteractiveViewTable;
    parent:StandardChartView
    constructor(viewTable:InteractiveViewTable,param:StandardChartParam,parent:StandardChartView){
        super();
        this.parent=parent;
        this.viewTable = viewTable
        if (!this.ingestParam(param))
            return
        PageManager.addAfterDOMNotice(()=>{
            if (!this.eventSetup && this.canvas){
                this.setupEventListeners();
                this.eventSetup=true;
            }
            this.paint();
        })
    }
    protected highlightColor="green";
    protected highlightWidth=10;
    protected highlightItem:string | number = -1;
    protected MINDIFF=0.001;
    private xField="";
    private yField="";
    private itemField="";
    private multiChartCol=""
    private graphStyle:"dot"|"spike"|"line"|"matchStick"="dot"
    protected leftMinWidth=80;
    protected htmlClass="XYChart2D"
    private chartHeightPixels=0;
    protected colNames():string[]{
        let ct = this.viewTable.getBColTypes();
        let names:string[]=[]
        for (let t of ct){
            let name = t.fieldName;
            names.push(name);
        }
        return names;
    }
    private ingestParam(param:StandardChartParam):boolean{
        let colNames = this.colNames();
        let rslt = true;
        this.xField=param.xColumn;
        if (colNames.indexOf(this.xField)<0 && this.xField!="*"){
            DB.msg(`xColumn ${this.xField} is not a valid column name in Table input`)
            rslt=false;
        }
        this.viewTable.addActiveColumn(this.xField)
        this.yField=param.yColumn;
        if (colNames.indexOf(this.yField)<0){
            DB.msg(`yColumn ${this.yField} is not a valid column name in Table input`)
            rslt=false;
        }
        this.viewTable.addActiveColumn(this.yField)
        this.axisTicks([{width:100,color:"#d4d1d1"}],[{width:100,color:"#d4d1d1"}])
        this.axisLabels(NameString.toCapSpaced(this.xField),NameString.toCapSpaced(this.yField))
        this.axisDecimals(3,0);
        this.graphStyle=param.style;
        if (this.graphStyle=="matchStick"){
            this.dataStyle(this.yField,"#898886",1,"spike")
            this.dataStyle(this.yField,"orange",3,"dot")
        } else
            this.dataStyle(this.yField,"red",2,this.graphStyle)
        this.chartHeightPixels=param.chartHeightPixels;
        this.parent.subClassAdjust(this);
        return rslt;
    }
    protected zoomMinX():number{
        let range = this.viewTable.getRanges()[this.xField]
        if (range){
            let min=range.zoomMin;
            let diff = (range.zoomMax-range.zoomMin)/range.zoomMax;
            if (diff<0)
                diff=-diff;
            if (diff<this.MINDIFF){
                min = range.zoomMax-(this.MINDIFF)*Math.abs(range.zoomMax)
            }
            return min;
        }else
            return 0;
    }
    protected zoomMaxX():number{
        let range = this.viewTable.fieldRange(this.xField)
        if (range)
            return range.zoomMax;
        else
            return this.viewTable.nRowsB();
    }
    protected zoomMinY():number{
        let range = this.viewTable.fieldRange(this.yField)
        if (range){
            let min=range.zoomMin;
            let diff = (range.zoomMax-range.zoomMin)/range.zoomMax;
            if (diff<0)
                diff=-diff;
            if (diff<this.MINDIFF){
                min = range.zoomMax-(this.MINDIFF)*Math.abs(range.zoomMax)
            }
            return min;
        }else
            return 0;
    }
    protected zoomMaxY():number{
        let range = this.viewTable.fieldRange(this.yField)
        if (range)
            return range.zoomMax;
        else
            return 0;
    }
    
    private dataXTickWidths:{width:number,color:string}[]=[];
    private dataYTickWidths:{width:number,color:string}[]=[];
    private drawMinLinTickWidth=50;
    axisTicks(dataXTickWidths:{width:number,color:string}[],dataYTickWidths:{width:number,color:string}[]){
        this.dataXTickWidths=dataXTickWidths;
        this.dataYTickWidths=dataYTickWidths;
        return this;
    }
    private yAxisLabels:string[]|undefined

    refresh(){
        //DB.start("StandardChartView.refresh")
        //DB.msg("nRows",this.viewTable.nRows())
        if (this.graphics)
            this.paint();
        //DB.end();
    }
       protected graphics:CanvasRenderingContext2D=(<any>undefined);
    private static labelFont = "15px sans-serif" 
    protected paint(){
        let oldSort = this.viewTable.getRowSort()
        this.parent.adjustViewSort(this);
        let g = this.graphics;
        //this.canvas = $("#"+this.canvasId);
        if (!this.canvas) return;
        let width = this.canvas.innerWidth();
        let height = this.canvas.innerHeight();
        height = this.chartHeightPixels;
        
        (<any>this.canvas[0]).width=width;
        (<any>this.canvas[0]).height=height;

        //DB.msg(`paint(${width},${height})`)
        g.font = StandardChartDraw.labelFont;
        this.paintBackground(width,height);
        if (this.viewTable.isEmpty()){
            let x=20;
            let y = 20;
            g.fillStyle="black"
            g.fillText("this table is empty or missing",x,y)
            return;
        }
        this.computeGeometry(width,height);
        this.paintAxes();
        this.paintPointData();
        this.paintConnections();
        this.paintHighlight();
        this.paintInteraction();
        if (oldSort)
            this.viewTable.setRowSort(oldSort.columnName,oldSort.descending)
    }
    private paintBackground(width:number,height:number){
        let g = this.graphics;
        g.fillStyle="#FFFFFF";
        g.fillRect(0,0,width,height);
        g.strokeStyle="#F0F0F0";
        g.strokeRect(0,0,width,height)
    }
    private xDecimals=0;
    private yDecimals=0;
    axisDecimals(xDecimals:number,yDecimals:number){
        this.xDecimals=xDecimals;
        this.yDecimals=yDecimals;
        this.refresh();

    }
    private xLabelAscent:number=-1;
    private xLabelDescent:number=-1;
    private yLabelWidth:number=-1;
    private yLabelAscent:number=-1;
    private yLabelDescent:number=-1;
    private drawMargin:number=-1;
    protected drawTop:number=-1;
    protected drawBottom:number=-1;
    protected drawLeft:number=-1;
    protected drawRight:number=-1;
    
    
    

    private computeGeometry(width:number,height:number){
        if (height<=0 || width<=0)
            return
        let g = this.graphics;
        let zoomMinX=this.zoomMinX();
        let zoomMaxX=this.zoomMaxX();
        let xMinStr = this.axisNumber(zoomMinX,this.xDecimals);
        let measure = g.measureText(xMinStr);
        this.xLabelAscent = measure.actualBoundingBoxAscent;
        this.xLabelDescent = measure.actualBoundingBoxDescent;
        this.yLabelWidth=this.leftMinWidth

        let zoomMinY=this.zoomMinY();
        let zoomMaxY=this.zoomMaxY();
        if (this.yAxisLabels){
            for (let label of this.yAxisLabels){
                measure = g.measureText(label);
                this.yLabelAscent=measure.actualBoundingBoxAscent;
                this.yLabelDescent=measure.actualBoundingBoxDescent;
                if (measure.width>this.yLabelWidth)
                    this.yLabelWidth=measure.width;
            }
        } else {
            let yMinStr = this.axisNumber(zoomMinY,this.yDecimals);
            measure = g.measureText(yMinStr);
            this.yLabelAscent=measure.actualBoundingBoxAscent;
            this.yLabelDescent=measure.actualBoundingBoxDescent;
            if (measure.width>this.yLabelWidth)
                this.yLabelWidth=measure.width;
            let yMaxStr = this.axisNumber(zoomMaxY,this.yDecimals);
            measure = g.measureText(yMaxStr);
            if (measure.width>this.yLabelWidth)
                this.yLabelWidth=measure.width;
            if (this.yLabel){
                measure = g.measureText(this.yLabel);
                if (measure.width>this.yLabelWidth)
                    this.yLabelWidth=measure.width;
            }
        }

        this.drawMargin=10;
        this.drawTop = this.drawMargin;
        this.drawBottom = height-this.drawMargin-this.drawMargin-this.xLabelAscent-this.xLabelDescent;
        this.drawLeft = this.drawMargin+this.drawMargin+this.yLabelWidth;
        this.drawRight = width-this.drawMargin;

        let inset = 5;
        let dr = this.drawRight-inset
        let dl = this.drawLeft+inset
        let dt = this.drawTop+inset;
        let db = this.drawBottom-inset;

        this.aY = (dt-db)/(zoomMaxY-zoomMinY)
        this.bY = db-zoomMinY*this.aY;
        let min = this.toDrawY(zoomMinY)
        let max = this.toDrawY(zoomMaxY)
        min = this.fromDrawY(db)
        max = this.fromDrawY(dt)
        this.aX = (dr-dl)/(zoomMaxX-zoomMinX);
        this.bX = dl-zoomMinX*this.aX;
        min = this.toDrawX(zoomMinX);
        max = this.toDrawX(zoomMaxX)
        min = this.fromDrawX(dl)
        max = this.fromDrawX(dr)
        
    }
    private aY=0;
    private bY=0;
    private toDrawY(dataY:number):number{
        return this.aY*dataY+this.bY;
    } 
    protected fromDrawY(y:number):number{
        let newY = (y-this.bY)/this.aY;
        return newY;
    }
    private aX=0;
    private bX=0;
    private toDrawX(dataX:number):number{
        return this.aX*dataX+this.bX;
    }
    protected fromDrawX(x:number):number{
        let newX = (x-this.bX)/this.aX;
        return newX;
    }

    private yLabel:string="";
    private xLabel:string="";
    axisLabels(xLabel:string,yLabel:string){
        this.xLabel=xLabel;
        this.yLabel=yLabel;
        return this;
    }
    protected axisNumber(num:number,digits:number):string{
        if (num || num==0){
            let str = num.toLocaleString("en-US",{maximumFractionDigits:digits});
            return str;
        } else {
            return "--";
        }
    }
    private paintAxes(){
        let g = this.graphics;
        g.strokeStyle="black";
        g.lineWidth=0.5;
        g.strokeRect(this.drawLeft-1,this.drawTop-1,this.drawRight-this.drawLeft+2,this.drawBottom-this.drawTop+2)
        
        if (this.yAxisLabels){
            let max = this.zoomMaxY();
            let min = this.zoomMinY();
            g.fillStyle="black";
            for (let val=0;val<this.yAxisLabels.length;val++){
                let label=this.yAxisLabels[val];
                if(val<=max && val>=min){
                    let y = this.toDrawY(val);
                    y+=this.yLabelAscent/2;
                    g.fillText(label,this.drawMargin,y);
                }
            }

        } else {
            let yMax = this.axisNumber(this.zoomMaxY(),this.yDecimals)
            
            g.fillStyle="black";
            g.fillText(yMax,this.drawMargin,this.drawTop+this.yLabelAscent);
            let yMin = this.axisNumber(this.zoomMinY(),this.yDecimals);
            g.fillText(yMin,this.drawMargin,this.drawBottom);
            if (this.yLabel){
                g.fillText(this.yLabel,this.drawMargin,(this.drawTop+this.drawBottom)/2)
            }
        }

        let xMin = this.axisNumber(this.zoomMinX(),this.xDecimals);
        g.fillText(xMin,this.drawLeft,this.drawBottom+this.drawMargin+this.xLabelAscent);
        let xMax = this.axisNumber(this.zoomMaxX(),this.xDecimals);
        let w = g.measureText(xMax).width;
        g.fillText(xMax,this.drawRight-w,this.drawBottom+this.drawMargin+this.xLabelAscent);
        if (this.xLabel){
            let mid = (this.drawRight+this.drawLeft)/2;
            w = g.measureText(this.xLabel).width;
            g.fillText(this.xLabel,mid-w/2,this.drawBottom+this.drawMargin+this.xLabelAscent)
        }

        g.strokeStyle="#DDDDDD";
        g.lineWidth=1;
        if (this.dataXTickWidths.length>0){
            this.xLinTicks(g)
        }
        if (this.dataYTickWidths.length>0){
            this.yLinTicks(g);
        }
    }
    private tickColors = [/*"#F0F0F0",*/"#AAAAAA","#888888","#000000","#000000","#000000","#000000","#000000"]
    private xLinTicks(g:CanvasRenderingContext2D){
        let tickIdx=-1;
        for ( let tick of this.dataXTickWidths){
            let width = tick.width;
            let color = tick.color;
            let zoomMinX=this.zoomMinX();
            let zoomMaxX=this.zoomMaxX();
            let drawThis = this.toDrawX(zoomMinX);
            let drawNext = this.toDrawX(zoomMinX+width)
            if (drawThis!=0 || drawNext!=0)
                while ((drawNext-drawThis)<=this.drawMinLinTickWidth){
                    width*=2;
                    drawNext = this.toDrawX(zoomMinX+width)
                }
            if ((drawNext-drawThis)>this.drawMinLinTickWidth){
                tickIdx++;
                g.strokeStyle = color
                g.lineWidth=tickIdx+1;
                let tickStart = Math.floor(zoomMinX/width)*width;
                g.beginPath();
                for (let xTick = tickStart;xTick<zoomMaxX;xTick+=width){
                    if (xTick>zoomMinX && xTick<zoomMaxX){
                        let x = this.toDrawX(xTick);
                        g.moveTo(x,this.drawTop);
                        g.lineTo(x,this.drawBottom);
                    }
                }
                g.stroke();
            }
        }
    }
    private yLinTicks(g:CanvasRenderingContext2D){
        let tickIdx=-1;
        for ( let tick of this.dataYTickWidths){
            let width = tick.width;
            let color = tick.color;
            let zoomMinY=this.zoomMinY();
            let zoomMaxY=this.zoomMaxY();
            let drawThis = this.toDrawY(zoomMinY);
            let drawNext = this.toDrawY(zoomMinY+width)
            if (drawThis!=0 || drawNext!=0)
                while ((drawThis-drawNext)<=this.drawMinLinTickWidth){
                    width*=2;
                    if (width>10000000)
                        debugger;
                    drawNext = this.toDrawY(zoomMinY+width)
                }
            if ((drawThis-drawNext)>this.drawMinLinTickWidth){
                tickIdx++;
                g.strokeStyle = color
                g.lineWidth=1;
                let tickStart = Math.floor(zoomMinY/width)*width;
                g.beginPath();
                for (let yTick = tickStart;yTick<zoomMaxY;yTick+=width){
                    if (yTick>zoomMinY && yTick<zoomMaxY){
                        let y = this.toDrawY(yTick);
                        g.moveTo(this.drawLeft,y);
                        g.lineTo(this.drawRight,y);
                    }
                }
                g.stroke();
            }
        }

    }

    private styles:{color:string,width:number,fieldName:string,drawStyle:string,alpha:number,cond?:string}[]=[

    ]
    clearStyles(){
        this.styles=[];
    }
    dataStyle(fieldName:string,color:string,width:number,drawStyle:"spike"|"dot"|"line",alpha=1.0){
        
        this.styles.push({color:color,width:width,fieldName:fieldName,drawStyle:drawStyle,alpha:alpha});
        return this;
    }
    condDataStyle(fieldName:string,color:string,width:number,drawStyle:"spike"|"dot"|"line",conditionalField:string,alpha=1.0){
        
        this.styles.push({color:color,width:width,fieldName:fieldName,drawStyle:drawStyle,alpha:alpha,cond:conditionalField});
        return this;
    }
    dataBoundsX():{min:number,max:number}{
        if (!this.viewTable) return {min:-1,max:-1};
        let range = this.viewTable.fieldRange(this.xField)
        return {min:range.lower, max:range.upper}
    }
    dataBoundsY():{min:number,max:number}{
        if (!this.viewTable) return {min:-1,max:-1};
        let range = this.viewTable.fieldRange(this.yField)
        return {min:range.lower, max:range.upper}
    }
     
    private paintHighlight(){
        let g = this.graphics;
        g.strokeStyle=this.highlightColor;
        g.lineWidth=2;
        let data = this.viewTable;
        let xIdx = data.columnIdx(this.xField);
        let yIdx = data.columnIdx(this.yField)
        let nr = data.nRows();
        let highlightRowsB = data.highlightRowsB();
        if (highlightRowsB.length<=0)
            return;
        let highlightRowB = highlightRowsB[highlightRowsB.length-1];
        let xData=0;
        let yData=0;
        for (let highlightRowB of highlightRowsB){

            let rowB = data.getRowB(highlightRowB)
            if (rowB){
                if (xIdx<0)
                    xData = highlightRowB;
                else
                    xData = <number>rowB[xIdx]
                if (yIdx<0)
                    yData = highlightRowB;
                else
                    yData = <number>rowB[yIdx];
                let x = this.toDrawX(xData);
                let y = this.toDrawY(yData)
                let left = x-this.highlightWidth/2;
                let top = y-this.highlightWidth/2;
                g.strokeRect(left,top,this.highlightWidth,this.highlightWidth)
            }
            
        }

        
    }
    private paintPointData(){
        let g = this.graphics;
        //this.viewTable.evalSort();
        let zoomMinX=this.zoomMinX();
        let zoomMaxX=this.zoomMaxX();
        let zoomMinY=this.zoomMinY();
        let zoomMaxY=this.zoomMaxY();
        let data = this.viewTable;
        for (let style of this.styles){
            let nr=data.nRows();
            //DB.start(`style nr=${nr}`)
            //DB.msg("Style data",style)
            //DB.msg("this",this)
            //DB.msg("data",data);
            let xIdx = data.columnIdx(this.xField)
            let yIdx = data.columnIdx(style.fieldName)
            //DB.msg(`xIdx=${xIdx} yIdx=${yIdx}`)
            if (data && nr>0){
                let width = style.width;
                g.strokeStyle=style.color;
                g.fillStyle=style.color;
                g.lineWidth=width;
                g.globalAlpha=style.alpha;
                switch(style.drawStyle){
                    case "spike":
                        //DB.start("spike")
                        for (let recI=0;recI<nr;recI++){
                            if (this.validRow(data,recI)){
                                let x=<number>data.getCell(recI,xIdx)
                                if (xIdx<0)
                                    x = recI;
                                let y=<number>data.getCell(recI,yIdx);
                                if (!(x<zoomMinX || x>zoomMaxX
                                        || y<zoomMinY)){
                                    g.beginPath();
                                    let num = this.toDrawY(<number>y);
                                    if (num<this.drawTop) num=this.drawTop;
                                    if (num>this.drawBottom) num=this.drawBottom;
                                    let zero = this.toDrawY(0);
                                    if (zero<this.drawTop) zero=this.drawTop;
                                    if (zero>this.drawBottom) zero = this.drawBottom;
                                    
                                    g.moveTo(this.toDrawX(<number>x),num);
                                    g.lineTo(this.toDrawX(<number>x),zero);
                                    g.stroke();
                                }
                            }
                        }
                        //DB.end()
                        break;
                    case "dot":
                        for (let recI=0;recI<nr;recI++){
                            if (this.validRow(data,recI)){
                                let x=<number>data.getCell(recI,xIdx)
                                if (xIdx<0)
                                    x = recI;
                                let y=<number>data.getCell(recI,yIdx);
                                if (!(x<zoomMinX || x>zoomMaxX
                                        || y<zoomMinY || y>zoomMaxY)){
                                    g.fillRect(this.toDrawX(<number>x)-width/2,
                                        this.toDrawY(<number>y)-width/2,
                                        width,
                                        width);
                                }
                            }
                        }
                        break;
                    case "line":
                        let first=true;
                        g.beginPath();
                        for (let i = 0;i<nr;i++){
                            if (this.validRow(data,i)){
                                let x=<number>data.getCell(i,xIdx)
                                    if (xIdx<0)
                                        x = i;
                                let y=<number>data.getCell(i,yIdx);
                                if (!(x<zoomMinX || x>zoomMaxX
                                        || y<zoomMinY || y>zoomMaxY)){
                                    if (first){
                                        g.moveTo(this.toDrawX(<number>x),this.toDrawY(<number>y))
                                        first=false;
                                    } else 
                                        g.lineTo(this.toDrawX(<number>x),this.toDrawY(<number>y));
                                }
                            }
                        }
                        g.stroke();
                        break
                }
            }
            //DB.end();
        }
        g.globalAlpha=1.0;
    }
    protected validRow(data:InteractiveViewTable,rowI:number):boolean{
        return true;
    }
    private connections:{[styleName:string]:{x1:number,y1:number,x2:number,y2:number}[]}={}
    clearConnections(styleName?:string){
        if (styleName){
            delete this.connections[styleName]
        } else {
            this.connections={}
        }
    }
    dataConnect(dataX1:number,dataY1:number,dataX2:number,dataY2:number,styleName="__"){
        if (!this.connections[styleName])
            this.connections[styleName]=[];
        this.connections[styleName].push({x1:dataX1,y1:dataY1,x2:dataX2,y2:dataY2})
        return this;
    }
    private paintConnections(){
        /*let g = this.graphics;
        let zoomMinX=this.zoomMinX();
        let zoomMaxX=this.zoomMaxX();
        let zoomMinY=this.zoomMinY();
        let zoomMaxY=this.zoomMaxY();
        for (let style of this.styles){
            let connects = this.connections[style.styleName];
            if (connects && connects.length>0){
                let width=style.width;
                g.strokeStyle=style.color;
                g.fillStyle=style.color;
                g.lineWidth=width;
                g.globalAlpha=style.alpha;
                for (let connect of connects){
                    g.beginPath()
                    if (!(
                        connect.x1<zoomMinX || connect.x1>zoomMaxX
                        || connect.y1<zoomMinY || connect.y1>zoomMaxY
                        || connect.x2<zoomMinX || connect.x2>zoomMaxX
                        || connect.y2<zoomMinY || connect.y2>zoomMaxY
                    )){
                        g.moveTo(this.toDrawX(connect.x1),this.toDrawY(connect.y1))
                        g.lineTo(this.toDrawX(connect.x2),this.toDrawY(connect.y2))
                    }
                    g.stroke();
                }
            }
        }
        g.globalAlpha=1.0*/
    }
    private paintInteraction(){
        if (this.mouseX<0) return;
        let g = this.graphics;
        let dataStr = `(${this.axisNumber(this.fromDrawX(this.mouseX),this.xDecimals)} , ${this.axisNumber(this.fromDrawY(this.mouseY),this.yDecimals)})`;
        let measure = g.measureText(dataStr);
        let width=measure.width;
        let height=measure.actualBoundingBoxAscent;
        g.fillStyle="rgba(255,255,255,0.8)";
        g.fillRect(this.mouseX-width-8,this.mouseY-height-8,width+8,height+8);
        g.strokeStyle="black";
        g.fillStyle="black";
        g.fillText(dataStr,this.mouseX-measure.width-4,this.mouseY-4);
        
        if (this.selecting){
            g.strokeStyle="gray";
            g.lineWidth=1;
            let left = this.downX
            let right = this.mouseX
            if (left>right){
                let tmp = right;
                right=left;
                left=tmp;
            }
            let top = this.downY
            let bot = this.mouseY;
            if (top>bot){
                let tmp=top;
                top=bot;
                bot=tmp;
            }
            g.strokeRect(left,top,right-left,bot-top)
        }
    }

    
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
    private mouseX=-1;
    private eventToDataX(event:Event):number{
        this.mouseX = this.eventX(event)
        let x=this.fromDrawX(this.mouseX);
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
    private mouseY=-1;
    private eventToDataY(event:Event):number{
        this.mouseY = this.eventY(event)
        let y=this.fromDrawY(this.mouseY);
        return y;
    }
    private inBounds(dataX:number,dataY:number):boolean{
        let xRange = this.zoomMaxX()-this.zoomMinX();
        let xNudge = xRange*0.05;
        if (dataX+xNudge<this.zoomMinX()) return false;
        if (dataX-xNudge>this.zoomMaxX()) return false;
        let yRange = this.zoomMaxY()-this.zoomMinY();
        let yNudge = yRange*0.05;
        if (dataY+yNudge<this.zoomMinY()) return false;
        if (dataY-yNudge>this.zoomMaxY()) return false;
        return true;
    }
    private selecting=false;
    private mouseMove(event:Event){
        let x = this.eventToDataX(event);
        let y = this.eventToDataY(event);
        if (!this.selecting && (<MouseEvent>event).buttons==1){
            if (this.isDragDistance(this.toDrawX(x),this.toDrawY(y))){
                this.selecting=true;
            }
        }
        if (this.inBounds(x,y))
            this.paint();
        //DB.msg(`mouseMove(${x},${y})`)
    }
    private mouseUp(event:Event){
        let x = this.eventToDataX(event);
        let y = this.eventToDataY(event);
        if (this.inBounds(x,y)){
            if (!this.isDragDistance(this.toDrawX(x),this.toDrawY(y)))
                this.clickNotify(x,y,event)
            this.paint();
        }
        this.endSelecting(x,y,event);
        this.clearSelecting();
        //DB.msg(`mouseUp(${x},${y})`)
    }
    private selectNotifications:{[notifyName:string]:(item:string|number)=>void}={}
    private clickNotify(x:number,y:number,event:Event){
        //DB.msg(`clickNotify (${x},${y})`)
        let highlightedB:number=-1;
        if (!this.viewTable) return;
        let data = this.viewTable
        if (!data) return;
        let rangeX = this.viewTable.fieldRange(this.xField)
        if (!rangeX) return;
        let rangeY = this.viewTable.fieldRange(this.yField);
        if (!rangeY) return;
        let xMid = (rangeX.zoomMin+rangeX.zoomMax)/2;
        let yMid = (rangeY.zoomMin+rangeY.zoomMax)/2;
        let minDist = Number.MAX_VALUE;
        let nr = data.nRows();
        for (let i=0;i<nr;i++){
            let item = data.getRow(i);
            let dist = this.itemDist(x,xMid,y,yMid,item,i)
            if (dist<0.05 && dist<minDist){
                minDist=dist;
                highlightedB = data.rowVtoB(i);
            }
        }
        this.viewTable.addHighlightRowB(highlightedB);
        if (highlightedB){
            let data = this.viewTable;
            let colB = data.colNtoB(this.itemField)
            let rowB = data.getRowB(highlightedB)
            if (rowB){
                let selStr = rowB[colB];
                if (selStr){
                    for (let notifyName in this.selectNotifications){
                        let notify=this.selectNotifications[notifyName];
                        notify(selStr);
                    }
                }
            }
        }

        ZUI.notify();
    }
    registerClick(notifyName:string,notify:(item:string|number)=>void){
        this.selectNotifications[notifyName]=notify;
        return this;
    }
    private itemDist(x:number,xMid:number,y:number,yMid:number,item:any[],row:number):number{
        let data = this.viewTable
        let xIdx = data.columnIdx(this.xField);
        let yIdx = data.columnIdx(this.yField);
        let xItem = <number>(item[xIdx])
        if (xIdx==-1)
            xItem=data.rowVtoB(row)
        let xDiff=(x-xItem)/xMid;
        let yItem = <number>(item[yIdx])
        if (yItem== -1)
            yItem=data.rowVtoB(row)
        let yDiff=(y-yItem)/yMid;
        let d = xDiff*xDiff+yDiff*yDiff;
        d=Math.sqrt(d);
        return d;
    }
    private endSelecting(dataX:number,dataY:number,event:Event){
        if (dataX<this.zoomMinX()) dataX=this.zoomMinX();
        if (dataX>this.zoomMaxX()) dataX= this.zoomMaxX();
        if (dataY<this.zoomMinY()) dataY=this.zoomMinY();
        if (dataY>this.zoomMaxY()) dataY=this.zoomMaxY();
        if (this.selecting && this.isDragDistance(this.toDrawX(dataX),this.toDrawY(dataY))){
            let x1 = this.fromDrawX(this.downX);
            let x2 = dataX;
            if (x1>x2){
                let tmp = x1;
                x1=x2;
                x2=tmp;
            }
            let y1 = this.fromDrawY(this.downY);
            let y2 = dataY;
            if (y1>y2){
                let tmp = y1;
                y1=y2;
                y2=tmp;
            }
            if (x2>x1 && y2>y1)
                this.selectNotify(x1,x2,y1,y2,event);
        }
    }
    private selectNotify(x1:number,x2:number,y1:number,y2:number,event:Event){
        //DB.msg(`select notify (${x1},${y1}) (${x2},${y2})`)
        
        if (this.viewTable){
            this.zoomField(this.xField,x1,x2)
            this.zoomField(this.yField,y1,y2)
        }
        ZUI.notify();
    }
    private zoomField(fieldName:string,min:number,max:number){
        if (min>max){
            let tmp = max;
            max=min;
            min=tmp;
        }
        let range = this.viewTable.fieldRange(fieldName);
        let mid = (range.zoomMin+range.zoomMax)/2;
        let minDiff = min-range.zoomMin;
        /*if (minDiff/mid<0.005){
            min=range.zoomMin;
        }
        let maxDiff = range.zoomMax-max;
        if (maxDiff/mid<0.005){
            max=range.zoomMax;
        }*/
        this.viewTable.zoomSelect(fieldName,min,max)
    }
    private clearSelecting(){
        this.downX=-1;
        this.downY==1;
        this.selecting=false;
    }
    private downX=0;
    private downY=0;
    private isDragDistance(drawX:number,drawY:number):boolean{
        let dx=drawX-this.downX;
        let dy=drawY-this.downY;
        if (dx<0) dx=-dx;
        if (dy<0) dy=-dy;
        return (dx+dy)>=8;
    }
    private mouseDown(event:Event){
        let x = this.eventToDataX(event);
        let y = this.eventToDataY(event);
        if (x<this.zoomMinX()) x= this.zoomMinX();
        if (x>this.zoomMaxX()) x=this.zoomMaxX();
        if (y<this.zoomMinY()) y=this.zoomMinY();
        if (y>this.zoomMaxY()) y=this.zoomMaxY();
        this.downX = this.toDrawX(x);
        this.downY = this.toDrawY(y);
        this.selecting=true;
        this.paint();
        //DB.msg(`mouseDown(${x},${y})`)
    }
    private mouseLeave(event:Event){
        let x = this.eventToDataX(event);
        let y = this.eventToDataY(event);
        this.endSelecting(x,y,event);
        this.clearSelecting();
        //DB.msg(`mouseLeave(${x},${y})`)
        this.mouseX=-1;
        this.mouseY=-1;
        this.paint();
    }
    private mouseEnter(event:Event){
        let x = this.eventToDataX(event);
        let y = this.eventToDataY(event);
        if ((<MouseEvent>event).buttons==1){
            this.downX=this.toDrawX(x);
            if (this.mouseX<this.drawLeft)
                this.downX=this.drawLeft;
            if (this.mouseY>this.drawRight)
                this.downX=this.drawRight;
            this.downY=this.toDrawY(y);
            if (this.mouseY<this.drawTop)
                this.downY=this.drawTop;
            if (this.mouseY>this.drawBottom)
                this.downY=this.drawBottom;
            this.selecting=true;
        }
        if (this.inBounds(x,y))
            this.paint();
        //DB.msg(`mouseEnter(${x},${y})`)
    }
    drawDistance(dataX1:number,dataY1:number,dataX2:number,dataY2:number):number{
        let dx=this.toDrawX(dataX1)-this.toDrawX(dataX2);
        if (dx<0) dx=-dx;
        let dy=this.toDrawY(dataY1)-this.toDrawY(dataY2);
        if (dy<0) dy=-dy;
        return dx+dy;
    }
    xDistance(dataX1:number,dataX2:number):number{
        let dx=this.toDrawX(dataX1)-this.toDrawX(dataX2);
        if (dx<0) dx=-dx;
        return dx;
    }
    private eventSetup=false;
    protected canvas:JQuery=<any>undefined;
    protected canvasId:string="";
    renderJQ():JQuery{
        this.eventSetup = false;
        if (this.canvasId==""){
            this.canvasId=`CNVS${(Math.random()*10000).toFixed(0)}`
        }
        this.canvas = $(`<canvas style="width:100%;height:100%"/>`);
        this.graphics = <CanvasRenderingContext2D>(<HTMLCanvasElement>this.canvas[0]).getContext("2d")
        let div = $(`<div id="${this.canvasId}" class="${this.htmlClass}"></div>`)
        div.append(this.canvas);
        this.applyCSS(div);
        return div;
    }  
}
export type StandardChartParam = {
    xColumn:string,
    yColumn:string,
    style:"dot"|"spike"|"line"|"matchStick",
    multiChartCol:string,
    chartHeightPixels:number
}