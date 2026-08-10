import { ZUI } from "../../../Zing3/zui/ZUI";



export function showPopup(popupZUI:ZUI,targetId: string,onClose: () => void): void {
    const $popup = popupZUI.renderJQ();
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

    const popupWidth = $popup.outerWidth() ?? 0;

    // Center popup horizontally below target.
    let left =
        targetRect.left +
        window.scrollX +
        targetRect.width / 2 -
        popupWidth / 2;

    const top =
        targetRect.bottom +
        window.scrollY;

    // Optional: prevent popup from running off the sides
    // of the document/viewport.
    const margin = 5;

    const viewportLeft = window.scrollX + margin;
    const viewportRight =
        window.scrollX +
        document.documentElement.clientWidth -
        margin;

    if (left < viewportLeft) {
        left = viewportLeft;
    }

    if (left + popupWidth > viewportRight) {
        left = viewportRight - popupWidth;
    }

    $popup.css({
        left: `${left}px`,
        top: `${top}px`,
        visibility: "visible"
    });

    let closed = false;

    function closePopup(): void {
        if (closed) {
            return;
        }

        closed = true;

        // Remove outside-click listener.
        $(document).off("mousedown.popup");

        $popup.hide();

        onClose();
    }

    /*
     * Delay registering the handler until after the event
     * that opened the popup has finished.
     */
    setTimeout(() => {

        $(document).on("mousedown.popup", (event) => {

            const target = event.target as Node;

            /*
             * If the click occurred anywhere inside the popup,
             * do nothing.
             *
             * Buttons, inputs, selects, links, sliders, etc.
             * inside the popup continue to work normally.
             */
            if ($popup[0].contains(target)) {
                return;
            }

            closePopup();
        });

    }, 0);
}