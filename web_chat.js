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
function updateKitsuAvatarPosition() {
    // Вызываем единую позиционную функцию из kitsu_core_geometry.js
    if (typeof window.kitsuApplyPosition === 'function') {
        window.kitsuApplyPosition();
    } else if (typeof window.syncModelPositionWithChat === 'function') {
        window.syncModelPositionWithChat();
    }

    // Синхронизируем маску оверлея Qt (QRegion) с Python
    syncRealRegionsToPython();
}

// РЕГУЛИРОВКА КРАТНОГО ЗУМА (Иерархия кадров)
function adjustZoom(directionStep) {

    let zoomInput = document.getElementById('kitsu-zoom-input');
    if (!zoomInput) return;

    let currentVal = parseInt(zoomInput.value) || 70;
    let newVal = currentVal + directionStep;

    // Границы масштабирования (10% - 200%)
    newVal = Math.max(10, Math.min(200, newVal));
    zoomInput.value = newVal;

    // Вызываем единый расчёт масштаба из kitsu_core_geometry.js
    if (typeof window.kitsuApplyScale === 'function') {
        window.kitsuApplyScale(newVal);
    } else if (typeof window.updateModelScaleAndPosition === 'function') {
        window.updateModelScaleAndPosition(newVal);
    }
}

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

            // Твоя зажатая в замок формула стержня Минковского
            let lockedStrokeX = Math.max(Math.min(currentMouseX, Xallowed_max), Xallowed_min);
            let lockedStrokeY = Math.max(Math.min(currentMouseY, Yallowed_max), Yallowed_min);

            let finalLeft = lockedStrokeX - distLeft;
            let finalTop = lockedStrokeY - distTop + 40; 

            chatContainer.style.left = finalLeft + "px";
            chatContainer.style.top = finalTop + "px";
            chatContainer.style.bottom = "auto";

            // 🔥 СНАЙПЕРСКИЙ ФИКС ЛОВУШКИ: Заменили старый round() на нативный Math.round!
            // Теперь JavaScript больше не падает в обморок, масштаб применяется мгновенно!
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
