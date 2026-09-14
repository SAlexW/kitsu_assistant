@echo off
chcp 65001 > nul
echo [СИСТЕМА] Полная очистка кэша __pycache__...

:: Удаляем кэш в корневой папке и подпапках
if exist __pycache__ rmdir /s /q __pycache__
if exist model\__pycache__ rmdir /s /q model\__pycache__

echo [СИСТЕМА] Запуск Кицунэ в фоновом режиме...
start "" pythonw main_assistant.pyw
exit
