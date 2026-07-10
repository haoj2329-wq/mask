@echo off
chcp 65001 >nul
title 91Mail Cloudflare 部署工具

echo.
echo ========================================
echo   91Mail Cloudflare 一键部署
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未安装 Node.js，请先安装 LTS 版本。
  echo https://nodejs.org/
  pause
  exit /b 1
)

echo [1/4] 安装依赖...
call npm install
if errorlevel 1 goto error

echo [2/4] 登录 Cloudflare...
call npx wrangler login
if errorlevel 1 goto error

echo [3/4] 检查代码...
call npm run typecheck
if errorlevel 1 goto error
call npm test
if errorlevel 1 goto error

echo [4/4] 创建资源、初始化数据库并部署...
call npm run deploy
if errorlevel 1 goto error

echo.
echo 部署完成。
echo 下一步：Cloudflare Email Routing ^> Catch-all ^> Send to a Worker
echo Worker 请选择：91mail-public-inbox
echo 收件域名：91mail.org
echo.
pause
exit /b 0

:error
echo.
echo [失败] 请查看上方错误信息。
pause
exit /b 1
