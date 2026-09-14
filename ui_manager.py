# ui_manager.py — ОЧИЩЕННЫЙ КОРРЕКТНЫЙ КАЛЬКУЛЯТОР ДЛЯ ИЕРАРХИИ ЗОН
import json
from PyQt6.QtWidgets import QApplication
from PyQt6.QtCore import Qt

def load_app_config():
    try:
        with open("config.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[ОШИБКА] Не удалось прочитать config.json: {e}")
        return {}

def initialize_assistant_ui(parent):
    parent.config = load_app_config()
    self_flags = Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.SubWindow
    parent.setWindowFlags(self_flags)
    parent.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
    
    chat_cfg = parent.config.get("chat_settings", {})
    app_cfg = parent.config.get("app_settings", {})

    parent.chat_width = chat_cfg.get("width", 430)
    parent.chat_height = chat_cfg.get("height", 200)  
    parent.input_height = chat_cfg.get("input_height", 35)  
    
    parent.total_w = app_cfg.get("total_width", 650)
    parent.total_h = app_cfg.get("total_height", 500)
    parent.resize(parent.total_w, parent.total_h)

    from live2d_module import Live2DWidget
    #parent.kitsu_avatar = Live2DWidget(parent=parent, model_path="model/GothL2D.model3.json")
    parent.kitsu_avatar.setGeometry(0, 0, parent.total_w, parent.total_h)
    parent.kitsu_avatar.raise_()

def check_click_zone(main_win, click_point):
    """
    Динамический диспетчер кликов КИЦУНЭ.
    Работает на основе живых координат чата из WINDOW_MASK.
    """
    cx = click_point.x()
    cy = click_point.y()
    
    # Ищем живые рантайм-координаты чата, которые записал live2d_module
    # Если они еще не успели прилететь при самом первом клике — используем безопасный дефолт
    chat_left = getattr(main_win, 'live_chat_x', 455)
    chat_top = getattr(main_win, 'live_chat_y', 435)
    chat_width = getattr(main_win, 'live_chat_w', 430)
    chat_height = getattr(main_win, 'live_chat_h', 250)
    
    chat_right = chat_left + chat_width
    chat_bottom = chat_top + chat_height
    
    # 🎛️ МАТЕМАТИКА ПУЛЬТА И ПОЛЯ ВВОДА ВНУТРИ ЖИВЫХ КООРДИНАТ
    # Пульт зума находится на самом верху чата и имеет высоту 25px
    zoom_control_bottom = chat_top + 25
    
    # Поле ввода текста находится в самом низу чата. 
    # Его высота 35px плюс нижний внутренний паддинг 10px.
    input_field_bottom = chat_bottom - 10
    input_field_top = input_field_bottom - 35
    
    # Ширина чувствительной рамки для перетаскивания (в пикселях)
    DRAG_BORDER_THICKNESS = 10

    # 3. АЛГОРИТМ ПРИОРИТЕТОВ И ФИЛЬТРАЦИИ
        
    # Проверяем попадание строго внутрь габаритов чата
    if chat_left <= cx <= chat_right and chat_top <= cy <= chat_bottom:
        
        # 1. 🔥 УМНОЕ РАСШИРЕНИЕ DRAG-ЗОНЫ (Твоя новая логика заголовка окна)
        # Проверяем, попал ли клик в область пульта, но СТРОГО ЛЕВЕЕ самих кнопок управления
        # Мы оставляем 120 пикселей справа под кнопки и инпут зума, а всё, что левее — отдаем под Drag!
        is_on_header = (chat_top <= cy <= zoom_control_bottom) and (cx <= chat_right - 120)
        
        # Стандартная проверка тонкой внешней рамки вокруг чата
        is_on_border = (
            abs(cx - chat_left) <= DRAG_BORDER_THICKNESS or 
            abs(cx - chat_right) <= DRAG_BORDER_THICKNESS or 
            abs(cy - chat_top) <= DRAG_BORDER_THICKNESS or 
            abs(cy - chat_bottom) <= DRAG_BORDER_THICKNESS
        )
        
        # ИСПРАВЛЕНИЕ ДЛЯ ПОЛНОЭКРАННОГО РЕЖИМА:
        # Если попали в рамку или шапку — отдаем клик в JavaScript (Chromium), 
        # чтобы браузер сам плавно двигал CSS-контейнер по экрану
        if is_on_border or is_on_header:
            print(f"[UI MANAGER] Клик ({cx}, {cy}) -> Зона захвата чата. Передаем в JS Drag.")
            return "INTERACT"
            
        # 2. Если попали в пульт управления зумом (строго в зону кнопок справа)
        if chat_top <= cy <= zoom_control_bottom:
            print(f"[UI MANAGER] Клик ({cx}, {cy}) -> Пульт зума. Зона [INTERACT].")
            return "INTERACT"
            
        # 3. Если попали внутрь поля ввода текста (в самом низу чата)
        if input_field_top <= cy <= input_field_bottom:
            print(f"[UI MANAGER] Клик ({cx}, {cy}) -> Поле ввода текста. Зона [INTERACT].")
            return "INTERACT"
            
        # Все остальное пространство внутри чата — это история сообщений
        print(f"[UI MANAGER] Клик ({cx}, {cy}) -> История сообщений. Зона [INTERACT].")
        return "INTERACT"


    # Если клик мимо чата и мимо тела — это прозрачная пустота оверлея
    print(f"[UI MANAGER] Клик ({cx}, {cy}) -> Прозрачная пустота. Сигнал [IGNORE].")
    return "IGNORE"
