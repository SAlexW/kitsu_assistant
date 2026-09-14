# test_extractor.py — ИЗОЛИРОВАННЫЙ СКАНЕР ПАЛИТРЫ ТЕКСТУР КИЦУНЭ
import os
from PIL import Image

def extract_goth_palette_from_texture(texture_path):
    """
    Сканирует PNG-текстуру, отсекает чистый черный/белый/серый мусор 
    и вытаскивает самый глубокий темный цвет для низа чата 
    и самый выразительный светлый для верха.
    """
    print(f"[СКАНЕР ТЕКСТУР]: Начинаем молекулярный анализ файла: {texture_path}")
    
    if not os.path.exists(texture_path):
        print(f"⚠️ [СКАНЕР ПРЕДУПРЕЖДЕНИЕ]: Файл {texture_path} не найден! Возвращаем дефолтную палитру.")
        return "rgba(35, 25, 45, 0.9)", "rgba(15, 10, 20, 0.95)"

    try:
        # Открываем текстуру и сжимаем её до 150х150 пикселей для турбо-скорости сканирования
        img = Image.open(texture_path).convert("RGB")
        img = img.resize((150, 150))
        pixels = list(img.getdata())

        valid_colors = []

        for r, g, b in pixels:
            # 1. Защита от серого/монохромного шума: если каналы слишком близки друг к другу
            if abs(r - g) < 15 and abs(g - b) < 15 and abs(r - b) < 15:
                continue
            
            # 2. Защита от экстремального выгорания (отсекаем слишком глубокий черный и едкий белый)
            brightness = (r + g + b) / 3
            if brightness < 25 or brightness > 230:
                continue

            valid_colors.append((r, g, b, brightness))

        # Если текстура оказалась слишком монохромной или пустой — выдаем безопасный готический серый
        if not valid_colors:
            print("[СКАНЕР ТЕКСТУР]: Выразительные цвета не найдены. Применяем базовый готический серый.")
            return "rgba(45, 45, 55, 0.88)", "rgba(20, 20, 25, 0.93)"

        # Сортируем собранные цвета по их яркости
        valid_colors.sort(key=lambda x: x[3])

        # 3. ЭКСТРАКЦИЯ ТЁМНОГО ЦВЕТА (Для низа чата)
        # Берем цвет с небольшим отступом (например, 10% снизу), чтобы не схватить случайную тень
        dark_idx = int(len(valid_colors) * 0.10)
        dr, dg, db, _ = valid_colors[dark_idx]

        # 4. ЭКСТРАКЦИЯ СВЕТЛОГО ЦВЕТА (Для верха чата)
        # Берем цвет с отступом (например, 10% сверху), чтобы избежать пересвеченных бликов
        light_idx = int(len(valid_colors) * 0.90)
        lr, lg, lb, _ = valid_colors[light_idx]

        # Упаковываем в полупрозрачный формат RGBA для эффекта матового готического стекла
        light_css = f"rgba({lr}, {lg}, {lb}, 0.88)"
        dark_css = f"rgba({dr}, {dg}, {db}, 0.94)"

        print(f"[СКАНЕР ТЕКСТУР] УСПЕХ! Светлая доминанта: RGB({lr},{lg},{lb}) | Тёмная доминанта: RGB({dr},{dg},{db})")
        return light_css, dark_css

    except Exception as e:
        print(f"❌ [СКАНЕР ТЕКСТУР КРИТИЧЕСКАЯ ОШИБКА]: {e}")
        return "rgba(35, 25, 45, 0.9)", "rgba(15, 10, 20, 0.95)"

if __name__ == "__main__":
    # Твой реальный путь к текстуре Кицунэ
    target_texture = "model/GothL2D.2048/texture_01.png"
    
    light, dark = extract_goth_palette_from_texture(target_texture)
    
    print("\n==========================================================================")
    print("🔥 РЕЗУЛЬТАТ ГЕНЕРАЦИИ СТРОКИ СТИЛЯ ДЛЯ ПОДЛОЖКИ ЧАТА:")
    print(f"background: linear-gradient(to bottom, {light}, {dark}) !important;")
    print("==========================================================================\n")
