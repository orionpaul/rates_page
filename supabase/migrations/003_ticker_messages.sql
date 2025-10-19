-- Create ticker_messages table
CREATE TABLE IF NOT EXISTS ticker_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  icon TEXT DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- Add RLS policies
ALTER TABLE ticker_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active messages
CREATE POLICY "Allow public read access to active ticker messages"
  ON ticker_messages
  FOR SELECT
  USING (is_active = true);

-- Allow all operations for authenticated users (admin check should be done in app)
CREATE POLICY "Allow all operations for authenticated users"
  ON ticker_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_ticker_messages_active ON ticker_messages(is_active, display_order);

-- Insert default messages
INSERT INTO ticker_messages (message, icon, is_active, display_order) VALUES
  ('Rates are indicative and subject to change without prior notice', 'info', true, 1),
  ('Updated in real-time for your convenience', 'clock', true, 2),
  ('Contact us for large transactions and special rates', 'mail', true, 3);
