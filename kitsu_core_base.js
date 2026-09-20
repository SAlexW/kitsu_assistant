/**
 * КИЦУНЭ — Базовый модуль рантайма (Глобальные переменные)
 */
window.avatarState = { 
    targetMouthOpenY: 0.0, 
    targetMouthFormX: 0.0 
};

window.pixiApp = null;
window.live2dModel = null;
window.isLoaded = false;
window.configData = null;

window.setAdvancedLipsync = function(openY, formX) {
    if (window.avatarState) {
        window.avatarState.targetMouthOpenY = openY;
        window.avatarState.targetMouthFormX = formX;
    }
};

window.loadConfigAndStart = async function() {
    try {
        // Загрузка с обходом кэша браузера
        const response = await fetch('config.json?v=' + Date.now());
        window.configData = await response.json();
        console.log("[CONFIG_SYNC]: Настройки загружены:", JSON.stringify(window.configData));
        
        if (typeof window.applyWebChatStyles === "function") {
            window.applyWebChatStyles(window.configData.chat_settings);
        }
        
        // Нормализация значения scale_screen_percent (0.0 ... 1.0)
        const rawScale = window.configData.avatar_settings?.scale_screen_percent;
        const normalizedScale = window.normalizeKitsuScalePercent(rawScale);
        window.kitsuCurrentZoomFloat = normalizedScale;

        // На пульт выводим целочисленные проценты (например, 30)
        const displayPercent = Math.round(normalizedScale * 100);
        const zoomInput = document.getElementById("zoom-input-field") || document.getElementById("kitsu-zoom-input");
        if (zoomInput) {
            zoomInput.value = displayPercent;
        }

        if (typeof window.initLive2D === "function") {
            window.initLive2D();
        }
    } catch (err) {
        console.warn("⚠️ Ошибка загрузки config.json, фоллбэк:", err);
        window.configData = {
            "avatar_settings": { "native_model_height": 2787.0, "native_model_width": 2300.0, "center_vector_x": 320, "scale_screen_percent": 0.25 },
            "chat_settings": { "width": 480, "height": 350, "input_height": 35 },
            "app_settings": { "total_width": 1920, "total_height": 1080 }
        };
        window.kitsuCurrentZoomFloat = 0.25;
        if (typeof window.initLive2D === "function") { window.initLive2D(); }
    }
};