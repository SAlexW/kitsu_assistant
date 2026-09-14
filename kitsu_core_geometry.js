// kitsu_core_geometry.js — ТРАССИРОВОЧНЫЙ ЛОГГЕР ЖИЗНЕННОГО ЦИКЛА МОДЕЛИ
console.log("🌐 [БРАУЗЕР LOG] Инициализацияkits_core_geometry.js запущена.");

window.updateModelScaleAndPosition = function() {
    if (!window.live2dModel) {
        console.log("🌐 [БРАУЗЕР LOG] ❌ [КРИТИЧЕСКИЙ СБОЙ]: window.live2dModel еще не существует в памяти!");
        return;
    }

    console.log("🌐 [БРАУЗЕР LOG] >>> [ШАГ 1]: Функция updateModelScaleAndPosition вызвана.");

    // 1. Проверяем состояние нашего пульта зума
    let targetZoomPercent = 70;
    if (window.kitsuChatState && window.kitsuChatState.currentZoomPercent) {
        targetZoomPercent = window.kitsuChatState.currentZoomPercent;
        console.log("🌐 [БРАУЗЕР LOG] [ШАГ 2]: Взят масштаб из kitsuChatState: " + targetZoomPercent + "%");
    } else {
        console.log("🌐 [БРАУЗЕР LOG] [ШАГ 2]: ВНИМАНИЕ: kitsuChatState не готов. Используем дефолт 70%.");
    }

    // 2. Рассчитываем коэффициент масштабирования PixiJS
    let finalScale = Number(Math.round(targetZoomPercent / 100 + 'e2') + 'e-2');
    
    // 🔥 БРОНЕБОЙНАЯ ЗАЩИТА ОТ ВЕЛИКАНА (Фикс перекрытия чата):
    // Если по каким-то причинам масштаб получился нулевым, ломаным или нативным (1.0),
    // мы насильно срезаем его до безопасного адаптивного коэффициента 0.18, 
    // чтобы гигантское полотно физически не могло накрыть кнопки чата!
    if (finalScale >= 1.0 || isNaN(finalScale) || finalScale <= 0) {
        console.log("🌐 [БРАУЗЕР LOG] ⚠️ [МАСШТАБНЫЙ АЛАРМ]: Коэффициент равен " + finalScale + ". Защита активирована! Насильно выставляем сейв-лимит 0.18!");
        finalScale = 0.18; 
    }

    // Применяем масштаб к модели
    window.live2dModel.scale.set(finalScale);
    console.log("🌐 [БРАУЗЕР LOG] [ШАГ 3]: МАСШТАБ ПРИМЕНЕН К live2dModel: " + finalScale);

    // Передаем ход позиционированию координат
    if (typeof window.syncModelPositionWithChat === "function") {
        window.syncModelPositionWithChat();
    } else {
        console.log("🌐 [БРАУЗЕР LOG] ❌ [ОШИБКА]: Функция syncModelPositionWithChat отсутствует!");
    }
};

// Снайперская привязка к крыше чата
window.syncModelPositionWithChat = function() {
    if (!window.live2dModel) return;

    console.log("🌐 [БРАУЗЕР LOG] >>> [ШАГ 4]: Вызвана синхронизация координат syncModelPositionWithChat.");

    const chatContainer = document.getElementById("web-chat-container");
    if (!chatContainer) {
        console.log("🌐 [БРАУЗЕР LOG] ❌ [ОШИБКА]: #web-chat-container не найден в DOM дереве страницы!");
        return;
    }

    let cx = chatContainer.offsetLeft;
    let cy = chatContainer.offsetTop;
    console.log("🌐 [БРАУЗЕР LOG] [ШАГ 5]: Физическая позиция чата в DOM: left=" + cx + ", top=" + cy);

    // Сажаем Лисичку строго на правый угол крыши чата
    let foxTargetX = cx + 320 + 141;
    let foxTargetY = cy - 40 + 216;

    window.live2dModel.position.set(foxTargetX, foxTargetY);
    
    if (window.live2dModel.update) {
        window.live2dModel.update(0.016);
    }
    console.log("🌐 [БРАУЗЕР LOG] ✅ [ШАГ 6]: ФИНАЛ. Моделька успешно посажена в координаты: " + foxTargetX + "x" + foxTargetY);
};
