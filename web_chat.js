// web_chat.js — ЧАСТЬ 1: КАСКАДНЫЙ ДВИЖОК ДОМИНО И БЕЗОПАСНЫЙ ЗУМ
console.log("[JS ENGINE] Каскадный движок домино запущен!");

window.kitsuChatState = {
    isTyping: false,
    currentZoomPercent: 70 
};

// КОСТЯШКА 5 (ФИНАЛ): Снятие живого слепка координат и удар QRegion
window.syncRealRegionsToPython = function() {
    const chatContainer = document.getElementById("web-chat-container");
    if (!chatContainer) return;

    const chatRect = chatContainer.getBoundingClientRect();
    let cx = Math.round(chatRect.left);
    let cy = Math.round(chatRect.top);
    let cw = Math.round(chatRect.width);
    let ch = Math.round(chatRect.height);

    let mx = cx + 320;
    let my = cy - 40;
    let mw = 282;
    let mh = 432;

    console.log(`WINDOW_MASK:${cx}:${cy}:${cw}:${ch}:${mx}:${my}:${mw}:${mh}`);
};

// КОСТЯШКА 4: Синхронное позиционирование Лисички и ожидание кадра
window.updateKitsuAvatarPosition = function() {
    const chatContainer = document.getElementById("web-chat-container");
    if (!chatContainer) return;

    let cx = chatContainer.offsetLeft;
    let cy = chatContainer.offsetTop;

    let foxTargetX = cx + 320 + 141; 
    let foxTargetY = cy - 40 + 216;  

    // 🔥 ИСПРАВЛЕНИЕ ЛОВУШКИ 1: Заменили round на нативный Math.round! Ошибка исчезла!
    let rawScale = (window.kitsuChatState.currentZoomPercent || 70) / 100;
    let currentScaleFloat = Math.round((rawScale + Number.EPSILON) * 100) / 100;

    if (typeof window.setAvatarModelPositionAndScale === "function") {
        window.setAvatarModelPositionAndScale(foxTargetX, foxTargetY, currentScaleFloat);
    }

    requestAnimationFrame(() => {
        window.syncRealRegionsToPython();
    });
};

// РЕГУЛИРОВКА КРАТНОГО ЗУМА (Иерархия кадров)
window.adjustZoom = function(directionStep) {
    const zoomInput = document.getElementById("kitsu-zoom-value");
    if (!zoomInput) return;

    let oldZoom = window.kitsuChatState.currentZoomPercent;
    let currentZoom = oldZoom;

    if (directionStep > 0) {
        let remainder = currentZoom % 5;
        currentZoom = (remainder === 0) ? currentZoom + 5 : Math.floor(currentZoom / 5) * 5 + 5;
    } else {
        let remainder = currentZoom % 5;
        currentZoom = (remainder === 0) ? currentZoom - 5 : Math.floor(currentZoom / 5) * 5;
    }

    if (currentZoom < 10) currentZoom = 10;
    if (currentZoom > 200) currentZoom = 200;

    window.kitsuChatState.currentZoomPercent = currentZoom;
    zoomInput.value = currentZoom;

    if (currentZoom > oldZoom) {
        window.syncRealRegionsToPython(); 
        setTimeout(window.updateKitsuAvatarPosition, 30);
    } else {
        setTimeout(window.updateKitsuAvatarPosition, 40);
    }
};

// 🔥 ЧАСТЬ 2: ЧИСТЫЙ DELTA-ТРАНСЛЯТОР С КЛЭМПОМ И МЕССЕНДЖЕР
(function() {
    let isDragging = false;
    let distLeft = 0, distRight = 0, distTop = 0, distBottom = 0;
    let startMouseX = 0, startMouseY = 0; 
    let origLeft = 0, origTop = 0;

    window.addEventListener("DOMContentLoaded", () => {
        const chatContainer = document.getElementById("web-chat-container");
        if (!chatContainer) return;

        chatContainer.addEventListener("mousedown", (event) => {
            if (event.target.id === "web-input-field" || 
                event.target.id === "web-chat-history" || 
                event.target.closest(".chat-control-panel") ||
                event.target.closest(".chat-row")) {
                return; 
            }

            isDragging = true;
            console.log("DRAG_START"); 

            startMouseX = event.clientX;
            startMouseY = event.clientY;
            origLeft = chatContainer.offsetLeft;
            origTop = chatContainer.offsetTop;

            let chatL = chatContainer.offsetLeft;
            let chatR = chatL + 480;
            let chatT = chatContainer.offsetTop;
            let chatB = chatT + 350;

            let foxL = chatL + 320;
            let foxR = foxL + 282;
            let foxT = chatT - 40;
            let foxB = foxT + 432;

            let totalMinX = Math.min(chatL, foxL);
            let totalMaxX = Math.max(chatR, foxR);
            let totalMinY = Math.min(chatT, foxT);
            let totalMaxY = Math.max(chatB, foxB);

            distLeft = startMouseX - totalMinX;
            distRight = totalMaxX - startMouseX;
            distTop = startMouseY - totalMinY;
            distBottom = totalMaxY - startMouseY;

            event.preventDefault();
        });

        window.addEventListener("mousemove", (event) => {
            if (!isDragging) return;

            const limits = window.kitsuScreenLimits || { left: 0, top: 0, right: 1440, bottom: 860 };

            let currentMouseX = event.clientX;
            let currentMouseY = event.clientY;

            let Xallowed_min = limits.left + distLeft;
            let Xallowed_max = limits.right - distRight;
            let Yallowed_min = limits.top + distTop;
            let Yallowed_max = limits.bottom - distBottom;

            let lockedStrokeX = Math.max(Math.min(currentMouseX, Xallowed_max), Xallowed_min);
            let lockedStrokeY = Math.max(Math.min(currentMouseY, Yallowed_max), Yallowed_min);

            let finalLeft = lockedStrokeX - distLeft;
            let finalTop = lockedStrokeY - distTop + 40; 

            chatContainer.style.left = finalLeft + "px";
            chatContainer.style.top = finalTop + "px";
            chatContainer.style.bottom = "auto";

            // 🔥 ФИКС ЛОВУШКИ 1: Округление масштаба через Math.round внутри мыши
            let rawScale = (window.kitsuChatState.currentZoomPercent || 70) / 100;
            let currentScaleFloat = Math.round((rawScale + Number.EPSILON) * 100) / 100;
            
            let cx = finalLeft;
            let cy = finalTop;
            let foxTargetX = cx + 320 + 141;
            let foxTargetY = cy - 40 + 216;
            
            if (typeof window.setAvatarModelPositionAndScale === "function") {
                window.setAvatarModelPositionAndScale(foxTargetX, foxTargetY, currentScaleFloat);
            }
        });

        window.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                console.log("DRAG_STOP");
                
                setTimeout(() => {
                    if (window.updateKitsuAvatarPosition) window.updateKitsuAvatarPosition();
                }, 50);
            }
        });
    });
})();

// Метод добавления облачек сообщений (оставляем без изменений)
window.addMessageToWebChat = function(role, text, isPartial = false) {
    const webHistory = document.getElementById("web-chat-history");
    if (!webHistory) return;
    if (role === "kitsu_prefix") {
        const prefixDiv = document.createElement("div");
        prefixDiv.style.marginBottom = "6px";
        prefixDiv.innerHTML = `<span style="color: #ffb3d1; font-weight: bold;">Кицуне:</span> <span class="kitsu-live-body" style="color: #e6f0ff;"></span>`;
        webHistory.appendChild(prefixDiv);
        webHistory.scrollTop = webHistory.scrollHeight;
        return;
    }
    if (role === "kitsu" && isPartial) {
        const lastNode = webHistory.lastChild;
        if (lastNode && lastNode.querySelector(".kitsu-live-body")) {
            lastNode.querySelector(".kitsu-live-body").innerHTML += text;
            webHistory.scrollTop = webHistory.scrollHeight;
        }
        return;
    }
    const msgDiv = document.createElement("div");
    msgDiv.style.marginBottom = "6px";
    if (role === "user" || role === "Вы") {
        msgDiv.innerHTML = `<span style="color: #9adeff; font-weight: bold;">Вы:</span> <span style="color: #ffffff;">${text}</span>`;
    } else {
        msgDiv.innerHTML = `<span style="color: #ffb3d1; font-weight: bold;">Кицуне:</span> <span style="color: #e6f0ff;">${text}</span>`;
    }
    webHistory.appendChild(msgDiv);
    webHistory.scrollTop = webHistory.scrollHeight;
};
