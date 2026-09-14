import os
from PIL import Image

def extract_theme_colors(texture_path):
    """
    Анализирует текстуру PNG, игнорирует прозрачность, чистый черный и чистый белый.
    Возвращает пару HEX-цветов: [Светлый_Топ, Темный_Низ] для градиента чата.
    """
    if not os.path.exists(texture_path):
        print(f"[АНАЛИЗАТОР ERROR] Файл текстуры не найден: {texture_path}")
        return "#333333", "#1a1a1a" # Элегантный темный фаллбэк

    try:
        img = Image.open(texture_path).convert("RGBA")
        pixels = img.getdata()
        
        valid_colors = []
        
        for r, g, b, a in pixels:
            # 1. Пропускаем полностью или сильно прозрачные пиксели
            if a < 200: 
                continue
                
            # Вычисляем относительную яркость пикселя (стандартная формула)
            brightness = 0.299 * r + 0.587 * g + 0.114 * b
            
            # 2. Игнорируем экстремальный черный (обводка) и экстремальный белый (блики)
            if brightness < 35 or brightness > 240:
                continue
                
            valid_colors.append((r, g, b, brightness))

        if not valid_colors:
            print("[АНАЛИЗАТОР] Подходящие пиксели не найдены, применен фаллбэк.")
            return "#444444", "#111111"

        # Сортируем собранные цвета по яркости
        valid_colors.sort(key=lambda x: x[3])
        
        # Берем самый темный из прошедших фильтр и самый светлый
        dark_rgb = valid_colors[int(len(valid_colors) * 0.05)] # Отрезаем крайние 5% для защиты от шума
        light_rgb = valid_colors[int(len(valid_colors) * 0.95)]
        
        # Переводим в красивый HEX-формат для CSS
        dark_hex = f"#{dark_rgb[0]:02x}{dark_rgb[1]:02x}{dark_rgb[2]:02x}"
        light_hex = f"#{light_rgb[0]:02x}{light_rgb[1]:02x}{light_rgb[2]:02x}"
        
        return light_hex, dark_hex

    except Exception as e:
        print(f"[АНАЛИЗАТОР CRITICAL] Сбой анализа текстуры: {e}")
        return "#333333", "#1a1a1a"

# ТЕСТОВЫЙ ЗАПУСК
if __name__ == "__main__":
    # Укажи путь к одной из текстур твоей лисички (например, texture_00.png)
    # Посмотри в model3.json, как точно называются файлы в папке GothL2D.2048/
    test_path = "model/GothL2D.2048/texture_01.png" 
    
    print("==================================================")
    print(f"Старт сканирования палитры Кицунэ для чата...")
    light, dark = extract_theme_colors(test_path)
    print(f"Успех! Светлый HEX (Верх): {light}")
    print(f"Успех! Темный HEX (Низ):  {dark}")
    print("==================================================")
