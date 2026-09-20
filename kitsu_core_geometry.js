// kitsu_core_geometry.js — УНИВЕРСАЛЬНОЕ АЛГОРИТМИЧЕСКОЕ ЯДРО ГЕОМЕТРИИ
console.log("🌐 [БРАУЗЕР LOG] Универсальное ядро геометрии Kitsune успешно запущено.");

// 🔥 Глобальная функция нормализации масштаба (0.0 ... 1.0)
window.normalizeKitsuScalePercent = function(rawVal) {
    let num = parseFloat(rawVal);
    if (isNaN(num)) num = 0.25;
    // Если случайно передали 25 вместо 0.25 — переводим в 0.25
    if (num > 1.0 && num <= 100.0) num = num / 100.0;
    // Жесткое зажатие в диапазон [0.0, 1.0]
    return Math.min(Math.max(num, 0.0), 1.0);
};

// 🔥 Применение математического масштаба от высоты экрана
window.kitsuApplyScale = function(zoomPercent) {
    if (!window.live2dModel) return;

    // 1. Приводим к строгому диапазону 0.0 - 1.0
    const scaleFactor = window.normalizeKitsuScalePercent(zoomPercent);
    window.kitsuCurrentZoomFloat = scaleFactor; // Сохраняем истинный дробный масштаб

    // 2. Получаем геометрию рабочего стола и модели
    const desktopHeight = window.configData?.app_settings?.total_height || window.innerHeight || 860;
    const nativeModelHeight = window.configData?.avatar_settings?.native_model_height || 2787.0;

    // 3. Формула: (Высота Экрана * Коэффициент) / Нативный Рост
    const finalScale = (desktopHeight * scaleFactor) / nativeModelHeight;

    // 4. Применяем только математический finalScale (никаких прямых 0.30!)
    window.live2dModel.scale.set(finalScale);

    console.log(`[ЯДРО МАСШТАБА]: Коэффициент экрана ${scaleFactor} (${Math.round(scaleFactor * 100)}%) -> finalScale: ${finalScale.toFixed(4)}`);
};

// 🔥 Позиционирование модели относительно чата (БЕЗ ВЫЗОВА kitsuApplyScale!)
window.kitsuApplyPosition = function() {
    if (!window.live2dModel) return;
    const chatContainer = document.getElementById("main-chat-container") || document.querySelector(".chat-container");
    if (!chatContainer) return;

    const rect = chatContainer.getBoundingClientRect();
    
    // Смещение Лисички к правому верхнему углу чата
    const offsetX = window.configData?.avatar_settings?.center_vector_x || 320;
    const offsetY = -40;

    // Привязываем X и Y строго к живым координатам чата
    window.live2dModel.x = rect.left + offsetX;
    window.live2dModel.y = rect.top + offsetY;
};

// Оставляем оригинальное имя функции для совместимости со старыми вызовами ядра,
// но полностью перенаправляем её внутрь нашего нового Универсального Масштабатора!
window.updateModelScaleAndPosition = function() {
    let currentPercent = 40; // Стартовый дефолт 40%
    if (window.kitsuChatState && window.kitsuChatState.currentZoomPercent) {
        currentPercent = window.kitsuChatState.currentZoomPercent;
    }
    window.kitsuApplyScale(currentPercent);
};
