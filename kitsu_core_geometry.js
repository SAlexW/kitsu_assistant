/**
 * КИЦУНЭ — Модуль геометрии (Финальная Fullscreen-стабилизация)
 */
window.updateModelScaleAndPosition = function(forcedLeft, forcedTop, isDragging, force_apply) {
    if (!window.isLoaded || !window.live2dModel || !window.pixiApp) {
        return;
    }
    
    // 🔥 ЗАЩИТА ОТ UNDEFINED: Если параметры не переданы (например, при resize), 
    // принудительно делаем их безопасными false/undefined!
    if (isDragging === undefined) isDragging = false;
    if (force_apply === undefined) force_apply = false;
    
    const avatarCfg = window.configData ? window.configData.avatar_settings : { "native_model_height": 2787.0, "native_model_width": 2300.0, "center_vector_x": 200, "scale_screen_percent": 0.40 };
    const chatCfg = window.configData ? window.configData.chat_settings : { "width": 430, "height": 200, "input_height": 35 };
    
    // Считываем реальные физические пиксели твоего монитора
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    
    // Принудительно растягиваем WebGL-контекст PixiJS под полный экран,
    // чтобы убрать любые обрезки холста!
    window.pixiApp.renderer.resize(screenWidth, screenHeight);
    
    const currentScalePercent = avatarCfg.scale_screen_percent || 0.40;
    const chatWidth = chatCfg.width || 430;
    const chatHeight = (chatCfg.height || 200) + (chatCfg.input_height || 35) + 45; 
    
    // 1. Позиция чата на Fullscreen-экране (по умолчанию в правый нижний угол монитора)
    let chatLeft = forcedLeft !== undefined ? forcedLeft : (chatCfg.live_left !== undefined ? chatCfg.live_left : (screenWidth - chatWidth - 15));
    let chatTop = forcedTop !== undefined ? forcedTop : (chatCfg.live_top !== undefined ? chatCfg.live_top : (screenHeight - chatHeight - 15));
    
    const chatContainer = document.getElementById('web-chat-container');
    if (chatContainer) {
        chatContainer.style.position = "absolute";
        chatContainer.style.left = `${chatLeft}px`;
        chatContainer.style.top = `${chatTop}px`;
        chatContainer.style.right = "auto";  
        chatContainer.style.bottom = "auto"; 
    }
    
    // =========================================================================
    // 🧮 ФИНАЛЬНАЯ АВТО-ФОРМУЛА ПОСАДКИ (БЕЗ ХАРДКОДА И ТВЕЙКОВ)
    // =========================================================================
    window.live2dModel.scale.set((screenHeight * currentScalePercent) / avatarCfg.native_model_height);
    window.live2dModel.x = chatLeft; 
    
    // Линейная компенсация расширения холста: каждые +5% зума сдвигают модель вниз на 1 пиксель.
    const autoPixelTweak = -20.0 * currentScalePercent + 3.0;
    
    // Привязываем Y-координату модели напрямую к живой крыше чата
    window.live2dModel.y = chatTop + autoPixelTweak;
    
    console.log(`[ГЕОМЕТРИЯ] Масштаб: ${(currentScalePercent * 100).toFixed(0)}% | Авто-Tweak: ${autoPixelTweak.toFixed(1)}px -> Итоговый Y: ${window.live2dModel.y.toFixed(1)}px`);
    
    // =========================================================================
    // 🎭 ТОЧНЫЙ РАСЧЕТ МАСКИ ИЗ РЕАЛЬНЫХ ГАБАРИТОВ БРАУЗЕРА
    // =========================================================================
    const chatRect = chatContainer ? chatContainer.getBoundingClientRect() : { left: chatLeft, top: chatTop, width: chatWidth, height: chatHeight };
    
    const chatX = Math.round(chatRect.left);
    const chatY = Math.round(chatRect.top);
    const chatW = Math.round(chatRect.width);
    const chatH = Math.round(chatRect.height);
    
    const modelBounds = window.live2dModel.getBounds();
    const modelX = Math.round(modelBounds.x);
    const modelY = Math.round(modelBounds.y);
    const modelW = Math.round(modelBounds.width);
    const modelH = Math.round(modelBounds.height);
    
    // Стреляем маской в Питон только если мы НЕ в режиме драга, ИЛИ если принудительно вызван триггер окончания фразы!
    if (!isDragging || force_apply) {
        console.log(`WINDOW_MASK:${chatX}:${chatY}:${chatW}:${chatH}:${modelX}:${modelY}:${modelW}:${modelH}`);
    }
};

window.updateModelScaleAndPosition();