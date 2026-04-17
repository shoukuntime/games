# 專案規格書：Games Platform

## 1. 專案概述

- **專案名稱**：Games Platform
- **專案描述**：一個小遊戲平台，提供多種小遊戲讓使用者遊玩，包含使用者註冊/登入系統
- **目標使用者**：一般使用者，想要輕鬆玩小遊戲的人
- **專案目標**：建立一個可擴展的小遊戲平台，初期提供猜數字、剪刀石頭布、記憶翻牌三款遊戲

## 2. 功能需求

### 2.1 核心功能

1. **使用者認證系統**
   - 使用者註冊（帳號、密碼）
   - 使用者登入/登出
   - JWT Token 認證機制
   - 密碼加密儲存（bcrypt）

2. **遊戲大廳**
   - 顯示所有可用遊戲列表
   - 卡片式遊戲選擇介面

3. **猜數字遊戲**
   - 系統隨機產生 1-100 的數字
   - 使用者猜測，系統提示太大或太小
   - 記錄猜測次數

4. **剪刀石頭布**
   - 使用者選擇剪刀/石頭/布
   - 電腦隨機出拳
   - 顯示勝負結果與比分

5. **記憶翻牌**
   - 4x4 卡片配對遊戲
   - 翻開兩張相同圖案即配對成功
   - 記錄翻牌次數與完成時間

## 3. 技術架構

### 3.1 技術選型

- **後端**：Python + FastAPI
- **前端**：HTML/CSS/JS + Jinja2 模板
- **資料庫**：MariaDB（SQLAlchemy ORM）
- **認證**：JWT (python-jose) + bcrypt
- **部署**：Docker Compose（整體容器化）
- **環境管理**：env_settings.py + .env

### 3.2 架構說明

- FastAPI 後端提供 API 與 Jinja2 模板渲染
- 前端透過 Jinja2 模板 + 靜態 JS 檔案實現互動
- MariaDB 儲存使用者資料
- 遊戲邏輯主要在前端 JavaScript 執行

## 4. 資料庫設計

### 4.0 來源確認

- 系統內部資料庫：MariaDB（Docker Compose 部署）

### 4.1 資料表結構

#### users 表

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INT AUTO_INCREMENT | 主鍵 |
| username | VARCHAR(50) UNIQUE | 使用者帳號 |
| hashed_password | VARCHAR(255) | 加密後的密碼 |
| is_active | BOOLEAN DEFAULT TRUE | 帳號是否啟用 |
| created_at | DATETIME | 建立時間 |
| updated_at | DATETIME | 更新時間 |

## 5. API 規格

### 5.1 API 端點列表

- `POST /api/v1/auth/register` — 使用者註冊
- `POST /api/v1/auth/login` — 使用者登入
- `GET /api/v1/auth/me` — 取得當前使用者資訊

### 5.2 頁面路由

- `GET /` — 登入頁面
- `GET /register` — 註冊頁面
- `GET /dashboard` — 遊戲大廳（需登入）
- `GET /games/guess-number` — 猜數字遊戲
- `GET /games/rock-paper-scissors` — 剪刀石頭布
- `GET /games/memory-cards` — 記憶翻牌

## 6. 開發規劃

### 6.1 開發階段

- 階段一：專案架構建立、環境設定、Docker 配置
- 階段二：使用者認證系統（註冊/登入）
- 階段三：遊戲大廳與三款小遊戲
- 階段四：後續擴展更多遊戲

### 6.2 部署方式

- Docker Compose 一鍵部署
- MariaDB 容器 + FastAPI 應用容器
- 資料庫啟動時自動建表（SQLAlchemy create_all）
