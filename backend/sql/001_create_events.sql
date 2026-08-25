-- 予定（カレンダーイベント）テーブル
CREATE TABLE IF NOT EXISTS events (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    location    VARCHAR(255),
    category    VARCHAR(50),
    start_at    TIMESTAMPTZ NOT NULL,
    end_at      TIMESTAMPTZ NOT NULL,
    all_day     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT events_end_after_start CHECK (end_at >= start_at)
);

CREATE INDEX IF NOT EXISTS idx_events_start_at ON events (start_at);
CREATE INDEX IF NOT EXISTS idx_events_end_at ON events (end_at);
CREATE INDEX IF NOT EXISTS idx_events_category ON events (category);

COMMENT ON TABLE events IS 'カレンダー予定';
COMMENT ON COLUMN events.title IS '予定タイトル';
COMMENT ON COLUMN events.description IS '詳細・メモ';
COMMENT ON COLUMN events.location IS '場所';
COMMENT ON COLUMN events.category IS 'カテゴリ（仕事/学校/遊び/移動/病院 など）';
COMMENT ON COLUMN events.start_at IS '開始日時';
COMMENT ON COLUMN events.end_at IS '終了日時';
COMMENT ON COLUMN events.all_day IS '終日フラグ';
