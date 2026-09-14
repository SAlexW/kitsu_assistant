    def display_kitsu_response_safe(self, ai_response):
        """
        ГЛАВНЫЙ ГРАФИЧЕСКИЙ ПРИЕМНИК. Вызывается строго в основном потоке Windows.
        Мгновенно передает текст в JS через Base64 и запускает посимвольный тикер!
        """
        print(f"[ПОТОК ОТРИСОВКИ] Сигнал пойман! Передаем ответ в Chromium...")
        
        # 1. Вырезаем скобки тегов ИИ исключительно для посимвольного расчета липсинка
        ai_response_clean = self.interact.process_ai_tags(ai_response)

        # 2. 🛡️ БРОНЕБОЙНАЯ ПЕРЕДАЧА ЧЕРЕЗ BASE64 (Победа над кавычками и падениями Chromium!)
        if self.kitsu_avatar.model_ready:
            import base64
            # Зашиваем ответ лисички в безопасную латиницу, чтобы кавычки не рвали JS-строку
            encoded_bytes = base64.b64encode(ai_response.encode('utf-8'))
            base64_string = encoded_bytes.decode('ascii')
            
            js_command = f"""
            (function() {{
                try {{
                    let rawBase64 = "{base64_string}";
                    let decodedText = decodeURIComponent(escape(atob(rawBase64)));
                    if (typeof window.processKitsuResponse === "function") {{
                        window.processKitsuResponse(decodedText);
                    }}
                }} catch(e) {{ console.error("[JS BASE64 ERROR] " + e.message); }}
            }})();
            """
            self.kitsu_avatar.page().runJavaScript(js_command)

        # 3. 🔥 ИНИЦИАЛИЗАЦИЯ ПОСИМВОЛЬНОГО ТИKЕРА В РОДНОМ ПОТОКЕ QT
        self.lipsync_chars = list(ai_response_clean)
        
        # Защита: глушим старый таймер, если он еще тикал от прошлой фразы
        if hasattr(self, 'lipsync_timer') and self.lipsync_timer:
            self.lipsync_timer.stop()
        else:
            self.lipsync_timer = QTimer(self) # Здесь self указывать можно, мы в главном потоке!

        def tick_char():
            if hasattr(self, 'lipsync_chars') and self.lipsync_chars:
                char = self.lipsync_chars.pop(0)
                
                # Если символ — буква или цифра, шевелим ротиком и пикаем вавником
                if char.isalnum():
                    self.audio.play_beep()
                    if self.kitsu_avatar.model_ready:
                        import random
                        self.kitsu_avatar.set_mouth_open(random.uniform(0.6, 0.9), random.choice([-1.0, 1.0]))
                else:
                    # На пробелах и знаках препинания ротик плавно прикрывается
                    if self.kitsu_avatar.model_ready: 
                        self.kitsu_avatar.set_mouth_open(0.0, 0.0)
            else:
                # Текст полностью закончился — останавливаем таймер и защелкиваем маску Windows
                self.lipsync_timer.stop()
                if self.kitsu_avatar.model_ready:
                    self.kitsu_avatar.set_mouth_open(0.0, 0.0)
                    self.kitsu_avatar.page().runJavaScript("window.updateModelScaleAndPosition(undefined, undefined, false, true);")

        # Отключаем старые события таймера, чтобы бипы не множились при повторных фразах
        try: self.lipsync_timer.timeout.disconnect()
        except Exception: pass
        
        self.lipsync_timer.timeout.connect(tick_char)
        
        # 🔥 ПОТОКОБЕЗОПАСНЫЙ СТАРТ ТАЙМЕРА: Оборачиваем в lambda через синглшот главный поток
        QTimer.singleShot(0, lambda: self.lipsync_timer.start(40)) # Базовая скорость 40мс
