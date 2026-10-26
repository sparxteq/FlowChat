import { DB } from "../../../../../Zing3/share/DB";
import { PageManager } from "../../../../../Zing3/zui/PageManager";
import { BiClusterRegionZ } from "./BiClusterRegionZ"

export abstract class BiClusterDrawRegion extends BiClusterRegionZ {
    protected xMin: number=Number.MAX_SAFE_INTEGER;
    protected xMax: number=Number.MIN_SAFE_INTEGER;
    protected yMin: number=Number.MAX_SAFE_INTEGER;
    protected yMax: number=Number.MIN_SAFE_INTEGER;
    protected fontSize: number=12;
    protected notifHandler: (notifType: string, data: any) => void=()=>{ return };
    constructor() {
        super();
        PageManager.addAfterDOMNotice(() => {
            if (!this.eventSetup && this.canvas) {
                this.setupEventListeners();
                this.eventSetup = true;
            }
            this.paintL();
        })
    }
    setNotificationHandler(handler: (notifType: string, data: any) => void) {
        this.notifHandler = handler;
    }
    setupEventListeners() {
        let canvas: JQuery = this.canvas!;
        canvas.mousemove((event: Event) => {
            try {
                event.preventDefault();
                this.mouseMove(this.eventX(event), this.eventY(event), event);
            } catch (e) { DB.msg("mousemove Err", e); }
        });
        canvas.mousedown((event: Event) => {
            try {
                event.preventDefault();
                this.mouseDown(this.eventX(event), this.eventY(event), event);
            }
            catch (e) { DB.msg("mousedown Err", e); }
        });
        canvas.mouseup((event: Event) => {
            try {
                event.preventDefault();
                this.mouseUp(this.eventX(event), this.eventY(event), event)
            } catch (e) { DB.msg("mouseup Err", e) }
        });

        canvas.mouseleave((event: Event) => {
            try {
                event.preventDefault();
                this.mouseLeave()
            } catch (e) { DB.msg("mouseleave Err", e) }
        });
    }
    private eventX(event: Event): number {
        let x = 0;
        if (event instanceof MouseEvent) {
            x = (<MouseEvent>event).clientX;
        } else if (event instanceof TouchEvent) {
            x = (<TouchEvent>event).changedTouches[0].pageX
        } else {
            let oe = (<any>event).originalEvent
            if (oe) {
                x = oe.clientX;
            }
        }
        let rect = this.canvas![0].getBoundingClientRect();
        x = x - rect.left;
        return x;
    }
    private eventY(event: Event): number {
        let y = 0;
        if (event instanceof MouseEvent) {
            y = (<MouseEvent>event).clientY;
        } else if (event instanceof TouchEvent) {
            y = (<TouchEvent>event).changedTouches[0].pageY
        } else {
            let oe = (<any>event).originalEvent
            if (oe) {
                y = oe.clientY;
            }
        }
        let rect = this.canvas![0].getBoundingClientRect();
        y = y - rect.top;
        return y;
    }
    setFontSize(fontSize: number) {
        this.fontSize = fontSize;
    }
    abstract desiredHeight(): number;
    abstract paint(g?: CanvasRenderingContext2D):void;
    abstract mouseMove(x: number, y: number, event: Event):void;
    abstract mouseDown(x: number, y: number, event: Event):void;
    abstract mouseUp(x: number, y: number, event: Event):void;
    abstract mouseLeave():void;

    private eventSetup: boolean=false;
    private divContainer?: JQuery;
    private canvas?: JQuery;
    protected graphics?: CanvasRenderingContext2D;
    private width: number=100;
    getWidth(): number {
        return this.width;
    }
    private height: number=20;
    getHeight(): number {
        return this.height;
    }
    paintL() {
        let g = this.graphics!;
        if (!this.canvas) return;
        let divWidth = this.divContainer!.width();
        let parentDiv = this.divContainer!.closest("div");
        let divHeight = parentDiv.height();
        this.canvas.attr("width", divWidth)
        let dh = this.desiredHeight();
        if (dh > divHeight) {
            this.canvas.attr("height", dh)
            this.canvas.attr("style", `width:100%;height:${dh}`)
        } else {
            this.canvas.attr("height", divHeight)
            this.canvas.attr("style", `width:100%;height:${divHeight}`)
        }
        this.width = this.canvas.innerWidth();
        this.height = this.canvas.height();
        this.xMin = 0;
        this.xMax = this.width;
        this.yMin = 0;
        this.yMax = this.height;

        if (this.hidden) {
        }

        (<any>this.canvas[0]).width = this.width;
        (<any>this.canvas[0]).height = this.height;
        g.fillStyle = "white";
        g.fillRect(0, 0, this.width, this.height);
        this.paint(g);
    }
    renderJQ(): JQuery {
        let idNum = Math.floor(Math.random() * 100000);
        let id = "BCDR" + idNum;
        this.eventSetup = false;
        let str = `<canvas style="width:100%;height:${this.desiredHeight()}" width="100%" height="${this.desiredHeight()}px"/>`
        this.canvas = $(str)
        this.graphics = <CanvasRenderingContext2D>(<HTMLCanvasElement>this.canvas[0]).getContext("2d")
        this.divContainer = $(`<div id="${id}" style="height=${this.desiredHeight()}" class="col-12 ${this.classStr()}"></div>`)
        this.divContainer.append(this.canvas);
        this.applyCSS(this.divContainer);
        let resize = new ResizeObserver(entries => {
            this.paintL();
        })
        resize.observe(this.divContainer[0])
        return this.divContainer;
    }
}