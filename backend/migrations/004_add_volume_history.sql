CREATE TABLE IF NOT EXISTS volume_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_id TEXT NOT NULL,
    volume REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(token_id, timestamp)
);

CREATE INDEX idx_volume_history_token_time 
ON volume_history(token_id, timestamp); 