// kitsu_core_geometry.js — ЭКРАННЫЙ МАТЕМАТИЧЕСКИЙ МАСШТАБАТОР КИЦУНЭ
console.log("🌐 [БРАУЗЕР LOG] Инициализацияkits_core_geometry.js с экраном 1440x900.");

window.updateModelScaleAndPosition = function() {
    if (!window.live2dModel) return;

    // 1. Считываем живые проценты зума из нашего пульта (по дефолту 70%)
    let userZoomPercent = 70;
    if (window.kitsuChatState && window.kitsuChatState.currentZoomPercent) {
        userZoomPercent = window.kitsuChatState.currentZoomPercent;
    }

    // 2. 🔥 ТВОЯ ЭКРАННАЯ МАТЕМАТИКА (Фикс великана):
    // Нативная высота меша Лисички от художника — 2787 пикселей.
    // Живая высота рабочей зоны твоего монитора — 860 пикселей (из лога Windows).
    let nativeModelHeight = 2787;
    let windowHeight = (window.kitsuScreenLimits && window.kitsuScreenLimits.bottom) || 860;

    // Высчитываем, сколько пикселей на экране должна ЗАНИМАТЬ Лисичка согласно пульту зума
    // Например: 860 * (70 / 100) = 602 пикселя высоты на экране!
    let targetPixelHeight = windowHeight * (userZoomPercent / 100);

    // Вычисляем ИСТИННЫЙ коэффициент масштабирования для PixiJS ядра:
    // Делим целевые пиксели экрана на гигантские пиксели художника: 602 / 2787 = ~0.21!
    let finalScale = targetPixelHeight / nativeModelHeight;

    // Округляем до сотых долей для стабильности WebGL матриц
    finalScale = Math.round((finalScale + Number.EPSILON) * 100) / 100;

    // Предохранитель от критических сбоев
    if (finalScale <= 0 || isNaN(finalScale)) finalScale = 0.18;

    // Накладываем жестко рассчитанный коэффициент на модель
    window.live2dModel.scale.set(finalScale);
    console.log("🌐 [БРАУЗЕР LOG] [ЭKРАННЫЙ ЗУМ УСПЕХ]: К live2dModel применен коэффициент: " + finalScale + " под высоту экрана " + windowHeight);

    // Передаем ход позиционированию координат на крыше чата
    if (typeof window.syncModelPositionWithChat === "function") {
        window.syncModelPositionWithChat();
    }
};

window.syncModelPositionWithChat = function() {
    if (!window.live2dModel) return;

    const chatContainer = document.getElementById("web-chat-container");
    if (!chatContainer) return;

    let cx = chatContainer.offsetLeft;
    let cy = chatContainer.offsetTop;

    // Сажаем Лисичку строго на правый угол крыши чата (Размеры маски 282x432)
    let foxTargetX = cx + 320 + 141;
    let foxTargetY = cy - 40 + 216;

    window.live2dModel.position.set(foxTargetX, foxTargetY);
    
    if (window.live2dModel.update) {
        window.live2dModel.update(0.016); // Включаем инерцию наклона
    }
};
