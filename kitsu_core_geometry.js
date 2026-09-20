// kitsu_core_geometry.js — УНИВЕРСАЛЬНОЕ АЛГОРИТМИЧЕСКОЕ ЯДРО ГЕОМЕТРИИ
console.log("🌐 [БРАУЗЕР LOG] Универсальное ядро геометрии Kitsune успешно запущено.");

// 1. ФУНКЦИЯ МАСШТАБИРОВАНИЯ (Single Source of Truth для размеров)
window.kitsuApplyScale = function(zoomPercent) {
    if (!window.live2dModel) return;

    console.log("🌐 [БРАУЗЕР LOG] >>> [МАСШТАБАТОР]: Вызвана функция kitsuApplyScale на " + zoomPercent + "%");

    // Жесткий аварийный дефолт по ТЗ — 40% от экрана, если параметры не переданы
    let targetPercent = zoomPercent || 40;
    
    // Нативная высота меша и живая высота экрана от Windows (твои 860px)
    let nativeModelHeight = 2787;
    let windowHeight = (window.kitsuScreenLimits && window.kitsuScreenLimits.bottom) || 860;

    // Рассчитываем, сколько целевых пикселей экрана должна занимать модель
    let targetPixelHeight = windowHeight * (targetPercent / 100);

    // Вычисляем ИСТИННЫЙ коэффициент масштабирования для PixiJS
    let finalScale = targetPixelHeight / nativeModelHeight;
    finalScale = Math.round((finalScale + Number.EPSILON) * 100) / 100;

    // Защитный Clamp предохранитель
    if (finalScale <= 0 || isNaN(finalScale)) finalScale = 0.18;

    // Применяем масштаб к модели один раз намертво!
    window.live2dModel.scale.set(finalScale);
    console.log("🌐 [БРАУЗЕР LOG] [ЯДРО МАСШТАБА]: Коэффициент " + finalScale + " успешно применен к live2dModel.");

    // Вешаем функциональный замок: перезаписываем настройки плагина, чтобы ядро не бунтовало
    if (window.kitsuConfig && window.kitsuConfig.avatar_settings) {
        window.kitsuConfig.avatar_settings.native_model_height = nativeModelHeight;
        window.kitsuConfig.avatar_settings.scale_screen_percent = finalScale;
    }

    // После изменения роста — принудительно вызываем чистый сдвиг координат!
    window.kitsuApplyPosition();
};

// 2. ФУНКЦИЯ ПОЗИЦИОНИРОВАНИЯ (Лёгкий и сверхбыстрый сдвиг по осям)
window.kitsuApplyPosition = function() {
    if (!window.live2dModel) return;

    const chatContainer = document.getElementById("web-chat-container");
    if (!chatContainer) return;

    // Снимаем точнейшие физические координаты чата на экране
    const chatRect = chatContainer.getBoundingClientRect();
    let cx = Math.round(chatRect.left);
    let cy = Math.round(chatRect.top);

    // Сажаем Лисичку строго на правый угол крыши чата (Смещение anchor 0.5)
    let foxTargetX = cx + 320 + 141;
    let foxTargetY = cy - 40 + 216;

    // Мгновенно переставляем модель внутри сцены PixiJS без лишних вычислений масштаба!
    window.live2dModel.position.set(foxTargetX, foxTargetY);
    
    if (window.live2dModel.update) {
        window.live2dModel.update(0.016); // Прокачиваем физику наклона
    }
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
