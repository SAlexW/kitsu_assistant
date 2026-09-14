# interact_manager.py — КАСКАДНЫЙ ИНТЕРАКТИВ И СИСТЕМА ДЕЛИКАТНЫХ ОТНОШЕНИЙ КИЦУНЭ
import random
from PyQt6.QtCore import QTimer

class KitsuInteractManager:
    def __init__(self, assistant):
        self.parent = assistant  # Ссылка на DesktopAssistant
        self.cooldown = False
        
        # --- ПСИХОЛОГИЧЕСКИЙ ПРОФИЛЬ (Планы на будущее) ---
        self.trust_level = 0  # Уровень отношений (от 0 до 100). Первый день = 0!
        
        # Системная таблица ролевых тегов ИИ Llama
        self.tag_commands = {
            "[HIDE_TAIL]": lambda: self._run_js("window.toggleKitsuDetails(false);"),
            "[SHOW_TAIL]": lambda: self._run_js("window.toggleKitsuDetails(true);"),
            "[BLINK]":     lambda: self._run_js("window.triggerKitsuBlinkAction();"),
            "[JOY]":       lambda: self._run_js("window.setKitsuEmotion('JOY');"),
            "[SAD]":       lambda: self._run_js("window.setKitsuEmotion('SAD');"),
            "[ANGRY]":     lambda: self._run_js("window.setKitsuEmotion('ANGRY');"),
            "[SURPRISE]":  lambda: self._run_js("window.setKitsuEmotion('SURPRISE');"),
        }

    def process_ai_tags(self, ai_response):
        """
        БЕЗОПАСНЫЙ СИНХРОННЫЙ ОЧИСТИТЕЛЬ ТЕГОВ.
        Просто вырезает скобки для базы данных, не трогая графический поток Qt!
        """
        cleaned_response = ai_response
        # Список всех возможных ролевых тегов
        tags_to_strip = ["[HIDE_TAIL]", "[SHOW_TAIL]", "[BLINK]", "[JOY]", "[SAD]", "[ANGRY]", "[SURPRISE]", "[EXIT]"]
        
        for tag in tags_to_strip:
            cleaned_response = cleaned_response.replace(tag, "")
            
        return cleaned_response.strip()

    def start_cooldown(self, ms=2500):
        self.cooldown = True
        QTimer.singleShot(ms, self.reset_cooldown)

    def reset_cooldown(self):
        self.cooldown = False

    # --- МЕТОДЫ НАПРАВЛЕННОГО ИНТЕРАКТИВА КЛИКОВ ---
    def trigger_patting(self):
        if self.cooldown: return
        self.start_cooldown(2500)
        self.parent.audio.play_beep()
        self._set_emotion('PATTED', 1500)
        
        phrases = [
            "Мур-р... хозяин, твои руки такие теплые! Мне так приятно... 🐾✨",
            "Фыр-фыр... *ушки прижались от удовольствия* Спасибо за заботу! 🦊"
        ]
        self._send_to_chat(random.choice(phrases))

    def trigger_boop(self):
        if self.cooldown: return
        self.start_cooldown(2500)
        self.parent.audio.play_beep()
        
        if self.parent.kitsu_avatar.model_ready:
            self._run_js("window.setKitsuEmotion('SURPRISE');")
            self._run_js("window.triggerKitsuBlinkAction();")
            QTimer.singleShot(1200, lambda: self._run_js("window.setKitsuEmotion('JOY');"))
            
        phrases = [
            "Ой! Ты сделал мне буп! Хи-хи, это было неожиданно... 😊",
            "Ай, мой носик! *лисичка забавно зажмурилась* Ты так шутишь, да? 🐾"
        ]
        self._send_to_chat(random.choice(phrases))

    def trigger_tickle(self):
        if self.cooldown: return
        self.start_cooldown(2500)
        self.parent.audio.play_beep()
        if self.parent.kitsu_avatar.model_ready:
            self._run_js("window.triggerKitsuLaugh();")
        phrases = [
            "Ахахаха! Хозяин, прекрати, щекотно! Я сейчас упаду от смеха! 😆😂",
            "Хи-хи-хи! Ой, ну всё, сдаюсь! Мой пушистый животик очень чувствительный! 🐾"
        ]
        self._send_to_chat(random.choice(phrases))

    # --- NEW: ДЕЛИКАТНЫЙ ТРИГГЕР ПОБЕДЫ (Грудь, бедра, голени) ---
    def trigger_intimate_response(self):
        """Вызывается при клике в деликатные зоны (грудь, бедра, голени)"""
        if self.cooldown: return
        self.start_cooldown(3000) # Кулдаун чуть больше для деликатности

        self.parent.audio.play_beep()
        if self.parent.kitsu_avatar.model_ready:
            # Заставляем её зажмуриться и включить смущение/злость
            self.parent.kitsu_avatar.page().runJavaScript("window.setKitsuEmotion('ANGRY');")
            self.parent.kitsu_avatar.page().runJavaScript("window.triggerKitsuBlinkAction();")
            QTimer.singleShot(2000, lambda: self.parent.kitsu_avatar.page().runJavaScript("window.setKitsuEmotion('JOY');"))

        phrases = [
            "Х-хозяин?! Куда твои руки потянулись... Это... это неприлично! 😡🐾",
            "Ай! *ушки резко прижались, лисичка возмущенно фыркнула* Прекрати, хозяин, щекотно и... странно! 🦊",
            "М-мне... мне не очень нравится, когда так делают с первого дня... Пожалуйста, не надо... 🐾"
        ]
        self._send_to_chat(random.choice(phrases))
        
    def trigger_tail_response(self):
        """Вызывается при клике по пушистому хвосту Кицунэ"""
        if self.cooldown: return
        self.start_cooldown(2500)

        self.parent.audio.play_beep()
        if self.parent.kitsu_avatar.model_ready:
            self.parent.kitsu_avatar.page().runJavaScript("window.setKitsuEmotion('SURPRISE');")
            QTimer.singleShot(1500, lambda: self.parent.kitsu_avatar.page().runJavaScript("window.setKitsuEmotion('JOY');"))

        phrases = [
            "Ай! *хвост резко дернулся* Хозяин, не трогай его так внезапно, фыр! Это очень чувствительное место... 🐾",
            "Ой... ты потрогал мой хвостик? Хи-хи, он такой мягкий, правда? Но не сжимай сильно! 🦊",
            "Фыр-фыр... *ушки прижались* Щекотно, хозяин! Хвост — это моя гордость, относись к нему бережно! ✨"
        ]
        self._send_to_chat(random.choice(phrases))

    def _set_emotion(self, emotion_name, delay_ms):
        """Вспомогательный метод установки эмоции с авто-возвратом в JOY"""
        if self.parent.kitsu_avatar.model_ready:
            self._run_js(f"window.setKitsuEmotion('{emotion_name}');")
            QTimer.singleShot(delay_ms, lambda: self._run_js("window.setKitsuEmotion('JOY');"))

    def _run_js(self, code):
        self.parent.kitsu_avatar.page().runJavaScript(code)

    def _send_to_chat(self, text):
        chosen_phrase = f"<i>*{text}*</i>"
        if self.parent.kitsu_avatar.model_ready:
            self.parent.kitsu_avatar.page().runJavaScript(f"window.addMessageToWebChat('kitsu', '{chosen_phrase}');")
