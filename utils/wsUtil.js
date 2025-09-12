// Minimal utility for connecting to the overlay WebSocket with auto-reconnect
export function connectWS() {
    const WS_URL = "ws://127.0.0.1:8787";
    let ws = new WebSocket(WS_URL);
    ws.addEventListener("open", () => {
        console.log("[overlay] WS connected");
    });
    ws.addEventListener("message", (ev) => {
        try {
            const msg = JSON.parse(ev.data);
            if (!msg.type) return;
            // Overlay event handling can be done in main.js
            window.dispatchEvent(new CustomEvent("overlay-ws-event", { detail: msg }));
        } catch (err) {
            console.warn("Bad WS message:", err);
        }
    });

    return ws;
}
