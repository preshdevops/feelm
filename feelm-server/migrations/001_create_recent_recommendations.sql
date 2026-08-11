CREATE TABLE IF NOT EXISTS recent_recommendations (
  mood TEXT NOT NULL,
  vibe TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recent_recommendations_mood_vibe_created_at_idx
  ON recent_recommendations (mood, vibe, created_at DESC);
