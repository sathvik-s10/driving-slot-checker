@echo off
title SLOT AVAILABLE - 911 Driving School
color 0A
echo ============================================
echo   SLOT AVAILABLE - 911 DRIVING SCHOOL
echo ============================================
echo A green (available) day was found on the scheduling calendar.
echo Go book it now: %1
echo.
:loop
set /p resp=Type UNDERSTOOD and press Enter to close this window:
if /I not "%resp%"=="understood" goto loop
exit
