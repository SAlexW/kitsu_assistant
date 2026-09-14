/**
 * КИЦУНЭ — Модуль интерактива, потоковых касаний и кнопок пульта
 */
window.injectKitsuHitAreas = function(model) {
    try {
        const core = model.internalModel;
        if (core && core.setting) {
            core.setting.hitAreas = [
                { Name: "Eyes", Id: "EyeLid3" },
                { Name: "Mouth", Id: "MOpenWide" },
                { Name: "Ears", Id: "Ear1" },
                { Name: "Face", Id: "Face2" },
                { Name: "Arms", Id: "BackArm" },
                { Name: "Legs", Id: "Shin" },
                { Name: "Intimate", Id: "Boob" },
                { Name: "Body", Id: "Torso3" },
                { Name: "Tail", Id: "Tail2" },
                { Name: "TailSub", Id: "ArtMesh13" }
            ];
            if (typeof core.initHitAreas === "function") { core.initHitAreas(); }
            console.log("[WebGL ИНЖЕКТОР] Анатомическая карта GothL2D успешно внедрена в ядро.");
        }
    } catch (e) { console.warn("[ИНЖЕКТОР ОШИБКА]: " + e.message); }
};

window.setupKitsuInteractions = function(app, model) {
    let lastHitStatus = null;

    app.ticker.add(() => {
        if (!window.isLoaded || !window.live2dModel) return;
        const interaction = app.renderer.plugins.interaction;
        const mousePoint = interaction.mouse.global;
        const hitTarget = interaction.hitTest(mousePoint, window.live2dModel);
        const currentHit = hitTarget ? "auto" : "none";
        
        if (currentHit !== lastHitStatus) {
            console.log(`[AVATAR_HOVER]:${hitTarget ? "TRUE" : "FALSE"}`);
            lastHitStatus = currentHit;
        }
        app.view.style.pointerEvents = currentHit;
    });

    let isMouseDown = false;
    let mousePath = [];
    let intervalTimer = null;

    function processCurrentTouchTick() {
        if (!isMouseDown || mousePath.length === 0) return;
        const lastPoint = mousePath[mousePath.length - 1];
        const hitAreas = window.live2dModel.hitTest(lastPoint.x, lastPoint.y);
        
        if (!hitAreas || hitAreas.length === 0) { mousePath = []; return; }
        let activeZone = hitAreas[0]; 
        
        if (activeZone === "Body_Torso") {
            const localY = lastPoint.y - window.live2dModel.y;
            activeZone = (localY < -50) ? "Shoulders" : "Belly";
        }

        let totalDistance = 0;
        let directionChanges = 0;
        let lastDx = 0;

        for (let i = 1; i < mousePath.length; i++) {
            const dx = mousePath[i].x - mousePath[i-1].x;
            const dy = mousePath[i].y - mousePath[i-1].y;
            totalDistance += Math.sqrt(dx * dx + dy * dy);
            if (lastDx !== 0 && ((dx > 0 && lastDx < 0) || (dx < 0 && lastDx > 0))) directionChanges++;
            if (dx !== 0) lastDx = dx;
        }

        const intCfg = window.configData?.interact_settings || { "hold_threshold_px": 5, "stroke_threshold_px": 18 };

        let touchType = "TAP";
        if (totalDistance < intCfg.hold_threshold_px) {
            touchType = "HOLD";
        } else if (totalDistance >= intCfg.hold_threshold_px && totalDistance < intCfg.stroke_threshold_px) {
            touchType = "TAP";
        } else if (totalDistance >= intCfg.stroke_threshold_px) {
            if (directionChanges >= 2) { touchType = "SCRATCH"; } else { touchType = "STROKE"; }
        }

        let roleZone = activeZone.replace("Mesh_", "").replace("_Main", "").replace("_Sub", "");
        if (roleZone.toLowerCase().includes("thigh") || roleZone.includes("12")) roleZone = "Thighs";
        if (roleZone.toLowerCase().includes("shin") || roleZone.includes("11")) roleZone = "Shins";

        console.log(`CUBISM_HIT:${roleZone}:${touchType}`);
        mousePath = [lastPoint];
    }

    // Переменные для внутрибраузерного Drag чата (Чистый Top / Left)
    let isDraggingChat = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let chatBaseLeft = 0;
    let chatBaseTop = 0; 

    window.addEventListener('mousedown', (event) => {
        if (!window.isLoaded || !window.live2dModel || !app) return;

        const chatContainer = document.getElementById('web-chat-container');
        if (chatContainer) {
            const chatRect = chatContainer.getBoundingClientRect();
            const chatCfg = window.configData?.chat_settings || { "width": 430 };
            const chatWidth = chatCfg.width || 430;
            
            const mx = event.clientX;
            const my = event.clientY;
            
            // Проверка попадания в шапку чата (верхние 25px, левее кнопок на 120px)
            const isOnHeader = (mx >= chatRect.left && mx <= (chatRect.left + chatWidth - 120)) &&
                               (my >= chatRect.top && my <= (chatRect.top + 25));
            
            // Проверка попадания в тонкую внешнюю обводку (10px) периметра чата
            const isOnBorder = (Math.abs(mx - chatRect.left) <= 10 || Math.abs(mx - chatRect.right) <= 10 ||
                                Math.abs(my - chatRect.top) <= 10 || Math.abs(my - chatRect.bottom) <= 10) &&
                               (mx >= chatRect.left && mx <= chatRect.right && my >= chatRect.top && my <= chatRect.bottom);

            if (isOnHeader || isOnBorder) {
                isDraggingChat = true;
                dragStartX = event.clientX;
                dragStartY = event.clientY;
                
                // Фиксируем чистые координаты СВЕРХУ-ВНИЗ
                chatBaseLeft = chatRect.left;
                chatBaseTop = chatRect.top;
                
                // Временно снимаем маску Windows для идеальной плавности перетаскивания по RDP
                console.log("WINDOW_MASK_CLEAR");
                return; 
            }
        }

        const rect = app.view.getBoundingClientRect();
        const scanX = event.clientX - rect.left;
        const scanY = event.clientY - rect.top;
        
        const hitAreas = window.live2dModel.hitTest(scanX, scanY);
        if (hitAreas && hitAreas.length > 0) {
            isMouseDown = true;
            mousePath = [{ x: scanX, y: scanY }];
            const tickInterval = window.configData?.interact_settings?.tick_interval_ms || 700;
            intervalTimer = setInterval(processCurrentTouchTick, tickInterval);
        }
    });

    window.addEventListener('mousemove', (event) => {
        // Сценарий А: Перетаскивание чата по Fullscreen-экрану
        if (isDraggingChat) {
            const dx = event.clientX - dragStartX;
            const dy = event.clientY - dragStartY; 
            
            const chatContainer = document.getElementById('web-chat-container');
            if (chatContainer) {
                const newLeft = chatBaseLeft + dx;
                const newTop = chatBaseTop + dy; // Y растет сверху вниз, прибавляем дельту напрямую!
                
                chatContainer.style.left = `${newLeft}px`;
                chatContainer.style.top = `${newTop}px`;
                chatContainer.style.right = "auto"; 
                chatContainer.style.bottom = "auto"; // Полностью отвязываемся от CSS bottom
                
                // Моментально сдвигаем Кицунэ вслед за чатом (передаем true как флаг драга)
                if (typeof window.updateModelScaleAndPosition === "function") {
                    window.updateModelScaleAndPosition(newLeft, newTop, true);
                }
            }
            return;
        }

        if (!isMouseDown) return;
        const rect = app.view.getBoundingClientRect();
        mousePath.push({ x: event.clientX - rect.left, y: event.clientY - rect.top });
        
        // 🔥 УПРАВЛЯЕМЫЙ НАПРАВЛЕННЫЙ ВЗГЛЯД (Без дерганья плагина)
        // Напрямую шлем нормализованные координаты мыши во внутренние параметры Cubism Core модели
        if (window.live2dModel && window.live2dModel.internalModel) {
            const coreModel = window.live2dModel.internalModel;
            const screenWidth = window.screen.width;
            const screenHeight = window.screen.height;
            
            // Переводим пиксели экрана в диапазон [-1.0 ... 1.0] для зрачков Кицунэ
            const lookX = (event.clientX - screenWidth / 2.0) / (screenWidth / 2.0);
            const lookY = -(event.clientY - screenHeight / 2.0) / (screenHeight / 2.0); // Инвертируем Y для Cubism
            
            // Записываем напрямую в кости взгляда лисички! Она будет плавно косить глазками за мышью
            if (coreModel.coreModel) {
                coreModel.coreModel.setParameterValueById('ParamEyeBallX', lookX);
                coreModel.coreModel.setParameterValueById('ParamEyeBallY', lookY);
            }
        }
    });

    window.addEventListener('mouseup', () => {
        if (isDraggingChat) {
            isDraggingChat = false;
            const chatContainer = document.getElementById('web-chat-container');
            if (chatContainer) {
                const rect = chatContainer.getBoundingClientRect();
                if (window.configData && window.configData.chat_settings) {
                    // Жестко фиксируем финальные координаты в памяти рантайма
                    window.configData.chat_settings.live_left = rect.left;
                    window.configData.chat_settings.live_top = rect.top;
                }
            }
            
            // Драг окончен! Один раз намертво защелкиваем маску QRegion на новых координатах
            if (typeof window.updateModelScaleAndPosition === "function") {
                window.updateModelScaleAndPosition();
            }
        }
        
        if (isMouseDown) {
            isMouseDown = false;
            if (intervalTimer) { clearInterval(intervalTimer); intervalTimer = null; }
            mousePath = [];
        }
    });
};

document.addEventListener("DOMContentLoaded", () => {
    const btnOut = document.getElementById("zoom-out-btn");
    const btnIn = document.getElementById("zoom-in-btn");
    const zoomInput = document.getElementById("zoom-input-field");
    const chatInput = document.getElementById("web-input-field"); 

    // 🔥 Инициализируем системный Qt мост связи СРАЗУ при загрузке DOM дерева
    let pyBridgeInstance = null;
    if (typeof QWebChannel !== "undefined" && window.qt) {
        new QWebChannel(window.qt.webChannelTransport, function (channel) {
            pyBridgeInstance = channel.objects.pyBridge;
            console.log("[PYTHON_PRINT]:📡 [JS LOG] Нативный QWebChannel мост успешно установлен!");
        });
    }

    if (chatInput) {
        chatInput.onkeydown = function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); 
                
                const text = chatInput.value.trim();
                if (!text) return;
                
                chatInput.value = ""; 
                
                const history = document.getElementById("web-chat-history");
                if (history) {
                    history.innerHTML += `<div style="color: #fff; margin-bottom: 6px; font-family: sans-serif; opacity: 0.9;"><b>Вы:</b> ${text}</div>`;
                    history.scrollTop = history.scrollHeight;
                }
                
                // Шлем сигнал во все орудия! И через WebChannel, и через резервный console.log
                console.log("CHAT_MESSAGE:" + text); 
                
                if (pyBridgeInstance) {
                    pyBridgeInstance.send_message_to_python(text);
                }
            }
        };
    }

    if (!btnOut || !btnIn || !zoomInput) return;

    function applyNewZoomValue(percentValue) {
        let percent = parseInt(percentValue, 10);
        if (isNaN(percent)) percent = 40;

        const avatarCfg = window.configData?.avatar_settings || { "native_model_height": 2787.0, "native_model_width": 2300.0, "center_vector_x": 200 };
        const chatCfg = window.configData?.chat_settings || { "width": 430 };
        const screenHeight = window.screen.height;

        const targetWidth = avatarCfg.center_vector_x + (chatCfg.width || 430) + 40;
        const maxAllowedRightX = targetWidth - 100; 
        
        const availableWidthForHalfModel = maxAllowedRightX - avatarCfg.center_vector_x;
        const maxScaleByWidth = availableWidthForHalfModel / (avatarCfg.native_model_width / 2.0);
        
        const maxPercentLimit = Math.floor((maxScaleByWidth * avatarCfg.native_model_height / screenHeight) * 100);
        const absoluteMaxPercent = Math.min(100, maxPercentLimit);

        if (percent < 15) percent = 15;
        if (percent > absoluteMaxPercent) { percent = absoluteMaxPercent; }

        zoomInput.value = percent;

        if (window.configData && window.configData.avatar_settings) {
            window.configData.avatar_settings.scale_screen_percent = percent / 100.0;
            if (typeof window.updateModelScaleAndPosition === "function") {
                window.updateModelScaleAndPosition();
            }
        }
    }

    btnOut.addEventListener("click", (event) => {
        event.stopPropagation();
        let current = parseInt(zoomInput.value, 10) || 40;
        let target = current % 5 === 0 ? current - 5 : Math.floor(current / 5) * 5;
        applyNewZoomValue(target);
    });

    btnIn.addEventListener("click", (event) => {
        event.stopPropagation();
        let current = parseInt(zoomInput.value, 10) || 40;
        let target = current % 5 === 0 ? current + 5 : Math.ceil(current / 5) * 5;
        applyNewZoomValue(target);
    });

    zoomInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            applyNewZoomValue(zoomInput.value);
            zoomInput.blur();
        }
    });
    // 🔥 БРОНЕБОЙНЫЙ АВАРИЙНЫЙ РУБИЛЬНИК НА СТОРОНЕ JAVASCRIPT
    // Ловит нажатие клавиши ESC в любой точке полноэкранного Chromium и мгновенно гасит Питон!
    window.addEventListener('keydown', (event) => {
        if (event.key === "Escape" || event.key === "Esc") {
            console.log("EXIT_COMMAND");
        }
    });
}); // Конец DOMContentLoaded

