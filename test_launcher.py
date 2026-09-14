# test_launcher.py — СВЯЗУЮЩИЙ МОСТ ТЕСТОВОГО СТЕНДА ЧАТА С MONGODB
import os
import sys
import json
from PyQt6.QtWidgets import QApplication, QWidget
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEngineSettings, QWebEnginePage
from PyQt6.QtCore import Qt, QUrl, QPoint
from pymongo import MongoClient

# Импортируем наш успешный экстрактор палитры
from test_extractor import extract_goth_palette_from_texture

class TestChatPage(QWebEnginePage):
    def javaScriptConsoleMessage(self, level, message, lineNumber, sourceID):
        # Перехват нажатия Enter на тестовом стенде
        if "USER_SUBMIT:" in message:
            text = message.replace("USER_SUBMIT:", "").strip()
            print(f"\n[СТЕНД РАНТАЙМ] >>> Enter пойман! Текст пользователя: '{text}'")
            print("[СТЕНД РАНТАЙМ] Имитация раздвоения сигнала: инпут блокируется, ИИ ушел думать...")
            # В будущем здесь будет запускаться поток твоей RTX 3060!
            return

class TestChatWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Тестовый Стенд Модуля Чата")
        
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.SubWindow)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        
        # 🔥 РАСШИРЯЕМ ОКНО ПИТОНА ПОД СЕТКУ С ЗАПАСОМ:
        # Увеличиваем ширину до 500 и высоту до 370, чтобы инпут и края встали идеально!
        self.resize(500, 370)
        
        self.browser = QWebEngineView(self)
        self.browser.setPage(TestChatPage(self))
        self.browser.setGeometry(0, 0, 500, 370)
        self.browser.setStyleSheet("background: transparent !important;")
        self.browser.page().setBackgroundColor(Qt.GlobalColor.transparent)
        
        full_path = os.path.abspath("test_chat.html")
        self.browser.setUrl(QUrl.fromLocalFile(full_path))
        self.browser.loadFinished.connect(self.on_page_loaded)

    def on_page_loaded(self):
        print("[СТЕНД] Страница чата успешно загружена Chromium. Запускаем мосты...")
        
        # 1. 🔥 МОСТ АДАПТИВНОЙ ПАЛИТРЫ:
        # Извлекаем цвета из твоей реальной текстуры Кицунэ
        light, dark = extract_goth_palette_from_texture("model/GothL2D.2048/texture_01.png")
        
        # Насильно красим заднюю панель чата в Chromium в льдисто-голубые тона текстуры Лисы!
        js_paint_command = f"""
        const container = document.getElementById('web-chat-container');
        if (container) {{
            container.style.background = 'linear-gradient(to bottom, {light}, {dark})';
            console.log('[JS СТЕНД] Задняя панель успешно окрашена Питоном в цвета текстуры Кицу!');
        }}
        """
        self.browser.page().runJavaScript(js_paint_command)
        
         # 🔥 ИСПРАВЛЕНИЕ ИМЕНИ БАЗЫ ДАННЫХ:
        # Меняем "kitsu_assistant" на оригинальное имя "kitsu_database"
        # 🔥 ПОДКЛЮЧЕНИЕ К ИСТИННОЙ БАЗЕ ДАННЫХ VTUBE_ASSISTANT:
        try:
            client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
            
            # Насильно выставляем точное имя твоей реальной базы данных!
            detected_db_name = "vtube_assistant"
            db = client[detected_db_name]
            
            # Выводим список всех коллекций внутри vtube_assistant, чтобы перестраховаться
            all_collections = db.list_collection_names()
            print(f"\n[СТЕНД БАЗЫ]: Внутри базы '{detected_db_name}' найдены коллекции: {all_collections}")
            
            # Автоматически ищем коллекцию, где есть упоминание истории или чата
            detected_coll_name = "chat_history"
            for coll_name in all_collections:
                if "history" in coll_name.lower() or "chat" in coll_name.lower() or "msg" in coll_name.lower():
                    detected_coll_name = coll_name
            
            collection = db[detected_coll_name]
            
            # Считаем, сколько сообщений там накопилось
            total_docs = collection.count_documents({})
            print(f"[СТЕНД БАЗЫ]: В коллекции '{detected_coll_name}' находится сообщений: {total_docs}")
            
            # Вытягиваем последние 14 сообщений
            history_list = []
            if total_docs > 0:
                recent_history = collection.find().sort("_id", -1).limit(14)
                history_list = list(recent_history)[::-1]
            
            print(f"[СТЕНД БАЗЫ] Из MongoDB успешно извлечено {len(history_list)} сообщений.")
            
            # Упаковываем и отправляем в JavaScript (этот блок без изменений)
            js_messages = []
            for msg in history_list:
                safe_content = msg['content'].replace("'", "\\'").replace('"', '\\"').replace("\n", "<br>")
                for tag in ["[JOY]", "[SAD]", "[ANGRY]", "[SURPRISE]", "[HIDE_TAIL]", "[SHOW_TAIL]", "[BLINK]"]:
                    safe_content = safe_content.replace(tag, "")
                
                js_messages.append({
                    "id": str(msg['_id']),
                    "role": msg['role'],
                    "content": safe_content.strip()
                })
            
            json_string = json.dumps(js_messages)
            self.browser.page().runJavaScript(f"if(window.syncChatFromDatabase) window.syncChatFromDatabase({json_string});")
            
        except Exception as e:
            print(f"⚠️ [СТЕНД БАЗЫ ОШИБКА]: Ошибка подключения к vtube_assistant: {e}")

    # 3. 🔥 МОСТ НАВЕРТНОГО ДРАГА СИЛАМИ ОПЕРАЦИОННОЙ СИСТЕМЫ WINDOWS:
    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            # Если пользователь зажал мышку на пустом месте окна — Windows сама бережно тащит его по экрану!
            if self.windowHandle():
                self.windowHandle().startSystemMove()
                event.accept()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = TestChatWindow()
    window.show()
    sys.exit(app.exec())
