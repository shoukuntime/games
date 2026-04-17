# Games Platform — 專案資訊

## 基本資訊
- **專案名稱**: Games Platform
- **專案路徑**: /opt/workspace/jenjiunchen/games
- **建立日期**: 2026-04-17
- **專案類型**: Full-stack (FastAPI + Jinja2 前端)

## 技術棧
- **後端**: Python 3.12 + FastAPI
- **前端**: HTML/CSS/JS + Jinja2 模板
- **資料庫**: MariaDB 11 (SQLAlchemy ORM)
- **認證**: JWT (python-jose) + bcrypt
- **部署**: Docker Compose
- **環境管理**: env_settings.py + .env (pydantic-settings)

## 功能清單
- [x] 使用者註冊/登入/登出 (JWT + Cookie)
- [x] 遊戲大廳 (卡片式選擇介面)
- [x] 猜數字遊戲
- [x] 剪刀石頭布
- [x] 記憶翻牌

## 架構
```
games/
├── main.py              # FastAPI 入口 + 頁面路由
├── env_settings.py      # Pydantic 環境設定
├── .env                 # 環境變數
├── core/                # 核心模組 (database, security)
├── models/              # SQLAlchemy 模型
├── schemas/             # Pydantic schemas
├── crud/                # CRUD 操作
├── api/v1/endpoints/    # API 端點
├── templates/           # Jinja2 模板
├── static/              # CSS, JS, Images
├── Dockerfile
└── docker-compose.yml
```
