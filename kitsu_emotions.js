// kitsu_emotions.js — ВЫДЕЛЕННЫЙ МОДУЛЬ МИМИКИ, ИНЕРЦИИ ХУДИ И ПАРСИНГА ИИ-ТЕГОВ
console.log("[JS MODULE] Выделенный модуль эмоций и маскировки успешно подключен!");

let currentSliders = { eyeOpen: 1.0, browY: 0.0, browForm: 0.0, mouthForm: 0.0 };
let targetSliders = { eyeOpen: 1.0, browY: 0.0, browForm: 0.0, mouthForm: 0.0 };

let blinkEyeScale = 1.0; 
let isBlinking = false;

let isLaughing = false;
let laughTimer = 0;

// ПАРАМЕТРЫ ПЛАВНОГО СКРЫТИЯ УШЕК И ХВОСТА
let targetDetailsAlpha = 1.0;  // 1.0 — видны, 0.0 — полностью скрыты
let currentDetailsAlpha = 1.0;
const kitsuDetailIds = ["Ear1", "Tail2", "ArtMesh13", "Ear3"];

let isCustomBlinkingAction = false;

// 🔥 ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ КИНЕМАТИКИ И ИНЕРЦИИ ТЕЛА (LERP)
window.kitsuPhysics = {
    currentAngleX: 0.0,
    currentBodyX: 0.0,
    targetAngleX: 0.0,
    targetBodyX: 0.0,
    attentionActive: false,
    lastMouseX: 0,
    lastMouseY: 0,
    attentionTimer: null
};

window.triggerKitsuBlinkAction = function() {
    console.log("[JS LOG] >>> АКТИВАЦИЯ АНИМАЦИИ ПОДМИГИВАНИЯ ГЛАЗОМ! <<<");
    isCustomBlinkingAction = true;
    setTimeout(() => {
        isCustomBlinkingAction = false;
    }, 400);
};

function triggerNaturalBlink() {
    if (!window.isLoaded || targetSliders.eyeOpen === 0.0 || isLaughing) {
        setTimeout(triggerNaturalBlink, 2000);
        return;
    }
    isBlinking = true;
    blinkEyeScale = 0.0;
    setTimeout(() => {
        blinkEyeScale = 1.0;
        isBlinking = false;
        setTimeout(triggerNaturalBlink, 2000 + Math.random() * 3000);
    }, 120);
}

// ГЛАВНЫЙ ИНТЕРПОЛЯТОР ОБНОВЛЕНИЯ КОСТЕЙ И ТЕКСТУР
function registerKitsuAnimationTicker(model, app) {
    setTimeout(triggerNaturalBlink, 2000);

    // Подключаем фоновый обработчик резких рывков мыши для переключения внимания
    window.addEventListener('mousemove', (event) => {
        const kp = window.kitsuPhysics;
        const dx = Math.abs(event.clientX - kp.lastMouseX);
        const dy = Math.abs(event.clientY - kp.lastMouseY);
        const mouseSpeed = dx + dy;
        
        kp.lastMouseX = event.clientX;
        kp.lastMouseY = event.clientY;

        // Если пользователь резко дернул мышкой — Кицунэ переключает внимание на курсор
        if (mouseSpeed > 120 && !kp.attentionActive) {
            console.log("[ИИ-ВЗГЛЯД] Резкое движение! Кицунэ переключила внимание на курсор.");
            kp.attentionActive = true;
            
            if (kp.attentionTimer) clearTimeout(kp.attentionTimer);
            kp.attentionTimer = setTimeout(() => {
                kp.attentionActive = false;
            }, 4000); // Через 4 секунды покоя взгляд возвращается в центр
        }

        if (kp.attentionActive) {
            const screenWidth = window.screen.width;
            // Рассчитываем углы поворота головы и туловища [-30..30]
            kp.targetAngleX = ((event.clientX - screenWidth / 2.0) / (screenWidth / 2.0)) * 30.0;
            kp.targetBodyX = ((event.clientX - screenWidth / 2.0) / (screenWidth / 2.0)) * 12.0; 
        } else {
            kp.targetAngleX = 0.0;
            kp.targetBodyX = 0.0;
        }
        
        // УПРАВЛЯЕМЫЙ НАПРАВЛЕННЫЙ ВЗГЛЯД ЗРАЧКОВ (В кости Live2D напрямую)
        if (window.live2dModel && window.live2dModel.internalModel?.coreModel) {
            const coreModel = window.live2dModel.internalModel.coreModel;
            const screenWidth = window.screen.width;
            const screenHeight = window.screen.height;
            const lookX = (event.clientX - screenWidth / 2.0) / (screenWidth / 2.0);
            const lookY = -(event.clientY - screenHeight / 2.0) / (screenHeight / 2.0);
            coreModel.setParameterValueById('ParamEyeBallX', lookX);
            coreModel.setParameterValueById('ParamEyeBallY', lookY);
        }
    });

    app.ticker.add((delta) => {
        if (!window.isLoaded || !model.internalModel || !model.internalModel.coreModel) return;

        try {
            const core = model.internalModel.coreModel;
            const kp = window.kitsuPhysics;

            // === ОБРАБОТКА МИКРО-АНИМАЦИИ СМЕХА ===
            let laughBodyY = 0;
            if (isLaughing) {
                laughTimer += delta * 0.4;
                laughBodyY = Math.sin(laughTimer) * 10.0;
                window.avatarState.targetMouthOpenY = 1.0;
                window.avatarState.targetMouthFormX = 1.0;
                targetSliders.eyeOpen = 0.1;
                targetSliders.browY = 0.4;
                targetSliders.browForm = 0.3;
            }

            // ПРИМЕНЯЕМ ЛИПСИНК И СГЛАЖИВАНИЕ ФИЗИКИ ТЕЛА (LERP)
            kp.currentAngleX += (kp.targetAngleX - kp.currentAngleX) * 0.10; // Голова шустрее
            kp.currentBodyX += (kp.targetBodyX - kp.currentBodyX) * 0.04;   // Ткань худи с инерцией
            
            core.setParameterValueById('ParamAngleX', kp.currentAngleX);
            core.setParameterValueById('ParamBodyAngleX', kp.currentBodyX);

            // 1. ПРИМЕНЯЕМ ЛИПСИНК РТА
            core.setParameterValueById("ParamMouthOpenY", window.avatarState.targetMouthOpenY);
            currentSliders.mouthForm += (window.avatarState.targetMouthFormX - currentSliders.mouthForm) * 0.25;
            core.setParameterValueById("ParamMouthForm", currentSliders.mouthForm);

            // 2. ПЛАВНАЯ ИНТЕРПОЛЯЦИЯ LERP ДЛЯ БРОВЕЙ И ГЛАЗ
            currentSliders.eyeOpen += (targetSliders.eyeOpen - currentSliders.eyeOpen) * 0.15;
            currentSliders.browY += (targetSliders.browY - currentSliders.browY) * 0.15;
            currentSliders.browForm += (targetSliders.browForm - currentSliders.browForm) * 0.15;

            let finalEyeOpen = currentSliders.eyeOpen * blinkEyeScale;

            // 3. ФОРСИРОВАНИЕ ЭМОЦИЙ
            core.setParameterValueById("ParamEyeROpen", finalEyeOpen);
            core.setParameterValueById("ParamBrowLY", currentSliders.browY);
            core.setParameterValueById("ParamBrowRY", currentSliders.browY);
            core.setParameterValueById("ParamBrowLForm", currentSliders.browForm);
            core.setParameterValueById("ParamBrowRForm", currentSliders.browForm);

            if (isLaughing) {
                core.setParameterValueById("ParamBodyAngleY", laughBodyY);
            }

            // === ПЛАВНЫЙ LERP АЛЬФА-КАНАЛА ДЛЯ МАСКИРОВКИ УШЕК И ХВОСТА ===
            if (currentDetailsAlpha !== targetDetailsAlpha) {
                currentDetailsAlpha += (targetDetailsAlpha - currentDetailsAlpha) * 0.1;
                kitsuDetailIds.forEach(id => {
                    if (model.internalModel.drawables && model.internalModel.idIndexMap[id] !== undefined) {
                        const meshIndex = model.internalModel.idIndexMap[id];
                        model.internalModel.drawables[meshIndex].opacity = currentDetailsAlpha;
                    }
                });
            }
			
			if (isCustomBlinkingAction) {
				core.setParameterValueById("ParamEyeLOpen", 0.0); 
			} else {
				core.setParameterValueById("ParamEyeLOpen", finalEyeOpen); 
			}

        } catch (e) { /* игнорируем микро-сбои */ }
    });
}

// === ИНТЕРФЕЙС ПРИЕМА КОМАНД ЭМОЦИЙ ===
window.setKitsuEmotion = function(emotion) {
    if (isLaughing) return;
    console.log("[JS LOG] Эмоция изменена на: " + emotion);

    if (emotion === "JOY") {
        targetSliders.eyeOpen = 1.0;
        targetSliders.browY = 0.0;
        targetSliders.browForm = 0.0;
    } else if (emotion === "SAD") {
        targetSliders.eyeOpen = 0.65;  
        targetSliders.browY = -0.3;   
        targetSliders.browForm = -1.0; 
    } else if (emotion === "ANGRY") {
        targetSliders.eyeOpen = 0.90; 
        targetSliders.browY = -0.4;   
        targetSliders.browForm = 1.0;  
    } else if (emotion === "SURPRISE") {
        targetSliders.eyeOpen = 1.4;   
        targetSliders.browY = 0.7;    
        targetSliders.browForm = 0.1;
    } else if (emotion === "PATTED") {
        targetSliders.eyeOpen = 0.0;   
        targetSliders.browY = 0.3;
        targetSliders.browForm = 0.5;
    }
};

window.toggleKitsuDetails = function(isVisible) {
    console.log("[JS LOG] Команда маскировки ушек и хвоста. Видимость: " + isVisible);
    targetDetailsAlpha = isVisible ? 1.0 : 0.0;
};

window.triggerKitsuLaugh = function() {
    console.log("[JS LOG] >>> АКТИВАЦИЯ МИКРО-АНИМАЦИИ СМЕХА! <<<");
    isLaughing = true;
    laughTimer = 0;
    setTimeout(() => {
        isLaughing = false;
        window.setKitsuEmotion("JOY");
    }, 900);
};

// 🔥 ЯВНАЯ ГЛОБАЛЬНАЯ РЕГИСТРАЦИЯ ДЛЯ ЯДРА CHROMIUM
window.processKitsuResponse = processKitsuResponse;

function processKitsuResponse(rawText) {
    if (!rawText) return;
    let cleanText = rawText;

    // 1. Сканируем маркеры настроения с защитой от их отсутствия
    let activeEmotion = "JOY"; 
    if (cleanText.includes("[JOY]")) { activeEmotion = "JOY"; cleanText = cleanText.replace("[JOY]", ""); }
    else if (cleanText.includes("[SAD]")) { activeEmotion = "SAD"; cleanText = cleanText.replace("[SAD]", ""); }
    else if (cleanText.includes("[ANGRY]")) { activeEmotion = "ANGRY"; cleanText = cleanText.replace("[ANGRY]", ""); }
    else if (cleanText.includes("[SURPRISE]")) { activeEmotion = "SURPRISE"; cleanText = cleanText.replace("[SURPRISE]", ""); }

    // Активируем мимику лица
    if (typeof window.setKitsuEmotion === "function") window.setKitsuEmotion(activeEmotion);

    if (cleanText.toLowerCase().includes("хи-хи") || cleanText.toLowerCase().includes("ха-ха")) {
        if (typeof window.triggerKitsuLaugh === "function") window.triggerKitsuLaugh();
    }

    // 2. Сканируем тумблер скрытия деталей (ушек и хвоста) без изменений...
    if (cleanText.includes("[HIDE_TAIL]")) {
        cleanText = cleanText.replace("[HIDE_TAIL]", "");
        if (typeof window.toggleKitsuDetails === "function") window.toggleKitsuDetails(false); 
    }
    if (cleanText.includes("[SHOW_TAIL]")) {
        cleanText = cleanText.replace("[SHOW_TAIL]", "");
        if (typeof window.toggleKitsuDetails === "function") window.toggleKitsuDetails(true);  
    }

    if (cleanText.includes("[BLINK]")) {
        cleanText = cleanText.replace("[BLINK]", "");
        if (typeof window.triggerKitsuBlinkAction === "function") window.triggerKitsuBlinkAction(); 
    }

    cleanText = cleanText.trim();

    if (isReactiveMode) {
        return; 
    }

    // 4. Печатаем очищенный от тегов текст в историю сообщений чата
    const history = document.getElementById("web-chat-history");
    if (history) {
        history.innerHTML += `<div style="color: #e6f0ff; margin-bottom: 6px; font-family: sans-serif; text-shadow: 0 1px 3px rgba(0,0,0,0.5);"><b>Кицу:</b> ${cleanText}</div>`;
        history.scrollTop = history.scrollHeight;
        
        // Пересчитываем QRegion маску Windows под новые размеры истории сообщений
        if (typeof window.updateModelScaleAndPosition === "function") {
            window.updateModelScaleAndPosition();
        }
    }
}
