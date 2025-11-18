# インテリジェント情報収集・通知システム設計書

## 目次
1. [システム概要](#1-システム概要)
2. [アーキテクチャ設計](#2-アーキテクチャ設計)
3. [技術スタック](#3-技術スタック)
4. [データベース設計](#4-データベース設計)
5. [API設計](#5-api設計)
6. [フロントエンド設計](#6-フロントエンド設計)
7. [通知システム設計](#7-通知システム設計)
8. [セキュリティ設計](#8-セキュリティ設計)
9. [開発ロードマップ](#9-開発ロードマップ)
10. [MVP機能一覧](#10-mvp機能一覧)

---

## 1. システム概要

### 1.1 プロジェクト名
**Intelligent Alert Hub (IAH)** - インテリジェント情報収集・通知システム

### 1.2 目的
世界中の多様な情報ソースから自動的にデータを収集し、ユーザー定義の条件に基づいてインテリジェントにフィルタリング・分析し、最適なタイミングで複数チャネルを通じて通知を配信するシステム。

### 1.3 主要機能
- **情報収集エンジン**: Web、Twitter/X、RSS、ニュースAPI等からのリアルタイム情報収集
- **インテリジェントフィルタリング**: キーワード、カテゴリ、優先度、感情分析に基づく高度なフィルタリング
- **マルチチャネル通知**: Email、デスクトップ通知、モバイルプッシュ、Webhook
- **カスタマイズ可能ダッシュボード**: ユーザーごとの設定管理とリアルタイム分析
- **AI駆動の推奨**: 機械学習による関連性の高い情報の提案

### 1.4 ターゲットユーザー
- ニュース記者・メディア関係者
- 投資家・トレーダー
- 研究者・アナリスト
- マーケティング担当者
- セキュリティ専門家

---

## 2. アーキテクチャ設計

### 2.1 システムアーキテクチャ図

```
┌─────────────────────────────────────────────────────────────────────┐
│                         クライアント層                                │
├─────────────────────────────────────────────────────────────────────┤
│  Web App (React)  │  Mobile App (React Native)  │  Desktop (Electron) │
└──────────────┬──────────────────────────────────────────────────────┘
               │
               │ HTTPS/WSS
               │
┌──────────────▼──────────────────────────────────────────────────────┐
│                        API Gateway (Kong/Nginx)                      │
│                    + Rate Limiting + Authentication                  │
└──────────────┬──────────────────────────────────────────────────────┘
               │
               │
    ┌──────────┼──────────┬──────────────┬──────────────┐
    │          │          │              │              │
┌───▼────┐ ┌──▼─────┐ ┌──▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│ Auth   │ │ User   │ │ Content │ │Notification│ │ Analytics  │
│Service │ │Service │ │ Service │ │  Service   │ │  Service   │
│(Node)  │ │(Node)  │ │ (Node)  │ │   (Node)   │ │   (Python) │
└───┬────┘ └────┬───┘ └────┬────┘ └─────┬──────┘ └──────┬─────┘
    │           │          │             │               │
    │      ┌────▼──────────▼─────────────▼───────────────▼────┐
    │      │           Message Queue (RabbitMQ/Kafka)          │
    │      └────┬──────────┬─────────────┬───────────────┬────┘
    │           │          │             │               │
    │      ┌────▼────┐ ┌───▼──────┐ ┌───▼────────┐ ┌───▼────────┐
    │      │ Crawler │ │ Twitter  │ │   RSS      │ │   News     │
    │      │ Workers │ │  Worker  │ │  Worker    │ │   Worker   │
    │      │(Python) │ │ (Node)   │ │  (Node)    │ │  (Python)  │
    │      └─────────┘ └──────────┘ └────────────┘ └────────────┘
    │
┌───▼──────────────────────────────────────────────────────────────────┐
│                         データ層                                      │
├──────────────────────────────────────────────────────────────────────┤
│  PostgreSQL   │   MongoDB    │   Redis    │   Elasticsearch         │
│  (主データ)   │  (収集データ) │  (キャッシュ) │  (全文検索)           │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 アーキテクチャパターン

#### マイクロサービスアーキテクチャ
- **利点**: スケーラビリティ、独立したデプロイ、技術スタックの柔軟性
- **サービス分離**: 認証、ユーザー管理、コンテンツ収集、通知、分析

#### イベント駆動アーキテクチャ
- **メッセージキュー**: RabbitMQ/Kafka による非同期処理
- **利点**: 疎結合、高スループット、障害耐性

#### CQRS (Command Query Responsibility Segregation)
- **読み取り**: Elasticsearch + MongoDB (高速検索)
- **書き込み**: PostgreSQL (トランザクション整合性)

---

## 3. 技術スタック

### 3.1 フロントエンド

| 技術 | 用途 | 選定理由 |
|------|------|----------|
| **React 18** | Webアプリケーション | 大規模エコシステム、並行レンダリング、パフォーマンス |
| **Next.js 14** | フレームワーク | SSR/SSG、App Router、組み込みAPI Routes |
| **TypeScript** | 型安全性 | 大規模開発での保守性向上、IDE支援 |
| **TailwindCSS** | スタイリング | ユーティリティファースト、高速プロトタイピング |
| **shadcn/ui** | UIコンポーネント | モダン、カスタマイズ可能、アクセシビリティ |
| **React Query** | データフェッチング | キャッシング、同期、楽観的更新 |
| **Zustand** | 状態管理 | 軽量、シンプルAPI、TypeScript統合 |
| **Recharts** | データ可視化 | React統合、カスタマイズ性 |
| **React Native** | モバイルアプリ | コード共有、ネイティブパフォーマンス |
| **Electron** | デスクトップアプリ | クロスプラットフォーム、Web技術活用 |

### 3.2 バックエンド

| 技術 | 用途 | 選定理由 |
|------|------|----------|
| **Node.js 20 (LTS)** | メインAPI | 非同期I/O、JavaScriptエコシステム統合 |
| **NestJS** | フレームワーク | TypeScript、モジュール構造、DI、スケーラビリティ |
| **Python 3.11** | データ収集/分析 | 豊富なライブラリ(BeautifulSoup, Scrapy, NLTK) |
| **FastAPI** | Python API | 高速、自動ドキュメント生成、型検証 |
| **GraphQL** | API層 | 効率的なデータフェッチ、型システム |
| **REST API** | レガシー互換 | 標準的、広く理解されている |

### 3.3 データベース

| 技術 | 用途 | 選定理由 |
|------|------|----------|
| **PostgreSQL 16** | 主データベース | ACID、JSONB、全文検索、信頼性 |
| **MongoDB 7** | ドキュメントストア | スキーマレス、大量の非構造化データ |
| **Redis 7** | キャッシュ/セッション | 高速、pub/sub、分散ロック |
| **Elasticsearch 8** | 全文検索 | 高速検索、分析、ログ集約 |

### 3.4 インフラストラクチャ

| 技術 | 用途 | 選定理由 |
|------|------|----------|
| **Docker** | コンテナ化 | 環境一貫性、デプロイメント簡素化 |
| **Kubernetes (K8s)** | オーケストレーション | 自動スケーリング、自己修復、ロードバランシング |
| **Terraform** | IaC | インフラコード化、マルチクラウド |
| **AWS/GCP** | クラウドプロバイダー | 管理サービス、グローバル展開 |
| **GitHub Actions** | CI/CD | 自動テスト、デプロイメント |
| **Nginx/Kong** | APIゲートウェイ | リバースプロキシ、レート制限、認証 |

### 3.5 監視・ログ

| 技術 | 用途 | 選定理由 |
|------|------|----------|
| **Prometheus** | メトリクス収集 | 時系列データ、アラート |
| **Grafana** | 可視化 | ダッシュボード、多様なデータソース |
| **ELK Stack** | ログ管理 | 集中ログ、分析、可視化 |
| **Sentry** | エラートラッキング | リアルタイムエラー監視 |

### 3.6 通知・通信

| 技術 | 用途 | 選定理由 |
|------|------|----------|
| **RabbitMQ** | メッセージキュー | 信頼性、柔軟なルーティング |
| **Apache Kafka** | イベントストリーミング | 高スループット、永続化 |
| **SendGrid/AWS SES** | Email送信 | スケーラブル、配信管理 |
| **Firebase Cloud Messaging** | プッシュ通知 | iOS/Android統合 |
| **WebSocket (Socket.io)** | リアルタイム通信 | 双方向通信、フォールバック |

---

## 4. データベース設計

### 4.1 PostgreSQL スキーマ (主データベース)

#### Users テーブル
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_tier VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

#### Sources テーブル (情報ソース定義)
```sql
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- rss, twitter, web, news_api, webhook
    config JSONB NOT NULL, -- 各ソースタイプ固有の設定
    is_active BOOLEAN DEFAULT TRUE,
    check_interval INTEGER DEFAULT 300, -- 秒単位
    last_checked_at TIMESTAMP WITH TIME ZONE,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sources_user_id ON sources(user_id);
CREATE INDEX idx_sources_type ON sources(type);
CREATE INDEX idx_sources_is_active ON sources(is_active);
```

#### Filters テーブル (フィルター条件)
```sql
CREATE TABLE filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    conditions JSONB NOT NULL, -- フィルター条件 (AND/OR論理)
    priority INTEGER DEFAULT 0, -- 優先度 (高いほど優先)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 条件例:
-- {
--   "logic": "AND",
--   "rules": [
--     {"field": "keywords", "operator": "contains", "value": ["AI", "machine learning"]},
--     {"field": "sentiment", "operator": ">=", "value": 0.5},
--     {"field": "source_type", "operator": "in", "value": ["twitter", "news_api"]}
--   ]
-- }

CREATE INDEX idx_filters_user_id ON filters(user_id);
```

#### Notifications_Config テーブル (通知設定)
```sql
CREATE TABLE notifications_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filter_id UUID REFERENCES filters(id) ON DELETE CASCADE,
    channels JSONB NOT NULL, -- 通知チャネル設定
    schedule JSONB, -- 通知スケジュール
    quiet_hours JSONB, -- サイレント時間帯
    batch_config JSONB, -- バッチ通知設定
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- channels例:
-- {
--   "email": {"enabled": true, "address": "user@example.com"},
--   "push": {"enabled": true, "devices": ["device_id_1", "device_id_2"]},
--   "webhook": {"enabled": true, "url": "https://example.com/webhook"}
-- }

CREATE INDEX idx_notifications_config_user_id ON notifications_config(user_id);
CREATE INDEX idx_notifications_config_filter_id ON notifications_config(filter_id);
```

#### Notifications_Log テーブル (通知履歴)
```sql
CREATE TABLE notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    config_id UUID REFERENCES notifications_config(id) ON DELETE SET NULL,
    content_id VARCHAR(255) NOT NULL, -- MongoDBのコンテンツID
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL, -- pending, sent, failed, read
    metadata JSONB,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_log_user_id ON notifications_log(user_id);
CREATE INDEX idx_notifications_log_status ON notifications_log(status);
CREATE INDEX idx_notifications_log_created_at ON notifications_log(created_at);
```

#### API_Keys テーブル
```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    permissions JSONB NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
```

### 4.2 MongoDB スキーマ (収集コンテンツ)

#### Contents コレクション
```javascript
{
  _id: ObjectId,
  source_id: String, // PostgreSQL sources.id
  type: String, // article, tweet, rss_item, web_page
  url: String,
  title: String,
  content: String,
  summary: String, // AI生成サマリー
  author: {
    name: String,
    url: String,
    avatar: String
  },
  metadata: {
    source_name: String,
    published_at: Date,
    language: String,
    tags: [String],
    entities: [String], // 抽出されたエンティティ
    keywords: [String]
  },
  media: [{
    type: String, // image, video
    url: String,
    thumbnail: String
  }],
  analysis: {
    sentiment: Number, // -1 to 1
    category: String,
    relevance_score: Number,
    entities: [String],
    topics: [String]
  },
  engagement: {
    views: Number,
    likes: Number,
    shares: Number,
    comments: Number
  },
  matched_filters: [String], // マッチしたfilter_idのリスト
  collected_at: Date,
  processed_at: Date,
  indexed_at: Date,
  created_at: Date,
  updated_at: Date
}

// インデックス
db.contents.createIndex({ source_id: 1, collected_at: -1 });
db.contents.createIndex({ "metadata.published_at": -1 });
db.contents.createIndex({ matched_filters: 1 });
db.contents.createIndex({ "analysis.sentiment": 1 });
db.contents.createIndex({ "metadata.keywords": 1 });
```

#### Crawl_Queue コレクション
```javascript
{
  _id: ObjectId,
  source_id: String,
  url: String,
  priority: Number,
  status: String, // pending, processing, completed, failed
  retry_count: Number,
  max_retries: Number,
  scheduled_at: Date,
  started_at: Date,
  completed_at: Date,
  error: String,
  created_at: Date
}

db.crawl_queue.createIndex({ status: 1, priority: -1, scheduled_at: 1 });
db.crawl_queue.createIndex({ source_id: 1 });
```

### 4.3 Redis キー設計

```
# セッション
session:{user_id} -> ハッシュ (セッションデータ)

# キャッシュ
cache:user:{user_id}:profile -> JSON
cache:content:{content_id} -> JSON
cache:filters:{user_id} -> JSON

# レート制限
ratelimit:{user_id}:{endpoint} -> カウンタ (TTL付き)

# リアルタイム通知キュー
queue:notifications:{user_id} -> リスト

# 処理ロック
lock:crawl:{source_id} -> 文字列 (TTL付き)

# Pub/Sub チャネル
channel:notifications:{user_id}
channel:content:updates
```

### 4.4 Elasticsearch インデックス

```json
{
  "mappings": {
    "properties": {
      "content_id": { "type": "keyword" },
      "title": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "content": {
        "type": "text",
        "analyzer": "standard"
      },
      "summary": { "type": "text" },
      "url": { "type": "keyword" },
      "author": {
        "properties": {
          "name": { "type": "text" }
        }
      },
      "metadata": {
        "properties": {
          "published_at": { "type": "date" },
          "language": { "type": "keyword" },
          "tags": { "type": "keyword" },
          "keywords": { "type": "keyword" }
        }
      },
      "analysis": {
        "properties": {
          "sentiment": { "type": "float" },
          "category": { "type": "keyword" },
          "topics": { "type": "keyword" }
        }
      },
      "collected_at": { "type": "date" }
    }
  }
}
```

### 4.5 ER図

```
┌─────────────┐
│   Users     │
├─────────────┤
│ id (PK)     │──┐
│ email       │  │
│ username    │  │
│ ...         │  │
└─────────────┘  │
                 │
        ┌────────┴────────┬────────────────┬──────────────┐
        │                 │                │              │
        ▼                 ▼                ▼              ▼
┌─────────────┐   ┌──────────────┐  ┌────────────┐  ┌──────────┐
│   Sources   │   │   Filters    │  │  API_Keys  │  │Notif_Log │
├─────────────┤   ├──────────────┤  ├────────────┤  ├──────────┤
│ id (PK)     │   │ id (PK)      │──┐│ id (PK)    │  │ id (PK)  │
│ user_id(FK) │   │ user_id (FK) │  ││ user_id(FK)│  │user_id   │
│ type        │   │ conditions   │  │└────────────┘  │content_id│
│ config      │   │ priority     │  │                │channel   │
└─────────────┘   └──────────────┘  │                │status    │
                                    │                └──────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │Notifications_Cfg │
                           ├──────────────────┤
                           │ id (PK)          │
                           │ user_id (FK)     │
                           │ filter_id (FK)   │
                           │ channels         │
                           │ schedule         │
                           └──────────────────┘

MongoDB (Contents) ←→ PostgreSQL (Sources, Filters)
      ↓
Elasticsearch (全文検索インデックス)
```

---

## 5. API設計

### 5.1 API設計原則
- **RESTful**: リソースベースのURL設計
- **GraphQL**: 複雑なクエリとリアルタイム更新
- **バージョニング**: `/api/v1/` 形式
- **レート制限**: ユーザーティアに応じた制限
- **認証**: JWT + Refresh Token

### 5.2 REST API エンドポイント

#### 認証 API (`/api/v1/auth`)

| メソッド | エンドポイント | 説明 | リクエスト | レスポンス |
|---------|--------------|------|-----------|-----------|
| POST | `/register` | ユーザー登録 | `{email, username, password}` | `{user, token}` |
| POST | `/login` | ログイン | `{email, password}` | `{user, access_token, refresh_token}` |
| POST | `/logout` | ログアウト | - | `{message}` |
| POST | `/refresh` | トークン更新 | `{refresh_token}` | `{access_token}` |
| POST | `/verify-email` | メール確認 | `{token}` | `{message}` |
| POST | `/forgot-password` | パスワードリセット | `{email}` | `{message}` |
| POST | `/reset-password` | パスワード再設定 | `{token, password}` | `{message}` |

#### ユーザー API (`/api/v1/users`)

| メソッド | エンドポイント | 説明 | リクエスト | レスポンス |
|---------|--------------|------|-----------|-----------|
| GET | `/me` | 現在のユーザー情報 | - | `{user}` |
| PUT | `/me` | ユーザー情報更新 | `{full_name, timezone, language}` | `{user}` |
| DELETE | `/me` | アカウント削除 | - | `{message}` |
| GET | `/me/stats` | 統計情報 | - | `{stats}` |
| PUT | `/me/preferences` | 設定更新 | `{preferences}` | `{preferences}` |

#### 情報ソース API (`/api/v1/sources`)

| メソッド | エンドポイント | 説明 | リクエスト | レスポンス |
|---------|--------------|------|-----------|-----------|
| GET | `/` | ソース一覧取得 | `?page=1&limit=20&type=rss` | `{sources[], pagination}` |
| POST | `/` | ソース作成 | `{name, type, config}` | `{source}` |
| GET | `/:id` | ソース詳細 | - | `{source}` |
| PUT | `/:id` | ソース更新 | `{name, config, is_active}` | `{source}` |
| DELETE | `/:id` | ソース削除 | - | `{message}` |
| POST | `/:id/test` | ソーステスト | - | `{status, sample_data}` |
| GET | `/:id/stats` | ソース統計 | `?period=7d` | `{stats}` |

#### フィルター API (`/api/v1/filters`)

| メソッド | エンドポイント | 説明 | リクエスト | レスポンス |
|---------|--------------|------|-----------|-----------|
| GET | `/` | フィルター一覧 | `?page=1&limit=20` | `{filters[], pagination}` |
| POST | `/` | フィルター作成 | `{name, conditions, priority}` | `{filter}` |
| GET | `/:id` | フィルター詳細 | - | `{filter}` |
| PUT | `/:id` | フィルター更新 | `{name, conditions}` | `{filter}` |
| DELETE | `/:id` | フィルター削除 | - | `{message}` |
| POST | `/:id/test` | フィルターテスト | `{sample_content}` | `{matched, details}` |
| GET | `/:id/matches` | マッチ履歴 | `?period=7d&limit=100` | `{contents[]}` |

#### コンテンツ API (`/api/v1/contents`)

| メソッド | エンドポイント | 説明 | リクエスト | レスポンス |
|---------|--------------|------|-----------|-----------|
| GET | `/` | コンテンツ一覧 | `?page=1&limit=20&filter_id=uuid` | `{contents[], pagination}` |
| GET | `/:id` | コンテンツ詳細 | - | `{content}` |
| POST | `/search` | 全文検索 | `{query, filters, sort}` | `{results[], pagination}` |
| GET | `/:id/similar` | 類似コンテンツ | `?limit=10` | `{contents[]}` |
| POST | `/:id/mark-read` | 既読マーク | - | `{message}` |
| POST | `/:id/save` | お気に入り保存 | - | `{message}` |
| GET | `/saved` | 保存済みコンテンツ | `?page=1&limit=20` | `{contents[], pagination}` |

#### 通知設定 API (`/api/v1/notifications/config`)

| メソッド | エンドポイント | 説明 | リクエスト | レスポンス |
|---------|--------------|------|-----------|-----------|
| GET | `/` | 通知設定一覧 | - | `{configs[]}` |
| POST | `/` | 通知設定作成 | `{filter_id, channels, schedule}` | `{config}` |
| GET | `/:id` | 通知設定詳細 | - | `{config}` |
| PUT | `/:id` | 通知設定更新 | `{channels, schedule, quiet_hours}` | `{config}` |
| DELETE | `/:id` | 通知設定削除 | - | `{message}` |
| POST | `/:id/test` | テスト通知送信 | - | `{message}` |

#### 通知履歴 API (`/api/v1/notifications/log`)

| メソッド | エンドポイント | 説明 | リクエスト | レスポンス |
|---------|--------------|------|-----------|-----------|
| GET | `/` | 通知履歴一覧 | `?page=1&limit=20&status=sent` | `{logs[], pagination}` |
| GET | `/:id` | 通知詳細 | - | `{log}` |
| POST | `/:id/mark-read` | 既読マーク | - | `{message}` |
| POST | `/mark-all-read` | 全て既読 | - | `{count}` |
| GET | `/unread-count` | 未読数 | - | `{count}` |

#### 分析 API (`/api/v1/analytics`)

| メソッド | エンドポイント | 説明 | リクエスト | レスポンス |
|---------|--------------|------|-----------|-----------|
| GET | `/dashboard` | ダッシュボード統計 | `?period=7d` | `{stats}` |
| GET | `/trends` | トレンド分析 | `?period=30d` | `{trends[]}` |
| GET | `/sources/performance` | ソースパフォーマンス | `?period=7d` | `{performance[]}` |
| GET | `/filters/effectiveness` | フィルター効果分析 | `?period=7d` | `{effectiveness[]}` |
| GET | `/sentiment/timeline` | 感情分析タイムライン | `?period=30d&filter_id=uuid` | `{timeline[]}` |

#### Webhook API (`/api/v1/webhooks`)

| メソッド | エンドポイント | 説明 | リクエスト | レスポンス |
|---------|--------------|------|-----------|-----------|
| GET | `/` | Webhook一覧 | - | `{webhooks[]}` |
| POST | `/` | Webhook作成 | `{url, events[], secret}` | `{webhook}` |
| GET | `/:id` | Webhook詳細 | - | `{webhook}` |
| PUT | `/:id` | Webhook更新 | `{url, events}` | `{webhook}` |
| DELETE | `/:id` | Webhook削除 | - | `{message}` |
| POST | `/:id/test` | Webhookテスト | - | `{status, response}` |

### 5.3 GraphQL スキーマ

```graphql
type User {
  id: ID!
  email: String!
  username: String!
  fullName: String
  timezone: String!
  language: String!
  subscriptionTier: SubscriptionTier!
  sources: [Source!]!
  filters: [Filter!]!
  notificationConfigs: [NotificationConfig!]!
  stats: UserStats!
  createdAt: DateTime!
}

type Source {
  id: ID!
  userId: ID!
  name: String!
  type: SourceType!
  config: JSON!
  isActive: Boolean!
  checkInterval: Int!
  lastCheckedAt: DateTime
  errorCount: Int!
  stats(period: Period): SourceStats!
  contents(limit: Int, offset: Int): ContentConnection!
  createdAt: DateTime!
}

type Filter {
  id: ID!
  userId: ID!
  name: String!
  description: String
  conditions: JSON!
  priority: Int!
  isActive: Boolean!
  matchCount(period: Period): Int!
  matches(limit: Int, offset: Int): ContentConnection!
  effectiveness: FilterEffectiveness!
  createdAt: DateTime!
}

type Content {
  id: ID!
  sourceId: ID!
  type: ContentType!
  url: String!
  title: String!
  content: String!
  summary: String
  author: Author
  metadata: ContentMetadata!
  media: [Media!]!
  analysis: ContentAnalysis!
  engagement: EngagementMetrics
  matchedFilters: [Filter!]!
  similar(limit: Int): [Content!]!
  collectedAt: DateTime!
}

type NotificationConfig {
  id: ID!
  userId: ID!
  filter: Filter!
  channels: NotificationChannels!
  schedule: JSON
  quietHours: JSON
  batchConfig: JSON
  isActive: Boolean!
  stats(period: Period): NotificationStats!
  createdAt: DateTime!
}

type NotificationLog {
  id: ID!
  userId: ID!
  config: NotificationConfig
  content: Content!
  channel: NotificationChannel!
  status: NotificationStatus!
  metadata: JSON
  sentAt: DateTime
  readAt: DateTime
  createdAt: DateTime!
}

enum SourceType {
  RSS
  TWITTER
  WEB
  NEWS_API
  WEBHOOK
}

enum ContentType {
  ARTICLE
  TWEET
  RSS_ITEM
  WEB_PAGE
}

enum SubscriptionTier {
  FREE
  PRO
  ENTERPRISE
}

enum NotificationChannel {
  EMAIL
  PUSH
  WEBHOOK
  DESKTOP
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
  READ
}

enum Period {
  DAY
  WEEK
  MONTH
  YEAR
}

type Query {
  # ユーザー
  me: User!

  # ソース
  sources(limit: Int, offset: Int, type: SourceType): SourceConnection!
  source(id: ID!): Source

  # フィルター
  filters(limit: Int, offset: Int): FilterConnection!
  filter(id: ID!): Filter

  # コンテンツ
  contents(
    limit: Int
    offset: Int
    filterId: ID
    sourceId: ID
    period: Period
  ): ContentConnection!
  content(id: ID!): Content
  searchContents(
    query: String!
    filters: SearchFilters
    limit: Int
    offset: Int
  ): ContentConnection!

  # 通知
  notificationConfigs: [NotificationConfig!]!
  notificationConfig(id: ID!): NotificationConfig
  notificationLogs(
    limit: Int
    offset: Int
    status: NotificationStatus
  ): NotificationLogConnection!
  unreadNotificationCount: Int!

  # 分析
  dashboardStats(period: Period): DashboardStats!
  trends(period: Period): [Trend!]!
  sentimentTimeline(period: Period, filterId: ID): [SentimentDataPoint!]!
}

type Mutation {
  # 認証
  login(email: String!, password: String!): AuthPayload!
  register(email: String!, username: String!, password: String!): AuthPayload!

  # ソース
  createSource(input: CreateSourceInput!): Source!
  updateSource(id: ID!, input: UpdateSourceInput!): Source!
  deleteSource(id: ID!): Boolean!
  testSource(id: ID!): SourceTestResult!

  # フィルター
  createFilter(input: CreateFilterInput!): Filter!
  updateFilter(id: ID!, input: UpdateFilterInput!): Filter!
  deleteFilter(id: ID!): Boolean!
  testFilter(id: ID!, sampleContent: String!): FilterTestResult!

  # 通知設定
  createNotificationConfig(input: CreateNotificationConfigInput!): NotificationConfig!
  updateNotificationConfig(id: ID!, input: UpdateNotificationConfigInput!): NotificationConfig!
  deleteNotificationConfig(id: ID!): Boolean!

  # 通知アクション
  markNotificationAsRead(id: ID!): Boolean!
  markAllNotificationsAsRead: Int!

  # コンテンツアクション
  markContentAsRead(id: ID!): Boolean!
  saveContent(id: ID!): Boolean!
}

type Subscription {
  # 新しいコンテンツ
  newContent(filterId: ID): Content!

  # 新しい通知
  newNotification: NotificationLog!

  # ソースステータス更新
  sourceStatusUpdated(sourceId: ID!): Source!
}
```

### 5.4 WebSocket イベント

```javascript
// クライアント → サーバー
{
  "type": "subscribe",
  "channel": "notifications",
  "filter_id": "uuid" // オプション
}

{
  "type": "unsubscribe",
  "channel": "notifications"
}

// サーバー → クライアント
{
  "type": "notification",
  "data": {
    "id": "uuid",
    "content": {...},
    "channel": "push",
    "timestamp": "2025-11-18T00:00:00Z"
  }
}

{
  "type": "content_update",
  "data": {
    "id": "uuid",
    "action": "new|updated|deleted",
    "content": {...}
  }
}

{
  "type": "source_status",
  "data": {
    "source_id": "uuid",
    "status": "active|error|disabled",
    "message": "..."
  }
}
```

---

## 6. フロントエンド設計

### 6.1 ページ構成

```
/                          - ランディングページ
/login                     - ログイン
/register                  - 新規登録
/dashboard                 - メインダッシュボード
/sources                   - 情報ソース管理
  /sources/new             - 新規ソース作成
  /sources/:id             - ソース詳細・編集
/filters                   - フィルター管理
  /filters/new             - 新規フィルター作成
  /filters/:id             - フィルター詳細・編集
/notifications             - 通知管理
  /notifications/config    - 通知設定
  /notifications/history   - 通知履歴
/contents                  - コンテンツ一覧
  /contents/:id            - コンテンツ詳細
  /contents/saved          - 保存済みコンテンツ
/analytics                 - 分析ダッシュボード
/settings                  - 設定
  /settings/profile        - プロフィール
  /settings/preferences    - 環境設定
  /settings/api-keys       - API キー管理
  /settings/billing        - 料金・プラン
```

### 6.2 UI/UX ワイヤーフレーム

#### ダッシュボード (`/dashboard`)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard   Sources   Filters   Notifications   [👤]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   📊 Stats   │  │  🔔 Alerts   │  │  📈 Trends   │         │
│  │              │  │              │  │              │         │
│  │  1,234       │  │    12 New    │  │  ↑ 45%      │         │
│  │  Contents    │  │  Notifications│  │  This Week  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  Recent Notifications                           [View All →]   │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ 🔴 [AI] Breaking: New AI model released               │    │
│  │    TechCrunch • 5 min ago                    [View]   │    │
│  ├───────────────────────────────────────────────────────┤    │
│  │ 🟡 [Market] Stock market update                       │    │
│  │    Bloomberg • 15 min ago                    [View]   │    │
│  ├───────────────────────────────────────────────────────┤    │
│  │ 🟢 [Tech] GitHub releases new features                │    │
│  │    GitHub Blog • 1 hour ago                  [View]   │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  Sentiment Timeline                                            │
│  ┌───────────────────────────────────────────────────────┐    │
│  │        ╱╲                                             │    │
│  │       ╱  ╲        ╱╲                                  │    │
│  │  ────╱    ╲──────╱  ╲────────                         │    │
│  │                                                        │    │
│  │  Mon   Tue   Wed   Thu   Fri   Sat   Sun             │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  Active Sources: 8    Active Filters: 12                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### ソース管理 (`/sources`)

```
┌─────────────────────────────────────────────────────────────────┐
│ Sources                                       [+ New Source]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Search sources...]              Filter: [All ▼] [Active ▼]   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ 📰 TechCrunch RSS                           [Active ✓] │    │
│  │ RSS • Checks every 5 min                              │    │
│  │ Last checked: 2 min ago • 145 items collected         │    │
│  │                                     [Edit] [Delete]    │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ 🐦 @elonmusk Twitter                        [Active ✓] │    │
│  │ Twitter • Checks every 10 min                         │    │
│  │ Last checked: 8 min ago • 23 tweets collected         │    │
│  │                                     [Edit] [Delete]    │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ 🌐 Hacker News                              [Active ✓] │    │
│  │ Web Scraper • Checks every 15 min                     │    │
│  │ Last checked: 3 min ago • 87 items collected          │    │
│  │                                     [Edit] [Delete]    │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  Showing 3 of 8 sources                       [1] 2 3 Next    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### フィルター作成 (`/filters/new`)

```
┌─────────────────────────────────────────────────────────────────┐
│ Create New Filter                                    [Cancel]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Filter Name *                                                  │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ AI & Machine Learning News                            │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  Description                                                    │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ Track latest developments in AI and ML                │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  Conditions                                    Logic: [AND ▼]  │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ [Keywords ▼] [Contains ▼] [AI, ML, GPT, LLM...]     │ [×] │
│  └───────────────────────────────────────────────────────┘    │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ [Sentiment ▼] [>=      ▼] [0.3              ]       │ [×] │
│  └───────────────────────────────────────────────────────┘    │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ [Source Type▼] [In     ▼] [News, RSS        ]       │ [×] │
│  └───────────────────────────────────────────────────────┘    │
│                                                [+ Add Rule]    │
│                                                                 │
│  Priority                                                       │
│  ┌────┬────┬────┬────┬────┐                                   │
│  │ 1  │ 2  │ 3  │[4] │ 5  │  (Higher = More important)        │
│  └────┴────┴────┴────┴────┘                                   │
│                                                                 │
│  ☑ Active                                                      │
│                                                                 │
│                                [Test Filter] [Create Filter]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 通知設定 (`/notifications/config`)

```
┌─────────────────────────────────────────────────────────────────┐
│ Notification Settings                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Filter: [AI & Machine Learning News ▼]                        │
│                                                                 │
│  Notification Channels                                          │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ ☑ Email                                               │    │
│  │   📧 user@example.com                                 │    │
│  │   Send as: ○ Instant  ● Digest (hourly)              │    │
│  ├───────────────────────────────────────────────────────┤    │
│  │ ☑ Push Notification                                   │    │
│  │   📱 Devices: iPhone, Desktop (2 devices)             │    │
│  │   Priority: ● High  ○ Normal                          │    │
│  ├───────────────────────────────────────────────────────┤    │
│  │ ☐ Webhook                                             │    │
│  │   🔗 URL: [https://...]                               │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  Schedule                                                       │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ ☑ Enable Quiet Hours                                  │    │
│  │   From: [22:00] To: [07:00]                           │    │
│  │   Timezone: [Asia/Tokyo ▼]                            │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  Batch Settings                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ ● Send individually                                    │    │
│  │ ○ Batch by time (max [10] notifications per [1] hour) │    │
│  │ ○ Daily digest at [09:00]                             │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│                                  [Test Notification] [Save]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 コンポーネント設計

#### 主要コンポーネント一覧

```
components/
├── layout/
│   ├── Header.tsx              - グローバルヘッダー
│   ├── Sidebar.tsx             - サイドバーナビゲーション
│   ├── Footer.tsx              - フッター
│   └── DashboardLayout.tsx     - ダッシュボードレイアウト
├── auth/
│   ├── LoginForm.tsx           - ログインフォーム
│   ├── RegisterForm.tsx        - 登録フォーム
│   └── ProtectedRoute.tsx      - 認証保護ルート
├── sources/
│   ├── SourceCard.tsx          - ソースカード
│   ├── SourceList.tsx          - ソース一覧
│   ├── SourceForm.tsx          - ソース作成・編集フォーム
│   └── SourceTypeSelector.tsx  - ソースタイプ選択
├── filters/
│   ├── FilterCard.tsx          - フィルターカード
│   ├── FilterList.tsx          - フィルター一覧
│   ├── FilterForm.tsx          - フィルター作成・編集フォーム
│   ├── ConditionBuilder.tsx    - 条件ビルダー
│   └── FilterTester.tsx        - フィルターテスター
├── notifications/
│   ├── NotificationCard.tsx    - 通知カード
│   ├── NotificationList.tsx    - 通知一覧
│   ├── NotificationConfig.tsx  - 通知設定フォーム
│   └── NotificationBadge.tsx   - 未読バッジ
├── contents/
│   ├── ContentCard.tsx         - コンテンツカード
│   ├── ContentList.tsx         - コンテンツ一覧
│   ├── ContentDetail.tsx       - コンテンツ詳細
│   ├── ContentSearch.tsx       - 検索フォーム
│   └── SavedContents.tsx       - 保存済み一覧
├── analytics/
│   ├── DashboardStats.tsx      - 統計カード
│   ├── SentimentChart.tsx      - 感情分析チャート
│   ├── TrendChart.tsx          - トレンドチャート
│   └── SourcePerformance.tsx   - ソースパフォーマンス
└── common/
    ├── Button.tsx              - ボタン
    ├── Input.tsx               - 入力フィールド
    ├── Select.tsx              - セレクトボックス
    ├── Modal.tsx               - モーダル
    ├── Toast.tsx               - トースト通知
    ├── Pagination.tsx          - ページネーション
    ├── LoadingSpinner.tsx      - ローディング
    └── ErrorBoundary.tsx       - エラーバウンダリー
```

### 6.4 状態管理設計

```typescript
// Zustand Store 構造

// Auth Store
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// Sources Store
interface SourcesStore {
  sources: Source[];
  selectedSource: Source | null;
  loading: boolean;
  error: string | null;
  fetchSources: () => Promise<void>;
  createSource: (data: CreateSourceInput) => Promise<void>;
  updateSource: (id: string, data: UpdateSourceInput) => Promise<void>;
  deleteSource: (id: string) => Promise<void>;
}

// Filters Store
interface FiltersStore {
  filters: Filter[];
  selectedFilter: Filter | null;
  loading: boolean;
  error: string | null;
  fetchFilters: () => Promise<void>;
  createFilter: (data: CreateFilterInput) => Promise<void>;
  updateFilter: (id: string, data: UpdateFilterInput) => Promise<void>;
  deleteFilter: (id: string) => Promise<void>;
}

// Notifications Store
interface NotificationsStore {
  notifications: NotificationLog[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  subscribeToNotifications: () => void;
}

// UI Store
interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}
```

---

## 7. 通知システム設計

### 7.1 通知フロー

```
┌─────────────┐
│ Content     │
│ Collected   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Filter      │
│ Matching    │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│ Notification│────▶│ Rate Limiter │
│ Generator   │     └──────┬───────┘
└─────────────┘            │
                           ▼
                    ┌──────────────┐
                    │ Queue        │
                    │ (RabbitMQ)   │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌──────────────┐  ┌──────────────┐
│ Email Worker  │  │ Push Worker  │  │Webhook Worker│
└───────┬───────┘  └──────┬───────┘  └──────┬───────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌──────────────┐  ┌──────────────┐
│ SendGrid/SES  │  │     FCM      │  │  HTTP POST   │
└───────────────┘  └──────────────┘  └──────────────┘
```

### 7.2 通知チャネル詳細

#### Email 通知
- **プロバイダー**: SendGrid / AWS SES
- **テンプレート**: HTML + Plain Text
- **配信モード**: 即時 / バッチ / ダイジェスト
- **機能**:
  - パーソナライズ
  - 開封トラッキング
  - リンクトラッキング
  - アンサブスクライブ管理

#### プッシュ通知
- **プロバイダー**: Firebase Cloud Messaging (FCM)
- **プラットフォーム**: iOS, Android, Web
- **優先度**: High / Normal
- **機能**:
  - リッチ通知 (画像、アクション)
  - バッジカウント
  - サウンド・バイブレーション
  - ディープリンク

#### デスクトップ通知
- **技術**: Electron Notifications API / Web Notifications API
- **機能**:
  - ネイティブOS統合
  - アクションボタン
  - 通知センター統合

#### Webhook 通知
- **プロトコル**: HTTPS POST
- **認証**: HMAC署名
- **リトライ**: 指数バックオフ (最大5回)
- **ペイロード**: JSON

```json
{
  "event": "notification.created",
  "timestamp": "2025-11-18T00:00:00Z",
  "data": {
    "notification_id": "uuid",
    "user_id": "uuid",
    "filter_id": "uuid",
    "content": {
      "id": "uuid",
      "title": "...",
      "url": "...",
      "summary": "..."
    }
  },
  "signature": "hmac-sha256-signature"
}
```

### 7.3 通知優先度・レート制限

#### 優先度レベル
- **Critical (P0)**: 即時配信、レート制限なし
- **High (P1)**: 5分以内、最大100/時間
- **Normal (P2)**: 15分以内、最大50/時間
- **Low (P3)**: 1時間以内、最大20/時間

#### サブスクリプション別制限

| ティア | Email/日 | Push/日 | Webhook/日 | 同時ソース |
|--------|----------|---------|-----------|-----------|
| Free | 50 | 100 | - | 3 |
| Pro | 500 | 1,000 | 1,000 | 20 |
| Enterprise | 無制限 | 無制限 | 無制限 | 無制限 |

### 7.4 通知テンプレート

#### Email テンプレート例

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Content Alert</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #f5f5f5; padding: 20px;">
    <h1 style="color: #333;">{{filter_name}}</h1>
    <p style="color: #666;">You have {{count}} new items matching your filter</p>
  </div>

  {{#each contents}}
  <div style="background: white; margin: 20px 0; padding: 20px; border-radius: 8px;">
    <h2 style="margin: 0 0 10px 0;">
      <a href="{{url}}" style="color: #0066cc; text-decoration: none;">{{title}}</a>
    </h2>
    <p style="color: #666; font-size: 14px;">{{source}} • {{published_at}}</p>
    <p style="color: #333;">{{summary}}</p>
    <div style="margin-top: 15px;">
      <span style="background: {{sentiment_color}}; padding: 5px 10px; border-radius: 4px; font-size: 12px;">
        Sentiment: {{sentiment_label}}
      </span>
    </div>
  </div>
  {{/each}}

  <div style="text-align: center; padding: 20px;">
    <a href="{{dashboard_url}}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
      View All in Dashboard
    </a>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{settings_url}}">Settings</a>
  </div>
</body>
</html>
```

### 7.5 サイレント時間・スケジューリング

```typescript
interface QuietHours {
  enabled: boolean;
  timezone: string;
  periods: Array<{
    start: string; // "22:00"
    end: string;   // "07:00"
    days: number[]; // [0-6] 0=Sunday
  }>;
}

interface NotificationSchedule {
  type: 'instant' | 'batch' | 'digest';
  batchInterval?: number; // minutes
  digestTime?: string;    // "09:00"
  maxPerBatch?: number;
}
```

---

## 8. セキュリティ設計

### 8.1 認証・認可

#### JWT認証フロー
```
1. ユーザーログイン
   ├─> 認証情報検証
   └─> Access Token (15分) + Refresh Token (7日) 発行

2. API リクエスト
   ├─> Access Token 検証
   ├─> 有効期限チェック
   └─> ユーザー権限確認

3. トークン更新
   ├─> Refresh Token 検証
   └─> 新しい Access Token 発行
```

#### トークン構造
```json
// Access Token
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "user",
  "tier": "pro",
  "iat": 1234567890,
  "exp": 1234568790
}

// Refresh Token
{
  "sub": "user_id",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1235172690
}
```

### 8.2 データ保護

#### 暗号化
- **転送時**: TLS 1.3
- **保存時**:
  - パスワード: bcrypt (cost factor 12)
  - API キー: SHA-256 ハッシュ
  - 機密データ: AES-256-GCM

#### データマスキング
```typescript
// ログ出力時の機密データマスキング
{
  "email": "u***@example.com",
  "api_key": "sk_**********************",
  "webhook_url": "https://*****.com/webhook"
}
```

### 8.3 API セキュリティ

#### レート制限
```
フリーティア:
  - 100 req/min
  - 1,000 req/hour
  - 10,000 req/day

Proティア:
  - 500 req/min
  - 10,000 req/hour
  - 100,000 req/day

Enterprise:
  - カスタム
```

#### CORS設定
```typescript
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    /\.yourdomain\.com$/
  ],
  credentials: true,
  maxAge: 86400
};
```

#### CSP (Content Security Policy)
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' wss://api.yourdomain.com;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
```

### 8.4 入力検証

```typescript
// Zod スキーマ例
const createSourceSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['rss', 'twitter', 'web', 'news_api', 'webhook']),
  config: z.object({
    url: z.string().url().optional(),
    keywords: z.array(z.string()).optional(),
    apiKey: z.string().optional()
  }),
  checkInterval: z.number().min(60).max(86400)
});
```

### 8.5 脆弱性対策

#### SQLインジェクション
- パラメータ化クエリ (Prepared Statements)
- ORM使用 (Prisma/TypeORM)

#### XSS (Cross-Site Scripting)
- 入力サニタイゼーション
- 出力エスケープ
- DOMPurify 使用

#### CSRF (Cross-Site Request Forgery)
- SameSite Cookie
- CSRF トークン

#### NoSQL インジェクション
- 入力検証
- Mongoose スキーマ検証

### 8.6 監査ログ

```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: string; // login, create_source, delete_filter, etc.
  resource: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

// 記録対象アクション
- 認証: ログイン、ログアウト、パスワード変更
- リソース操作: 作成、更新、削除
- 設定変更: 通知設定、APIキー管理
- データアクセス: エクスポート、大量ダウンロード
```

### 8.7 依存関係管理

```bash
# セキュリティ監査
npm audit
npm audit fix

# 依存関係更新
npm update

# 脆弱性スキャン (CI/CD)
- Snyk
- Dependabot
- OWASP Dependency-Check
```

---

## 9. 開発ロードマップ

### 9.1 フェーズ1: MVP (2-3ヶ月)

#### Sprint 1-2: 基盤構築 (3週間)
- [ ] プロジェクトセットアップ
  - モノレポ構成 (Nx/Turborepo)
  - 開発環境構築 (Docker Compose)
  - CI/CD パイプライン
- [ ] 認証システム
  - ユーザー登録・ログイン
  - JWT認証
  - パスワードリセット
- [ ] データベース構築
  - PostgreSQL スキーマ
  - MongoDB セットアップ
  - Redis セットアップ

#### Sprint 3-4: コア機能 (3週間)
- [ ] 情報ソース管理
  - RSS フィード対応
  - ソースCRUD API
  - 収集ワーカー (基本版)
- [ ] フィルター機能
  - キーワードフィルター
  - フィルターCRUD API
  - マッチング エンジン
- [ ] 基本ダッシュボード
  - ログイン画面
  - ソース管理画面
  - フィルター管理画面

#### Sprint 5-6: 通知機能 (3週間)
- [ ] Email通知
  - SendGrid統合
  - 通知テンプレート
  - 通知設定UI
- [ ] 通知管理
  - 通知履歴
  - 既読管理
  - 通知設定

#### Sprint 7: テスト・デプロイ (1週間)
- [ ] テスト
  - ユニットテスト (80%カバレッジ)
  - E2Eテスト (主要フロー)
- [ ] デプロイ
  - ステージング環境
  - プロダクション環境

### 9.2 フェーズ2: v1.0 (2-3ヶ月)

#### 追加機能
- [ ] **拡張ソース対応**
  - Twitter/X API統合
  - News API統合
  - Webスクレイピング

- [ ] **高度なフィルタリング**
  - 正規表現サポート
  - 複合条件 (AND/OR)
  - 除外フィルター

- [ ] **プッシュ通知**
  - Firebase Cloud Messaging
  - iOS/Android対応
  - Web Push

- [ ] **分析機能**
  - ダッシュボード統計
  - トレンド分析
  - ソースパフォーマンス

- [ ] **コンテンツ管理**
  - 全文検索 (Elasticsearch)
  - お気に入り保存
  - タグ付け

- [ ] **モバイルアプリ**
  - React Native (iOS)
  - React Native (Android)

### 9.3 フェーズ3: v2.0 (3-4ヶ月)

#### AI/ML機能
- [ ] **自然言語処理**
  - 感情分析 (NLTK/spaCy)
  - エンティティ抽出
  - 自動要約
  - 言語検出

- [ ] **推奨エンジン**
  - 協調フィルタリング
  - コンテンツベース推奨
  - パーソナライズド通知

- [ ] **スマート通知**
  - 最適タイミング配信
  - 重複排除
  - 優先度自動調整

#### エンタープライズ機能
- [ ] **チーム機能**
  - 組織管理
  - 権限管理 (RBAC)
  - 共有フィルター

- [ ] **Webhook統合**
  - カスタムWebhook
  - Zapier統合
  - Slack/Discord統合

- [ ] **API拡張**
  - GraphQL サブスクリプション
  - Webhook管理API
  - バッチ処理API

- [ ] **高度な分析**
  - カスタムレポート
  - データエクスポート
  - 可視化ダッシュボード

#### インフラ強化
- [ ] **スケーラビリティ**
  - Kubernetes デプロイ
  - 水平スケーリング
  - CDN統合

- [ ] **監視・ログ**
  - Prometheus/Grafana
  - ELK Stack
  - APM (Application Performance Monitoring)

### 9.4 継続的改善

#### パフォーマンス最適化
- GraphQL DataLoader
- Redis キャッシング戦略
- データベース クエリ最適化
- 画像最適化 (WebP, lazy loading)

#### セキュリティ強化
- ペネトレーションテスト
- セキュリティ監査
- GDPR/CCPA コンプライアンス

#### UX改善
- ユーザビリティテスト
- A/Bテスト
- アクセシビリティ対応 (WCAG 2.1)

---

## 10. MVP機能一覧

### 10.1 必須機能 (Must Have)

#### 認証・ユーザー管理
- ✅ ユーザー登録 (Email)
- ✅ ログイン・ログアウト
- ✅ パスワードリセット
- ✅ プロフィール編集

#### 情報ソース
- ✅ RSSフィード追加
- ✅ ソース一覧表示
- ✅ ソース編集・削除
- ✅ 自動収集 (5分間隔)
- ✅ 手動収集トリガー

#### フィルター
- ✅ キーワードフィルター作成
- ✅ フィルター一覧表示
- ✅ フィルター編集・削除
- ✅ 基本的な条件設定 (含む/含まない)

#### 通知
- ✅ Email通知
- ✅ 即時通知
- ✅ 通知履歴表示
- ✅ 既読管理

#### ダッシュボード
- ✅ 通知一覧
- ✅ 基本統計 (コンテンツ数、通知数)
- ✅ ソース・フィルター概要

### 10.2 推奨機能 (Should Have)

#### 通知
- 🔶 バッチ通知 (1時間ごと)
- 🔶 サイレント時間設定
- 🔶 通知テンプレート

#### コンテンツ
- 🔶 コンテンツ詳細表示
- 🔶 基本検索
- 🔶 お気に入り保存

#### 分析
- 🔶 週間統計
- 🔶 ソースごとの収集数

### 10.3 将来機能 (Nice to Have)

- ⭕ プッシュ通知
- ⭕ Twitter/X統合
- ⭕ 感情分析
- ⭕ モバイルアプリ
- ⭕ チーム機能
- ⭕ Webhook統合
- ⭕ 高度な分析

---

## 11. 技術的考慮事項

### 11.1 パフォーマンス最適化

#### フロントエンド
- **コード分割**: Dynamic imports, Route-based splitting
- **画像最適化**: Next.js Image, WebP format
- **キャッシング**: React Query, SWR
- **仮想スクロール**: react-window for long lists
- **レイジーローディング**: Intersection Observer API

#### バックエンド
- **データベースインデックス**: 頻繁なクエリに対して
- **クエリ最適化**: N+1問題の回避
- **キャッシング**: Redis (ホットデータ)
- **接続プーリング**: PostgreSQL, MongoDB
- **非同期処理**: Worker queues

### 11.2 スケーラビリティ戦略

#### 水平スケーリング
```
┌──────────────────────────────────────────┐
│          Load Balancer (Nginx)           │
└─────────────┬────────────────────────────┘
              │
    ┌─────────┼─────────┬─────────┐
    │         │         │         │
┌───▼───┐ ┌──▼───┐ ┌──▼───┐ ┌──▼───┐
│ API   │ │ API  │ │ API  │ │ API  │
│Server1│ │Server2│ │Server3│ │Server4│
└───────┘ └──────┘ └──────┘ └──────┘
```

#### データベース スケーリング
- **PostgreSQL**: Read Replicas, Connection Pooling (PgBouncer)
- **MongoDB**: Sharding, Replica Sets
- **Redis**: Redis Cluster, Sentinel
- **Elasticsearch**: Multi-node cluster

#### ワーカー スケーリング
- Kubernetes HPA (Horizontal Pod Autoscaler)
- キューベースの負荷分散
- Worker専用ノードプール

### 11.3 障害対策

#### 高可用性
- **マルチAZ デプロイ**: 99.9% SLA
- **自動フェイルオーバー**: データベース、Redis
- **ヘルスチェック**: Liveness & Readiness probes
- **サーキットブレーカー**: 外部API呼び出し

#### バックアップ戦略
- **PostgreSQL**: 日次フルバックアップ + WAL アーカイブ
- **MongoDB**: Replica set + 日次スナップショット
- **Redis**: RDB + AOF 永続化
- **保持期間**: 30日間

#### ディザスタリカバリ
- **RPO (Recovery Point Objective)**: 1時間
- **RTO (Recovery Time Objective)**: 4時間
- **マルチリージョン**: DR環境

### 11.4 開発ベストプラクティス

#### コード品質
```json
{
  "lint": "eslint --ext .ts,.tsx src/",
  "format": "prettier --write \"src/**/*.{ts,tsx}\"",
  "type-check": "tsc --noEmit",
  "test": "jest --coverage",
  "test:e2e": "playwright test"
}
```

#### Git フロー
```
main (production)
  └─ develop (staging)
      ├─ feature/user-auth
      ├─ feature/notification-system
      └─ bugfix/email-template
```

#### コミット規約
```
feat: Add Twitter API integration
fix: Resolve email notification delay
docs: Update API documentation
refactor: Optimize filter matching algorithm
test: Add unit tests for notification service
chore: Update dependencies
```

#### コードレビュー
- 2人以上のApprove必須
- 自動テスト通過必須
- コードカバレッジ 80% 維持

---

## 12. 見積もり・リソース

### 12.1 開発チーム構成 (MVP)

| 役割 | 人数 | 期間 |
|-----|------|------|
| フルスタック エンジニア | 2-3名 | 3ヶ月 |
| UI/UX デザイナー | 1名 | 2ヶ月 |
| QAエンジニア | 1名 | 1ヶ月 |
| DevOpsエンジニア | 1名 | Part-time |

### 12.2 インフラコスト見積もり (月額)

#### MVP フェーズ
- **AWS/GCP**: $500-800
  - EC2/Compute Engine: $200
  - RDS/Cloud SQL: $150
  - Redis: $50
  - S3/Cloud Storage: $20
  - その他: $100
- **サードパーティ**:
  - SendGrid: $15-100
  - Sentry: $26
  - ドメイン/SSL: $15
- **合計**: ~$600-1,000/月

#### スケール後 (1万ユーザー想定)
- **インフラ**: $2,000-3,000/月
- **サードパーティ**: $300-500/月
- **合計**: ~$2,500-3,500/月

---

## 付録

### A. 用語集

| 用語 | 説明 |
|-----|------|
| **Filter** | ユーザー定義のコンテンツフィルタリング条件 |
| **Source** | 情報収集元 (RSS, Twitter, etc.) |
| **Channel** | 通知配信チャネル (Email, Push, etc.) |
| **Sentiment** | 感情分析スコア (-1 ~ 1) |
| **Digest** | 複数通知をまとめた配信形式 |

### B. 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)

### C. API レスポンス例

```json
// GET /api/v1/notifications/log
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "content": {
        "id": "content_123",
        "title": "Breaking: New AI Model Released",
        "url": "https://example.com/article",
        "summary": "OpenAI announces GPT-5...",
        "published_at": "2025-11-18T10:00:00Z"
      },
      "channel": "email",
      "status": "sent",
      "sent_at": "2025-11-18T10:05:00Z",
      "read_at": null,
      "created_at": "2025-11-18T10:04:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

---

**ドキュメントバージョン**: 1.0
**最終更新**: 2025-11-18
**作成者**: AI Architect Team
**ステータス**: Draft for Review
