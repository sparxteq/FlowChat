import { ZUI } from "../../../Zing3/zui/ZUI";


export function closePopup(): void {
    if (closed) {
        return;
    }

    closed = true;

    // Remove outside-click listener.
    $(document).off("mousedown.popup");

    for (let p of $popupList){
        p.remove();
    }
    $popupList=[];
    onClose();
}
var onClose:()=>void=()=>{};
var $popupList:any[]=[];
export function showPopup(popupZUI:ZUI,targetId: string
        ,onCloseP: () => void,outClickToHide=true, sideMenu=false): void {
    let $popup = popupZUI.renderJQ();
    $popupList.push($popup)
    onClose=onCloseP;
    const $target = $(`#${targetId}`);

    if ($target.length === 0 || $popup.length === 0) {
        return;
    }

    // Put popup at document level so parent overflow/clipping
    // doesn't interfere with it.
    $popup.appendTo(document.body);

    // Make it measurable but temporarily invisible.
    $popup.css({
        position: "absolute",
        display: "block",
        visibility: "hidden",
        zIndex: 10000
    });

    const targetRect = $target[0].getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const targetMidX = (targetRect.left+targetRect.right)/2;
    const targetMidY = (targetRect.top+targetRect.bottom)/2;
    const leftMenu = targetMidX>(windowWidth/2);
    const belowMenu = targetMidY<(windowHeight/2);

    if (sideMenu){
        if (leftMenu)
            positionLeft($popup,targetRect);
        else
            positionRight($popup,targetRect)
    } else {
        if (belowMenu)
            positionBelow($popup,targetRect)
        else
            positionAbove($popup,targetRect)
    }


    

    

    /*
     * Delay registering the handler until after the event
     * that opened the popup has finished.
     */
    setTimeout(() => {

        $(document).on("mousedown.popup", (event) => {
            if (!outClickToHide)
                return;
            const target = event.target as Node;

            /*
             * If the click occurred anywhere inside the popup,
             * do nothing.
             *
             * Buttons, inputs, selects, links, sliders, etc.
             * inside the popup continue to work normally.
             */
            let inside=false;
            for (let p of $popupList){
                if (p[0].contains(target))
                    inside=true
            }
            if (inside) {
                return;
            }

            closePopup();
        });

    }, 0);
}
function positionLeft($popup:JQuery,targetRect:DOMRect){
    let popupWidth = $popup.outerWidth()
    let left = targetRect.left + window.scrollX -popupWidth;
    let popupHeight = $popup.outerHeight()
    let top = targetRect.top + window.scrollY 
        +targetRect.height/2 - popupHeight/2

    $popup.css({
        top: `${top}px`,
        left: `${left}px`,
        visibility:"visible"
    })
}
function positionRight($popup:JQuery,targetRect:DOMRect){
    let left = targetRect.right + window.scrollX;
    let popupHeight = $popup.outerHeight()
    let top = targetRect.top + window.scrollY 
        +targetRect.height/2 - popupHeight/2

    $popup.css({
        top: `${top}px`,
        left: `${left}px`,
        visibility:"visible"
    })
}
function positionAbove($popup:JQuery,targetRect:DOMRect){
    let popupHeight = $popup.outerHeight()
    let top  = targetRect.top + window.scrollY - popupHeight;
    let popupWidth = $popup.outerWidth()
    let left = targetRect.left + window.scrollX
        +targetRect.width/2 - popupWidth/2

    $popup.css({
        left: `${left}px`,
        top: `${top}px`,
        visibility:"visible",
    })
}
function positionBelow($popup:JQuery,targetRect:DOMRect){
    let top = targetRect.bottom + window.scrollY;
    let popupWidth = $popup.outerWidth()
    let left = targetRect.left + window.scrollX
        +targetRect.width/2 - popupWidth/2

    $popup.css({
        left: `${left}px`,
        top: `${top}px`,
        visibility:"visible"
    })
}