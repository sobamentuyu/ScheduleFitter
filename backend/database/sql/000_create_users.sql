-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    userID VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- モックデータの投入
INSERT INTO users (id, email, userID) VALUES
(1, 'dev-user@example.com', 'dev-user'),
(2, 'member1@example.com', 'member1'),
(3, 'member2@example.com', 'member2')
ON CONFLICT (email) DO NOTHING;


-- シーケンスの同期
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));