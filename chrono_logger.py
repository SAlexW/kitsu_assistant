# chrono_logger.py — СКВОЗНОЙ ТРАССИРОВОЧНЫЙ ДЕКОРАТОР ДЛЯ ДИСКА
import time
import inspect

def chrono_logger(func):
    """
    Универсальный декоратор-ищейка. Накладывается над любой функцией Питона.
    Записывает время, аргументы и имя функции-родителя в файл на диск.
    """
    def wrapper(*args, **kwargs):
        # Опрашиваем стек вызовов: кто физически дернул текущую функцию?
        caller_frame = inspect.currentframe().f_back
        caller_name = caller_frame.f_code.co_name if caller_frame else "System/OS"
        
        start_time = time.time()
        
        # Выполняем саму боевую функцию программы
        result = func(*args, **kwargs)
        
        # Считаем точное время выполнения в миллисекундах
        execution_time = (time.time() - start_time) * 1000
        
        # Записываем сквозную трассировку в локальный файл runtime_trace.log на диске
        try:
            with open("runtime_trace.log", "a", encoding="utf-8") as log_file:
                log_file.write(f"[{time.strftime('%H:%M:%S')}] Функция '{func.__name__}' вызвана из '{caller_name}'.\n")
                log_file.write(f"          Переданные аргументы: args={args}, kwargs={kwargs}\n")
                log_file.write(f"          Скорость рантайма: {execution_time:.2f} мс\n")
                log_file.write("-" * 80 + "\n")
        except Exception as e:
            print(f"⚠️ [LOGGER ERROR] Не удалось записать трассировку в файл: {e}")
            
        return result
    return wrapper
