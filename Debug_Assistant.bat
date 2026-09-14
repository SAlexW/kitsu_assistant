@echo off
chcp 65001 > nul
echo [ДЕБАГ] Полная очистка кэша __pycache__...

:: Удаляем кэш перед запуском отладки
if exist __pycache__ rmdir /s /q __pycache__
if exist model\__pycache__ rmdir /s /q model\__pycache__

echo [ДЕБАГ] Запуск Кицунэ с выводом логов в консоль...
echo --------------------------------------------------
python main_assistant.pyw --debug
echo --------------------------------------------------
echo [ДЕБАГ] Работа программы завершена.
pause
