# main_assistant.pyw — ЧАСТЬ 1: СТАБИЛЬНЫЙ АСИНХРОННЫЙ ДВИЖОК-ПРИЗРАК
from live2d_module import Live2DWidget  # КРИТИЧЕСКИ ВАЖНО: Самый первый импорт!

import sys
import random
import asyncio
from PyQt6.QtWidgets import QApplication, QWidget
from PyQt6.QtCore import Qt, QPoint, QTimer
from PyQt6.QtGui import QCursor, QRegion

from ai_module import AIManager
from audio_module import AudioManager
from interact_manager import KitsuInteractManager
import ui_manager 

class DesktopAssistant(QWidget):
    def __init__(self):
        super().__init__()
        print("\n[ИИ МОЗГ] Запуск КИЦУНЭ на стабильном асинхронном рантайме...")
        self.drag_position = QPoint()
        
        # Настраиваем флаги независимого оверлея верхнего уровня
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.Window)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        
        # 🔥 РОЖДЕНИЕ ПРИЗРАКА (Твоя идея!):
        # Накладываем пустую маску со стартовой микросекунды. 
        # Окно будет на 100% невидимо и неосязаемо, пока Chromium не закончит инициализацию WebGL!
        self.setMask(QRegion()) 
        
        self.ai = AIManager()
        self.audio = AudioManager()
        self.interact = KitsuInteractManager(self)

        # Подключаем Chromium аватар
        self.kitsu_avatar = Live2DWidget(parent=self, model_path="model/GothL2D.model3.json")

        # Динамически и честно раскрываем окно Питона на ВЕСЬ экран твоего монитора
        screen_geo = QApplication.primaryScreen().geometry()
        scr_w = screen_geo.width()   
        scr_h = screen_geo.height()  
        
        self.resize(scr_w, scr_h)
        self.kitsu_avatar.setGeometry(0, 0, scr_w, scr_h)
        
        # 🔥 ИНЖЕКТ ПЕРВОЙ КОСТЯШКИ ДОМИНО ПО ТАЙМЕРУ:
        # Даем Chromium 1.2 секунды полностью прогрузить движок в невидимости, 
        # а затем принудительно вызываем инициализацию границ и проявление сцены!
        QTimer.singleShot(1200, self.initialize_central_spawn_and_limits)
        
        # Выгрузка истории MongoDB через 3 секунды (база vtube_assistant, chat_history_v3)
        QTimer.singleShot(3000, self.load_chat_history_to_ui)
        
        self.look_timer = QTimer(self)
        self.idle_timer = QTimer(self)
        self.idle_timer.timeout.connect(self.check_random_phrase)
        self.idle_timer.start(300000) 
        
        # Наш 15-секундный предохранитель для безопасного дебага геометрии
        print("[БЕЗОПАСНОСТЬ] Взведен 15-секундный таймер экстренного самоотключения...")
        QTimer.singleShot(15000, lambda: self._emergency_self_destruct())

    def _emergency_self_destruct(self):
        """ 
        💥 Экстренное закрытие программы для безопасного дебага.
        Перед выходом намертво сохраняет весь лог консоли батника в текстовый файл!
        """
        print("\n💥 [БЕЗОПАСНОСТЬ]: 15 секунд истекли! Завершаем рантайм...")
        
        # Запись финального маркера закрытия
        print("================================================================================")
        print("🏁 СИСТЕМНЫЙ СЛЕПОК СДЕЛАН УСПЕШНО. ПРОГРАММА ЧИСТО ЗАКРЫТА.")
        print("================================================================================")
        
        # Закрываем приложение PyQt6 чисто
        QApplication.quit()

    def initialize_central_spawn_and_limits(self):
        """ 🔥 КОСТЯШКА 1: Опрос рабочей зоны Windows и передача её в JavaScript """
        current_screen = QApplication.screenAt(QCursor.pos()) if QApplication.screenAt(QCursor.pos()) else QApplication.primaryScreen()
        work_geo = current_screen.availableGeometry()
        
        # Сохраняем чистые лимиты свободной зоны экрана (с вычетом панели задач)
        self.work_limits = {
            "left": work_geo.x(),
            "top": work_geo.y(),
            "right": work_geo.x() + work_geo.width(),
            "bottom": work_geo.y() + work_geo.height()
        }
        print(f"[ГЕОМЕТРИЯ СИСТЕМЫ]: Рабочая зона Windows зафиксирована: {self.work_limits}")
        
        # Передаем лимиты в глобальную память Chromium
        import json
        limits_json = json.dumps(self.work_limits)
        js_command = f"window.kitsuScreenLimits = {limits_json}; console.log('[ПИТОН ВЕКТОР]: Лимиты Windows переданы в JS.');"
        self.kitsu_avatar.page().runJavaScript(js_command)
        
        # 🔥 ТОЛКАЕМ КОСТЯШКУ 4: Принудительно заставляем JS запустить каскад позиционирования и обрезки!
        QTimer.singleShot(50, lambda: self.kitsu_avatar.page().runJavaScript("if(window.updateKitsuAvatarPosition) window.updateKitsuAvatarPosition();"))

    # ЧАСТЬ 2: КОНВЕЙЕР ГЕНЕРАЦИИ, СИНХРОНИЗАЦИЯ БАЗЫ И СТАРТ ЛУПА
    def trigger_patting_response(self): self.interact.trigger_patting()
    def trigger_boop_response(self): self.interact.trigger_boop()
    def trigger_tickle_response(self): self.interact.trigger_tickle()
    def trigger_intimate_response(self): self.interact.trigger_intimate_response()

    async def process_web_message(self, text):
        """ Вызывается из live2d_module, когда пользователь нажал Enter """
        print(f"\n[РАНТАЙМ] Получено сообщение от пользователя: {text}")
        safe_text = text.replace("'", "\\'").replace('"', '\\"')
        
        if self.kitsu_avatar.model_ready:
            # Мгновенно выводим реплику в мессенджер через стабильный метод
            js_print = f"if(window.addMessageToWebChat) window.addMessageToWebChat('user', '{safe_text}');"
            self.kitsu_avatar.page().runJavaScript(js_print)
            
            # Включаем Chromium-блокировку инпута на время раздумий ИИ
            js_lock = """
            const inp = document.getElementById('web-input-field');
            if(inp) {
                inp.disabled = true;
                inp.style.background = 'rgba(15, 15, 15, 0.65)';
                inp.placeholder = 'Кицунэ думает... 🐾';
            }
            """
            self.kitsu_avatar.page().runJavaScript(js_lock)
            
        await self.send_message_async(force_text=text)

    async def send_message_async(self, force_text=None, is_hidden_prompt=False):
        """ Родной асинхронный конвейер посимвольного вывода реплик Кицунэ """
        user_text = force_text if force_text else "..."
        if not is_hidden_prompt: 
            self.ai.save_user_message(user_text)
            
        try:
            ai_response = await self.ai.get_ai_response(is_hidden_prompt)
            
            should_close = False
            if "[EXIT]" in ai_response:
                should_close = True
                ai_response = ai_response.replace("[EXIT]", "").strip()

            ai_response = self.interact.process_ai_tags(ai_response)
            self.ai.save_assistant_message(ai_response)

            if any(t in ai_response.lower() for t in ["ха-ха", "хи-хи", "хе-хе", "😂", "😆"]) and self.kitsu_avatar.model_ready:
                self.kitsu_avatar.page().runJavaScript("if(window.triggerKitsuLaugh) window.triggerKitsuLaugh();")
                await asyncio.sleep(0.8)

            if self.kitsu_avatar.model_ready: 
                self.kitsu_avatar.page().runJavaScript("if(window.addMessageToWebChat) window.addMessageToWebChat('kitsu_prefix', '');")

            for char in ai_response:
                if self.kitsu_avatar.model_ready:
                    safe_char = char.replace("'", "\\'").replace('"', '\\"').replace("\n", "<br>")
                    self.kitsu_avatar.page().runJavaScript(f"if(window.addMessageToWebChat) window.addMessageToWebChat('kitsu', '{safe_char}', true);")
                
                if char.isalnum():
                    self.audio.play_beep()
                    if self.kitsu_avatar.model_ready: 
                        self.kitsu_avatar.set_mouth_open(random.uniform(0.6, 0.9), random.choice([-1.0, 1.0]))
                else:
                    if self.kitsu_avatar.model_ready: 
                        self.kitsu_avatar.set_mouth_open(0.0, 0.0)
                await asyncio.sleep(0.04)

            if self.kitsu_avatar.model_ready:
                self.kitsu_avatar.set_mouth_open(0.0, 0.0)
                
                # Возвращаем инпут в активное состояние по окончании генерации
                js_unlock = """
                const inp = document.getElementById('web-input-field');
                if(inp) {
                    inp.disabled = false;
                    inp.style.background = 'rgba(40, 40, 40, 0.86)';
                    inp.placeholder = 'Написать Кицунэ...';
                    inp.focus();
                }
                """
                self.kitsu_avatar.page().runJavaScript(js_unlock)
                QTimer.singleShot(3000, lambda: self.kitsu_avatar.page().runJavaScript("if(window.setKitsuEmotion) window.setKitsuEmotion('JOY');"))
                
            if should_close: 
                QTimer.singleShot(3000, QApplication.quit)
                
        except Exception as e:
            print(f"[ОШИБКА ИИ]: {e}")

    def mousePressEvent(self, event): pass
    def mouseMoveEvent(self, event): event.ignore()
    def mouseReleaseEvent(self, event): event.accept()

    def keyPressEvent(self, event):
        if event.key() == Qt.Key.Key_Escape:
            print("[РАНТАЙМ] Экстренный выход по Esc!")
            QApplication.quit()

    def load_chat_history_to_ui(self):
        """ Выгрузка истории из истинной боевой MongoDB vtube_assistant пачкой """
        if not self.kitsu_avatar.model_ready: return
        try:
            from pymongo import MongoClient
            client = MongoClient("mongodb://localhost:27017/")
            db = client["vtube_assistant"]
            collection = db["chat_history_v3"]
            
            recent_history = collection.find().sort("_id", -1).limit(10) # 10 сообщений для ленивого старта
            history_list = list(recent_history)[::-1]
            
            js_messages_list = []
            for msg in history_list:
                safe_content = msg['content'].replace("'", "\\'").replace('"', '\\"').replace("\n", "<br>")
                for tag in ["[JOY]", "[SAD]", "[ANGRY]", "[SURPRISE]", "[HIDE_TAIL]", "[SHOW_TAIL]", "[BLINK]"]:
                    safe_content = safe_content.replace(tag, "")
                js_messages_list.append({
                    "id": str(msg['_id']),
                    "role": msg['role'],
                    "content": safe_content.strip()
                })
            import json
            json_string = json.dumps(js_messages_list)
            self.kitsu_avatar.page().runJavaScript(f"if(window.syncChatFromDatabase) window.syncChatFromDatabase({json_string});")
            print(f"[БОЕВАЯ БАЗА] Из chat_history_v3 выгружено {len(history_list)} сообщений.")
        except Exception as e:
            print(f"❌ [БОЕВАЯ БАЗА ERROR]: {e}")

    def check_random_phrase(self):
        if random.random() < 0.30: 
            asyncio.ensure_future(self.send_message_async(is_hidden_prompt=True))

# 🔥 КЛАСС-ПЕРЕХВАТЧИК ДЛЯ ДУБЛИРОВАНИЯ КОНСОЛИ В ФАЙЛ НА ДИСК
class LoggerStream(object):
    def __init__(self, filename="console_runtime.log"):
        self.terminal = sys.stdout
        self.log = open(filename, "w", encoding="utf-8", buffering=1) # Флаш после каждой строки!

    def write(self, message):
        self.terminal.write(message)
        self.log.write(message)

    def flush(self):
        self.terminal.flush()
        self.log.flush()

if __name__ == "__main__":
    from qasync import QEventLoop
    
    # Включаем сквозное дублирование консоли в файл console_runtime.log
    sys.stdout = LoggerStream()
    sys.stderr = sys.stdout # Ловим и критические ошибки Python (Traceback)
    
    sys.argv.append("--allow-file-access-from-files")
    sys.argv.append("--disable-web-security")
    
    app = QApplication(sys.argv)
    loop = QEventLoop(app)
    asyncio.set_event_loop(loop)
    
    assistant = DesktopAssistant()
    assistant.show() 
    with loop: loop.run_forever()
