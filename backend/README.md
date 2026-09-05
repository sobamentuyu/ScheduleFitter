# ScheduleFitter Backend

ScheduleFitter の PHP 8.3 / Apache バックエンドです。PostgreSQL に予定を保存し、Gemini API を用いて自然言語から予定候補を抽出します。

## 提供機能

- セッションを利用した開発用ログイン
- ログインユーザーごとの予定の作成・取得・更新・削除
- 期間指定による予定一覧の絞り込み
- Gemini API による予定候補の抽出

## 起動方法

リポジトリのルートで以下を実行します。

```bash
docker compose up --build
```

起動後の主な接続先は次のとおりです。

| サービス | URL / 接続先 |
| :--- | :--- |
| バックエンド API | `http://localhost:8080` |
| ヘルス確認 | `GET http://localhost:8080/` |
| フロントエンド | `http://localhost:5173` |
| PostgreSQL | `localhost:5432` |

`database/sql/000_create_users.sql` と `database/sql/001_create_events.sql` は、PostgreSQL のデータボリュームを初めて作成するときに自動実行されます。既存ボリュームには自動適用されません。

### ローカル環境変数

Gemini の予定候補 API を使用するには、`Backend/.env` を作成・設定します。`.env` は Git 管理対象外です。

```dotenv
GEMINI_API_KEY=your_google_ai_studio_api_key
GEMINI_MODEL=gemini-3.6-flash
GEMINI_API_TIMEOUT_SECONDS=30
```

Docker Compose 利用時のデータベース接続値は `docker-compose.yml` で設定済みです。

| 変数名 | Docker Compose の値 |
| :--- | :--- |
| `DB_HOST` | `db` |
| `DB_PORT` | `5432` |
| `DB_DATABASE` | `schedulefitter` |
| `DB_USERNAME` | `postgres` |
| `DB_PASSWORD` | `password` |

Docker を使わずに起動する場合は、PHP 8.3、`pdo_pgsql`、`curl`、Composer、および PostgreSQL を用意し、`Backend` ディレクトリで `composer install` を実行してください。

## テスト

予定候補のバリデーションテストは、リポジトリのルートから次のコマンドで実行できます。

```bash
docker compose run --rm --no-deps backend composer test
```

Dockerを使わない場合は、`backend` ディレクトリで実行します。

```bash
composer test
```

このテストでは、Geminiが返す予定候補について、必須キー、各値の型、ISO 8601日時、開始・終了日時の前後関係、ステータスと不足項目の整合性を検証します。

## 認証

予定 API はログイン済みのセッションを必要とします。開発環境では `POST /login.php` に `X-Dev-User-Email` ヘッダーを付けてログインします。初回ログイン時は該当メールアドレスのユーザーが自動作成されます。

```bash
curl -i -X POST http://localhost:8080/login.php \
  -H "X-Dev-User-Email: dev-user@example.com"
```

レスポンスの Cookie を以後のリクエストで送信してください。ブラウザのフロントエンドは `credentials: 'include'` を使用します。

| エンドポイント | 内容 |
| :--- | :--- |
| `POST /login.php` | ログインしてセッションを作成 |
| `GET /me.php` | 現在の認証状態を取得 |
| `POST /logout.php` | ログアウトしてセッションを破棄 |

Cloudflare Access を利用する環境では、`CF-Access-Authenticated-User-Email` ヘッダーもログイン用メールアドレスとして利用できます。

## 予定 API

すべての予定 API はログイン必須です。日時は ISO 8601 形式で指定します。`start` / `end` / `allDay` は、それぞれ `start_at` / `end_at` / `all_day` の別名として入力できます。

| メソッド | エンドポイント | 内容 |
| :--- | :--- | :--- |
| `GET` | `/api/events` | 自分の予定一覧 |
| `GET` | `/api/events/{id}` | 予定の詳細 |
| `POST` | `/api/events` | 予定の作成 |
| `PUT` | `/api/events/{id}` | 予定の部分更新 |
| `DELETE` | `/api/events/{id}` | 予定の削除 |

`GET /api/events` は `from` と `to`（または `start` と `end`）のクエリパラメータで期間を絞り込めます。指定期間と重なる予定が返ります。

### 予定の作成例

```json
{
  "title": "打ち合わせ",
  "description": "企画レビュー",
  "location": "渋谷",
  "category": "仕事",
  "start_at": "2026-09-01T15:00:00+09:00",
  "end_at": "2026-09-01T16:00:00+09:00",
  "all_day": false
}
```

作成時は `title`、`start_at`、`end_at` が必須です。`title` は 255 文字以内、終了日時は開始日時以降である必要があります。成功時は `201 Created` を返します。

予定レスポンスには `id`、`user_id`、各予定フィールド、`created_at`、`updated_at` に加え、互換用の `start`、`end`、`allDay` も含まれます。

## Gemini API による予定候補
バックエンドは、Google の Gemini API を使用して、自然言語のテキストから予定情報を抽出するエンドポイントを提供します。ユーザーからの非構造化入力を、カレンダーイベントに適した構造化された JSON 形式に正規化します。

## 主要コンポーネント

### 1. `GeminiService` (`backend/src/Services/GeminiService.php`)
Gemini の `generateContent` エンドポイントに対する軽量な REST クライアントです。
- cURL を使用して HTTP リクエストを処理します。
- `429 Too Many Requests` エラーに対して、5 秒ずつ待機時間を増やす再試行を実装しています。
- システム指示（System Instruction）と生成設定（Generation Config）をサポートします。

### 2. `ScheduleSuggestionController` (`backend/src/Controllers/ScheduleSuggestionController.php`)
予定抽出リクエストのエントリポイントです。
- エンドポイント: `POST /api/schedule-suggestions`
- `backend/src/Prompts/order.txt` からシステム指示をロードします。
- 「明日」などの相対的な日付を正しく処理するために、現在のサーバー時刻 (Asia/Tokyo) を基準日時としてプロンプトに注入します。

### 3. プロンプト定義 (`backend/src/Prompts/order.txt`)
AI に対する抽出ルールを定義したテキストファイルです。
- 抽出対象のフィールド定義、JSON フォーマットでの出力指示、および抽出時の制約事項が含まれています。
- このファイルの内容は、実行時にシステム指示の一部として Gemini に送信されます。

## ロジックと処理フロー

1.  **リクエストの受付とバリデーション**:
    `ScheduleSuggestionController` が `ScheduleSuggestionPayload` を使用して、ユーザーからの入力テキスト（最大 4,000 文字）を検証します。
2.  **システム指示の構築**:
    `backend/src/Prompts/order.txt` の内容を読み込み、末尾に「現在の基準日時 (Asia/Tokyo)」を追記します。これにより、Gemini は「今日」や「来週」といった相対的な表現を絶対的な日付（ISO 8601）に変換できるようになります。
3.  **AI へのリクエスト**:
    `GeminiService` が `systemInstruction`（役割と基準日時）と `contents`（ユーザーの入力テキスト）を JSON ペイロードとして構築し、Gemini API へ POST リクエストを送信します。
4.  **リトライロジック**:
    API がレート制限（HTTP 429）を返した場合、最大 3 回まで、待機時間を 5 秒、10 秒、15 秒と増やしながら再試行します。
5.  **構造化データの検証**:
    Gemini から返されたJSONをデコードし、必須キー、各値の型、日時形式、ステータスと不足項目の整合性を検証してから `suggestion` フィールドに入れて返します。

## エラーハンドリング

-   **422 Unprocessable Entity**: リクエストボディが不正、または入力が空の場合。
-   **502 Bad Gateway**: Gemini API との通信に失敗した、または API が期待される形式のレスポンスを返さなかった場合。
-   **タイムアウト**: デフォルトで 30 秒のリクエストタイムアウトが設定されています。

## API の使用方法

### リクエスト
**エンドポイント:** `POST /api/schedule-suggestions`

**ボディ:**
```json
{
  "request": "明日の15時から渋谷で打ち合わせ"
}
```

### レスポンス
Gemini が生成した提案を含む JSON オブジェクトを返します。

```json
{
  "suggestion": {
    "status": "needs_clarification",
    "event": {
      "title": "打ち合わせ",
      "description": null,
      "location": "渋谷",
      "category": null,
      "start_at": "2026-09-06T15:00:00+09:00",
      "end_at": null,
      "all_day": false
    },
    "missing_fields": ["end_at"]
  }
}
```

## データスキーマ
AI は `suggestion` 文字列内に以下の構造を返すように指示されています。

| フィールド | 型 | 説明 |
| :--- | :--- | :--- |
| `status` | `string` | `ready` または `needs_clarification`。 |
| `event.title` | `string` | イベントのタイトル。 |
| `event.start_at` | `string \| null` | ISO 8601 形式の日時、または `null`。 |
| `event.end_at` | `string \| null` | ISO 8601 形式の日時、または `null`。 |
| `event.all_day` | `boolean` | 終日イベントの場合は `true`。 |
| `missing_fields` | `string[]` | 不足している情報のリスト（例: `date`, `start_at`）。 |
