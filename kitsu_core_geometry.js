// kitsu_core_geometry.js — ЧАСТЬ 1: СИНХРОНИЗАЦИЯ ЗУМА С ПУЛЬТОМ ЧАТА

window.updateModelScaleAndPosition = function() {
    if (!window.live2dModel) return;

    console.log("[ГЕОМЕТРИЯ ЯДРА] >>> Вызван автоматический пересчет масштаба Лисички.");

    // 🔥 ПРИВЯЗКА К НАШЕМУ ПУЛЬТУ:
    // Вместо слепого деления старой высоты чата 500 на 2700, мы берем живые проценты
    // из нашего отполированного окошка зума (по дефолту 70%)!
    let targetZoomPercent = 70;
    if (window.kitsuChatState && window.kitsuChatState.currentZoomPercent) {
        targetZoomPercent = window.kitsuChatState.currentZoomPercent;
    }

    // Переводим проценты пульта в дробный коэффициент масштаба PixiJS (например, 70% -> 0.70)
    let finalScale = Number(Math.round(targetZoomPercent / 100 + 'e2') + 'e-2');

    // Намертво фиксируем правильный масштаб модели, полностью блокируя великанские 2700 пикселей!
    window.live2dModel.scale.set(finalScale);
    console.log(`[ГЕОМЕТРИЯ ЯДРА]: Масштаб модели успешно зафиксирован на значении: ${finalScale}`);

    // Передаем ход позиционированию (Часть 2)
    if (typeof window.syncModelPositionWithChat === "function") {
        window.syncModelPositionWithChat();
    }
};

window.syncModelPositionWithChat = function() {
    if (!window.live2dModel) return;

    const chatContainer = document.getElementById("web-chat-container");
    if (!chatContainer) return;

    // Считываем, где прямо сейчас физически стоит контейнер чата на экране
    let cx = chatContainer.offsetLeft;
    let cy = chatContainer.offsetTop;

    // Математический расчет центра модели (anchor 0.5, 0.5) для посадки на крышу чата.
    // Смещение вправо на +320px и половина ширины меша (141px). Смещение вверх на -40px и половина высоты (216px).
    let foxTargetX = cx + 320 + 141;
    let foxTargetY = cy - 40 + 216;

    // Принудительно выставляем координаты Лисичке внутри WebGL сцены
    window.live2dModel.position.set(foxTargetX, foxTargetY);
    
    if (window.live2dModel.update) {
        window.live2dModel.update(0.016); // Прокачиваем инерцию наклона для живой физики!
    }
    console.log(`[ГЕОМЕТРИЯ ЯДРА]: Координаты Лисички синхронизированы с чатом: ${foxTargetX}x${foxTargetY}`);
};
