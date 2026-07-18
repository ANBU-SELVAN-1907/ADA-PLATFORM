@echo off
title Deloitte AI Insights — Deep Schematic Discovery Engine Launcher
echo ==========================================================
echo Starting Deloitte AI Insights Services...
echo ==========================================================

:: 1. Launch the FastAPI Backend in a new window
echo Launching Python FastAPI Backend...
start "Deloitte AI Insights - Backend Server" cmd /k "cd /d %~dp0.. && call venv\Scripts\activate.bat && cd backend && uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

:: 2. Launch the Vite Frontend in a new window
echo Launching React + Vite Frontend...
start "Deloitte AI Insights - Frontend Server" cmd /k "cd /d %~dp0..\frontend && npm run dev"

echo ==========================================================
echo All services launched!
echo Backend logs: Check the Backend terminal window
echo Frontend logs: Check the Frontend terminal window
echo App is accessible at: http://localhost:5173
echo ==========================================================
pause

