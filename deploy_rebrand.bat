@echo off
echo ===================================
echo Fluent Oman Rebranding Deployment
echo ===================================
echo.

echo Adding all updated files to git...
git add templates/dashboard.html
git add templates/index.html
git add templates/lessons.html
git add templates/reading.html
git add templates/grades/grade5.html
git add templates/grades/grade6.html
git add templates/grades/grade7.html
git add templates/grades/grade8.html
git add static/dashboard.css
git add static/dashboard.js

echo.
echo Committing changes...
git commit -m "Rebrand to Fluent Oman: copyright by Aisha AlRusheidi, remove Practice Speaking, enlarge E-books button, remove all loading text"

echo.
echo Pushing to GitHub (will trigger Render deployment)...
git push origin main

echo.
echo ===================================
echo Deployment initiated!
echo ===================================
echo.
echo Your changes are being pushed to GitHub.
echo Render will automatically rebuild in 2-3 minutes.
echo.
echo Changes included:
echo - Site name: "Fluent Edge" → "Fluent Oman™"
echo - Added copyright: "Programmed & Designed by Aisha AlRusheidi"
echo - Removed "Practice Speaking" button
echo - Enlarged E-books button (green, prominent)
echo - Removed all "Loading..." text from pages
echo.
echo Visit your Render dashboard to monitor the build progress.
echo.
pause
