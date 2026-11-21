-- Content Calendar Schema for Whiz Studio
CREATE TABLE IF NOT EXISTS content_folders (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  service_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_folders_email ON content_folders(client_email);

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  folder_id TEXT NOT NULL,
  serial_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content_body TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES content_folders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_items_folder ON content_items(folder_id, serial_number);
