-- Add indexes for faster lookups
CREATE INDEX idx_messages_telegram_message_id ON messages(telegram_message_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_category ON messages(category);
CREATE INDEX idx_messages_is_responded ON messages(is_responded);
CREATE INDEX idx_contacts_telegram_id ON contacts(telegram_id);

-- Add timestamp trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_modtime
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Optimizations for SQLite database

-- Message table optimizations
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_category ON messages(category);
CREATE INDEX IF NOT EXISTS idx_messages_is_responded ON messages(is_responded);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_ai_category ON messages(ai_category);

-- Contact table optimizations
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_telegram_id ON contacts(telegram_id);
CREATE INDEX IF NOT EXISTS idx_contacts_last_message_time ON contacts(last_message_time);

-- Compound indexes for common queries
CREATE INDEX IF NOT EXISTS idx_messages_user_responded ON messages(user_id, is_responded);
CREATE INDEX IF NOT EXISTS idx_messages_user_category ON messages(user_id, category);
CREATE INDEX IF NOT EXISTS idx_messages_user_ai_category ON messages(user_id, ai_category);

-- Full-text search for message content (if using SQLite 3.9.0 or newer)
-- This requires adding a virtual table
CREATE VIRTUAL TABLE IF NOT EXISTS message_fts USING fts5(
    message_text,
    content='messages',
    content_rowid='id'
);

-- Triggers to keep FTS index updated
CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
    INSERT INTO message_fts(rowid, message_text) VALUES (new.id, new.message_text);
END;

CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
    INSERT INTO message_fts(message_fts, rowid, message_text) VALUES('delete', old.id, old.message_text);
END;

CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
    INSERT INTO message_fts(message_fts, rowid, message_text) VALUES('delete', old.id, old.message_text);
    INSERT INTO message_fts(rowid, message_text) VALUES (new.id, new.message_text);
END;

-- Analyze the database to optimize query planning
ANALYZE; 