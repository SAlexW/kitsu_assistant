# live2d_module.py — КАСКАДНЫЙ ШЛЮЗ МАСОК И ПОДКЛЮЧЕНИЕ СЛЕДОПЫТА
import os
import time
import random
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEngineSettings, QWebEnginePage
from PyQt6.QtCore import Qt, QUrl, QTimer, QPoint, QEvent
from PyQt6.QtGui import QRegion # Железный импорт QtGui для масок Windows

# Импортируем наш новый декоратор-следопыт для диска
from chrono_logger import chrono_logger

try:
    from test_extractor import extract_goth_palette_from_texture
except ImportError:
    def extract_goth_palette_from_texture(p): return "rgba(190, 239, 255, 0.88)", "rgba(160, 168, 181, 0.94)"

class CustomWebEnginePage(QWebEnginePage):
    def __init__(self, parent_widget):
        super().__init__(parent_widget)
        self.parent_widget = parent_widget

    def javaScriptConsoleMessage(self, level, message, lineNumber, sourceID):
        if "LIPSYNC_TICK:" in message:
            main_win = self.parent_widget.parent()
            if main_win and self.parent_widget.model_ready:
                main_win.audio.play_beep()
                self.parent_widget.set_mouth_open(random.uniform(0.6, 0.9), random.choice([-1.0, 1.0]))
            return

        if "LIPSYNC_STOP" in message:
            if self.parent_widget.model_ready: self.parent_widget.set_mouth_open(0.0, 0.0)
            return

        if "USER_SUBMIT:" in message:
            user_text = message.replace("USER_SUBMIT:", "").strip()
            main_win = self.parent_widget.parent()
            if main_win and hasattr(main_win, 'process_web_message'):
                import asyncio
                asyncio.ensure_future(main_win.process_web_message(user_text))
            return

        if "ZOOM_CHANGED:" in message or "ZOOM_MANUAL:" in message or "ZOOM_RESET:" in message:
            try:
                zoom_pct = int(message.split(":")[-1])
                main_win = self.parent_widget.parent()
                if main_win and hasattr(main_win, 'apply_and_save_avatar_zoom'):
                    main_win.apply_and_save_avatar_zoom(zoom_pct)
            except: pass
            return

        # СИГНАЛЫ ДРАГА: Убираем маску на время движения для идеальной плавности
        if "DRAG_START" in message:
            main_win = self.parent_widget.parent()
            if main_win:
                main_win.is_currently_dragging_ui = True
                main_win.clearMask() 
                print("[ПИТОН МАСКА]: Драг начат. Окно временно открыто целиком для шёлкового хода.")
            return

        if "DRAG_STOP" in message:
            main_win = self.parent_widget.parent()
            if main_win:
                main_win.is_currently_dragging_ui = False
                print("[ПИТОН МАСКА]: Драг остановлен. Ожидаем чистый слепок от Костяшки 5.")
            return

        # 🔥 БРОНЕБОЙНЫЙ ПЕРЕВОД КООРДИНАТ ИЗ ГЛОБАЛЬНЫХ В ЛОКАЛЬНЫЕ ДЛЯ QREGION
        if "WINDOW_MASK:" in message:
            try:
                raw_coords = message.replace("WINDOW_MASK:", "").split(":")
                cx = int(raw_coords.__getitem__(0))
                cy = int(raw_coords.__getitem__(1))
                cw = int(raw_coords.__getitem__(2))
                ch = int(raw_coords.__getitem__(3))
                mx = int(raw_coords.__getitem__(4))
                my = int(raw_coords.__getitem__(5))
                mw = int(raw_coords.__getitem__(6))
                mh = int(raw_coords.__getitem__(7))
                
                main_win = self.parent_widget.parent()
                if main_win:
                    from PyQt6.QtCore import QPoint
                    from PyQt6.QtGui import QRegion
                    
                    # Переводим Глобальные координаты Экрана (из JS) в Локальные координаты Окна (для Qt)
                    local_chat_pos = main_win.mapFromGlobal(QPoint(cx, cy))
                    local_model_pos = main_win.mapFromGlobal(QPoint(mx, my))
                    
                    # Строим регионы осязаемости на основе ЧЕСТНЫХ и чистых локальных пикселей окна
                    chat_region = QRegion(local_chat_pos.x(), local_chat_pos.y(), cw, ch)
                    model_region = QRegion(local_model_pos.x(), local_model_pos.y(), mw, mh)
                    
                    # Сохраняем эти чистые регионы в память главного окна для возврата после драга
                    main_win.last_valid_chat_region = chat_region
                    main_win.last_valid_model_region = model_region
                    
                    # Накладываем объединенную маску Windows, только если прямо сейчас НЕ идет драг!
                    if not getattr(main_win, 'is_currently_dragging_ui', False):
                        main_win.setMask(chat_region.united(model_region))
                        
            except Exception as e:
                print(f"❌ [PY LOCAL setMask ERROR]: {e}")
            return

        if "AVATAR_READY" in message:
            self.parent_widget.force_model_ready()

class Live2DWidget(QWebEngineView):
    def __init__(self, parent=None, model_path="model/GothL2D.model3.json"):
        super().__init__(parent)
        self.model_path = model_path
        self.model_ready = False
        self.palette_injected = False # Замок от повторного сканирования текстуры
        self.setPage(CustomWebEnginePage(self))
        
        settings = self.settings()
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessFileUrls, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.WebGLEnabled, True)
        
        self.setStyleSheet("background: transparent !important;")
        self.page().setBackgroundColor(Qt.GlobalColor.transparent)
        self.setContextMenuPolicy(Qt.ContextMenuPolicy.NoContextMenu)
        
        self.html_file = "live2d_player.html"
        full_path = os.path.abspath(self.html_file)
        self.setUrl(QUrl.fromLocalFile(full_path))
        self.loadFinished.connect(self.inject_adaptive_goth_palette)

    def force_model_ready(self):
        self.model_ready = True
        if self.focusProxy(): self.focusProxy().installEventFilter(self)

    def set_mouth_open(self, open_y, form_x):
        if self.model_ready: self.page().runJavaScript(f"window.setAdvancedLipsync({open_y}, {form_x});")

    @chrono_logger
    def inject_adaptive_goth_palette(self, *args):
        # Внутри оставляем пустоту! Вся палитра теперь железно заперта в боевом CSS!
        pass
        
    def eventFilter(self, obj, event): return super().eventFilter(obj, event)
