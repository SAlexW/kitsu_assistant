import os
import winsound
import pygame

class AudioManager:
    def __init__(self, filename="voice_beep.wav"):
        self.has_wav = False
        try:
            pygame.mixer.init()
            if os.path.exists(filename):
                self.sound = pygame.mixer.Sound(filename)
                self.has_wav = True
                print("Кастомный звук загружен!")
            else:
                print("Файл voice_beep.wav не найден, используем системный писк.")
        except Exception as e:
            print(f"Ошибка звукового движка: {e}")

    def play_beep(self):
        if self.has_wav:
            self.sound.play()
        else:
            # Запасной вариант, если файла нет
            winsound.Beep(450, 30)
