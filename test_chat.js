// test_chat.js — ЛОГИЧЕСКИЙ ДРАЙВЕР СТЕНДА С ИМИТАЦИЕЙ ЖИВОЙ ПЕЧАТИ ИИ
console.log("[JS STAND] Драйвер чата и посимвольного вывода готов к тестам!");

// Базовое состояние чата
window.kitsuChatState = {
    isTyping: false,
    textQueue: []
};

// 1. МАССИВ СЛУЧАЙНЫХ ОТВЕТОВ КИЦУНЭ ДЛЯ ТЕСТИРОВАНИЯ КОНВЕЙЕРА
const kitsuTestPhrases = [
    "Ох, человек... Ты принёс мне ягодное печенье? 🍪 М-м-м, пахнет просто восхитительно! Моя лисья душа в полном восторге, спасибо тебе!",
    "Хмм? Что ты там шепчешь? Задаёшь вопросы готической лисице? Ну ладно, присаживайся поближе, я сегодня в хорошем настроении и готова поболтать.",
    "Слышу сочные бипы! Кажется, твоя видеокарта RTX 3060 трудится во всю мощь, пережёвывая мои готические мысли... Это так забавно, хи-хи! 🦊",
    "Посмотри на мои пушистые ушки, они чутко ловят каждое твоё слово на этом тестовом стенде. Всё работает просто идеально, мы у цели!",
    "Эй, не отвлекайся! В холодильнике ещё осталось немного прохладного молока? 🥛 Налей мне пиалу, и я расскажу тебе древнюю легенду своего клана."
];

// 2. ЖИВОЙ ПРИЕМНИК ENTER И ИМИТАТОР ОТВЕТА ИИ
document.addEventListener("DOMContentLoaded", () => {
    const webInput = document.getElementById("web-input-field");
    if (!webInput) return;

    webInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            const text = webInput.value.trim();
            if (text && !window.kitsuChatState.isTyping) {
                console.log("[JS] Пользователь отправил: " + text);
                
                // Мгновенно выводим твою реплику в левое окно мессенджера
                renderLiveRow("user", text);
                webInput.value = ""; // Очищаем поле ввода
                
                // 🔥 ТУРБО-БЛОКИРОВКА ИНПУТА: Закрываем поле на замок думы силами Chromium
                webInput.disabled = true;
                webInput.style.background = 'rgba(15, 15, 15, 0.65)';
                webInput.style.color = '#ffb3d1'; 
                webInput.placeholder = 'Кицунэ думает... 🐾';
                
                // Имитируем 1.2 секунды раздумий Лламы на видеокарте и пушим случайный ответ Лисы в очередь
                setTimeout(() => {
                    const randomReply = kitsuTestPhrases[Math.floor(Math.random() * kitsuTestPhrases.length)];
                    pushMessageToQueue("assistant", randomReply);
                }, 1200);
            }
        }
    });
});

// 3. КОНВЕЙЕР ОЧЕРЕДИ ПЕЧАТИ
function pushMessageToQueue(role, text) {
    window.kitsuChatState.textQueue.push({ role: role, content: text });
    processTextQueue();
}

function processTextQueue() {
    // Если сейчас уже бегут буквы или очередь пуста — мягко выходим
    if (window.kitsuChatState.isTyping || window.kitsuChatState.textQueue.length === 0) return;

    window.kitsuChatState.isTyping = true;
    let currentTask = window.kitsuChatState.textQueue.shift();
    let currentRole = currentTask.role;
    let rawText = currentTask.content;

    // 🔥 РАСЧЁТ НА БУДУЩИЕ УЛУЧШЕНИЯ: Базовая скорость печати. 
    // В будущем сюда можно будет подмешивать дельту задержки на знаках препинания (. , ! ?) для интонации Лисы!
    let baseTypingSpeed = 40; 

    let charsArray = rawText.split("");
    
    // Создаем пустую стартовую плашку под ответ Лисички
    renderLiveRow(currentRole, "");

    function typeNextChar() {
        if (charsArray.length > 0) {
            let char = charsArray.shift();
            
            // Дописываем букву в плашку
            renderLiveRow(currentRole, char, true);

            // 🔥 БУДУЩИЙ СИГНАЛ ЛИПСИНКА: Выстреливаем логом буквы в консоль.
            // Завтра этот лог поймает live2d_module.py и заставит Лису открывать рот в такт!
            if (currentRole === "assistant") {
                console.log("LIPSYNC_TICK:" + char);
            }
            
            // Рекурсивный шаг бега букв
            setTimeout(typeNextChar, baseTypingSpeed); 
        } else {
            // Буквы полностью закончились!
            if (currentRole === "assistant") {
                console.log("LIPSYNC_STOP");
                
                // 🔥 РАЗБЛОКИРОВКА ИНПУТА: Возвращаем поле ввода в активное рабочее состояние
                const webInput = document.getElementById("web-input-field");
                if (webInput) {
                    webInput.disabled = false;
                    webInput.style.background = 'rgba(10, 10, 15, 0.7)';
                    webInput.style.color = '#ffffff';
                    webInput.placeholder = 'Написать Кицунэ...';
                    webInput.focus(); // Принудительно возвращаем курсор клавиатуры
                }
            }
            
            // Сбрасываем флаг печати и толкаем конвейер дальше, если накопились реплики
            window.kitsuChatState.isTyping = false;
            processTextQueue();
        }
    }
    setTimeout(typeNextChar, 100);
}

// 4. ГРАФИЧЕСКИЙ РЕНДЕРЕР ОБЛАЧЕК МЕССЕНДЖЕРА
function renderLiveRow(role, text, isPartial = false) {
    const webHistory = document.getElementById("web-chat-history");
    if (!webHistory) return;

    // Если это продолжение текущей печатающейся строки — просто дописываем букву в конец
    if (isPartial) {
        const lastMsg = webHistory.lastChild;
        if (lastMsg && lastMsg.classList.contains("typing-active")) {
            lastMsg.querySelector(".msg-body").innerHTML += text;
            webHistory.scrollTop = webHistory.scrollHeight; // Нативный авто-скролл вниз!
            return;
        }
    }

    // Иначе создаем новую матовую контрастную плашку сообщения
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("chat-row");

    if (role === "user") {
        msgDiv.classList.add("row-user");
        msgDiv.innerHTML = `<b>Вы:</b> <span class="msg-body">${text}</span>`;
    } else {
        msgDiv.classList.add("row-kitsu", "typing-active");
        msgDiv.innerHTML = `<b>Кицуне:</b> <span class="msg-body">${text}</span>`;
    }

    webHistory.appendChild(msgDiv);
    webHistory.scrollTop = webHistory.scrollHeight; // Прокручиваем скроллбар к новой плашке
}

// ХОЛОДНЫЙ СТАРТ СТЕНДА: Принимает массив истории из MongoDB (Вставляем твою рабочую вчерашнюю функцию)
window.syncChatFromDatabase = function(messagesArray) {
    const webHistory = document.getElementById("web-chat-history");
    if (!webHistory || !messagesArray || !Array.isArray(messagesArray)) return;

    messagesArray.forEach(msg => {
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("chat-row");
        if (msg.role === "user") {
            msgDiv.classList.add("row-user");
            msgDiv.innerHTML = `<b>Вы:</b> ${msg.content}`;
        } else {
            msgDiv.classList.add("row-kitsu");
            msgDiv.innerHTML = `<b>Кицуне:</b> ${msg.content}`;
        }
        webHistory.appendChild(msgDiv);
    });
    webHistory.scrollTop = webHistory.scrollHeight;
    console.log("[JS STAND] История из MongoDB успешно отрендерена на стенде!");
};

// Вспомогательные функции пульта зума и холодильника (оставляем без изменений)
function adjustZoom(directionStep) {
    const zoomInput = document.getElementById("kitsu-zoom-value");
    if (!zoomInput) return;
    let currentZoom = parseInt(zoomInput.value) || 70;
    if (directionStep > 0) {
        let remainder = currentZoom % 5;
        currentZoom = (remainder === 0) ? currentZoom + 5 : Math.floor(currentZoom / 5) * 5 + 5;
    } else {
        let remainder = currentZoom % 5;
        currentZoom = (remainder === 0) ? currentZoom - 5 : Math.floor(currentZoom / 5) * 5;
    }
    if (currentZoom < 10) currentZoom = 10;
    if (currentZoom > 200) currentZoom = 200;
    zoomInput.value = currentZoom;
    console.log("SEND_TO_PYTHON -> ZOOM_CHANGED:" + currentZoom);
}
function validateZoomInput(inputElement) {
    let val = parseInt(inputElement.value);
    if (isNaN(val) || val < 10) val = 10;
    if (val > 200) val = 200;
    inputElement.value = val;
}
function resetZoom() {
    const zoomInput = document.getElementById("kitsu-zoom-value");
    if (zoomInput) { zoomInput.value = 70; }
}
function toggleFridge() {
    const nest = document.getElementById("kitsu-fridge-nest");
    if (nest) {
        nest.innerHTML = "<div style='color: #9adeff; font-size: 10px; font-weight: bold; text-align: center;'>Холодильник открыт! Полочки прогружаются... 🦊❄️</div>";
        setTimeout(() => { nest.innerHTML = "<div class='nest-placeholder'>Слоты инвентаря готовы к подключению... 🐾</div>"; }, 3000);
    }
}
