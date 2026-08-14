-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    userID VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- カテゴリーテーブル
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 予定（スケジュール）テーブル
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_fixed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- モックデータの投入
INSERT INTO users (id, email, name) VALUES
(1, 'dev-user@example.com', '開発用ユーザー'),
(2, 'member1@example.com', '佐藤 健'),
(3, 'member2@example.com', '鈴木 一郎')
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (id, name, color) VALUES
(1, '授業・講義', '#3b82f6'),
(2, 'サークル・活動', '#10b981'),
(3, 'アルバイト', '#f59e0b'),
(4, 'プライベート', '#8b5cf6')
ON CONFLICT DO NOTHING;

INSERT INTO schedules (user_id, category_id, title, description, start_time, end_time, is_fixed) VALUES
(1, 1, '経営統計学 講義', '第3教室', '2026-08-17 09:00:00+09', '2026-08-17 10:30:00+09', TRUE),
(1, 2, 'ミーティング', 'オンライン（Zoom）', '2026-08-17 13:00:00+09', '2026-08-17 14:30:00+09', FALSE),
(1, 3, 'イベント運営スタッフ', '東京ガーデンシアター', '2026-08-18 10:00:00+09', '2026-08-18 18:00:00+09', TRUE)
ON CONFLICT DO NOTHING;

-- シーケンスの同期
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('schedules_id_seq', (SELECT MAX(id) FROM schedules));