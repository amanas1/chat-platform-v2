# 🚀 Quick Deployment Guide

## Шаг 1: GitHub

```bash
git init
git add .
git commit -m "Initial commit: StreamFlow chat app"
git remote add origin https://github.com/YOUR_USERNAME/streamflow.git
git push -u origin main
```

## Шаг 2: Socket Server (Railway - самый простой)

1. Зайти на [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Выбрать репозиторий
4. Root Directory: `server`
5. Скопировать URL: `https://streamflow-production.up.railway.app`

## Шаг 3: Frontend (Vercel)

1. Зайти на [vercel.com](https://vercel.com)
2. "Add New..." → "Project"
3. Import репозиторий
4. **Environment Variables:**
   ```
   VITE_SOCKET_URL = https://streamflow-production.up.railway.app
   ```
   *(Вставить ваш Railway URL)*
5. Deploy

## Шаг 4: Проверка

1. Открыть Vercel URL в 2+ браузерах
2. Создать профили
3. Проверить, что видите друг друга ✅

---

**Подробная инструкция:** См. `deployment_guide.md` в artifacts

**Проблемы?** Проверьте:
- Socket server: `curl https://your-socket-url.com/health`
- Browser console: должно быть "✅ Connected to StreamFlow server"
