-- Knowledge Pipeline Database Schema
-- Run this to initialize the database

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(50) DEFAULT 'Queued' CHECK (status IN ('Queued', 'In Progress', 'In Review', 'Approved', 'Rejected')),
    approved_content TEXT,
    md_file_path VARCHAR(500),
    pdf_file_path VARCHAR(500),
    customgpt_source_id VARCHAR(100),
    customgpt_added_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Migration: Add columns if they don't exist (for databases created before these were added)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'md_file_path') THEN
        ALTER TABLE topics ADD COLUMN md_file_path VARCHAR(500);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'pdf_file_path') THEN
        ALTER TABLE topics ADD COLUMN pdf_file_path VARCHAR(500);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'customgpt_source_id') THEN
        ALTER TABLE topics ADD COLUMN customgpt_source_id VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'customgpt_added_at') THEN
        ALTER TABLE topics ADD COLUMN customgpt_added_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Settings table (key-value store for app configuration)
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default settings
INSERT INTO settings (key, value) VALUES (
    'perplexity_system_prompt',
    'You are an expert SEO content writer. Write detailed, accurate, and engaging content optimized for search engines. Use markdown formatting. Naturally incorporate target keywords without keyword stuffing.'
) ON CONFLICT (key) DO NOTHING;

-- Index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);

-- Index for sorting by date
CREATE INDEX IF NOT EXISTS idx_topics_created_at ON topics(created_at DESC);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on row update
DROP TRIGGER IF EXISTS update_topics_updated_at ON topics;
CREATE TRIGGER update_topics_updated_at
    BEFORE UPDATE ON topics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-set approved_at when status changes to Approved
CREATE OR REPLACE FUNCTION set_approved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Approved' AND OLD.status != 'Approved' THEN
        NEW.approved_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_topics_approved_at ON topics;
CREATE TRIGGER set_topics_approved_at
    BEFORE UPDATE ON topics
    FOR EACH ROW
    EXECUTE FUNCTION set_approved_at();

