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
        const response = await fetch('config.json');
        window.configData = await response.json();
        console.log("[CONFIG_SYNC]:" + JSON.stringify(window.configData));
        
        if (typeof window.applyWebChatStyles === "function") {
            window.applyWebChatStyles(window.configData.chat_settings);
        }
		
        const initialPercent = Math.round((window.configData.avatar_settings?.scale_screen_percent || 0.40) * 100);
        const zoomInput = document.getElementById("zoom-input-field");
        if (zoomInput) {
            zoomInput.value = initialPercent;
        }        
        if (typeof window.initLive2D === "function") {
            window.initLive2D();
        }
    } catch (err) {
        console.warn("⚠️ Применены дефолтные настройки:", err);
        window.configData = {
            "avatar_settings": { "native_model_height": 2787.0, "native_model_width": 2300.0, "center_vector_x": 200, "scale_screen_percent": 0.40 },
            "chat_settings": { "width": 430, "height": 200, "input_height": 35 },
            "app_settings": { "total_width": 900, "total_height": 700 }
        };
        if (typeof window.initLive2D === "function") { window.initLive2D(); }
        if (typeof window.applyWebChatStyles === "function") { window.applyWebChatStyles(window.configData.chat_settings); }
        const zoomInput = document.getElementById("zoom-input-field");
        if (zoomInput) zoomInput.value = 40;
    }
};
