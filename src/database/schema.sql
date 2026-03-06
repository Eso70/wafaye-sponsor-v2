-- Full schema: drop and recreate for clean structure
-- Command: npm run db  (or npm run seed)

DROP TABLE IF EXISTS link_clicks;
DROP TABLE IF EXISTS page_views;
DROP TABLE IF EXISTS linktree_links;
DROP TABLE IF EXISTS linktree_pages;
DROP TABLE IF EXISTS admin_credentials;

CREATE TABLE admin_credentials (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE linktree_pages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  profile_image VARCHAR(256) NOT NULL DEFAULT '/images/DefaultAvatar.png',
  slug VARCHAR(128) NOT NULL UNIQUE,
  expires_at DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  views INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  is_official BOOLEAN NOT NULL DEFAULT false,
  show_footer BOOLEAN NOT NULL DEFAULT true,
  sponsor_name VARCHAR(128) NOT NULL DEFAULT 'Wafaye Sponsor',
  sponsor_phone VARCHAR(32) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_linktree_pages_slug ON linktree_pages(slug);
CREATE INDEX idx_linktree_pages_is_official ON linktree_pages(is_official) WHERE is_official = true;

CREATE TABLE linktree_links (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES linktree_pages(id) ON DELETE CASCADE,
  platform_id VARCHAR(32) NOT NULL,
  label VARCHAR(64),
  value TEXT NOT NULL,
  default_message TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_linktree_links_page_id ON linktree_links(page_id);

CREATE TABLE page_views (
  page_id INTEGER NOT NULL REFERENCES linktree_pages(id) ON DELETE CASCADE,
  visitor_fingerprint VARCHAR(64) NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (page_id, visitor_fingerprint)
);

CREATE TABLE link_clicks (
  link_id INTEGER NOT NULL REFERENCES linktree_links(id) ON DELETE CASCADE,
  visitor_fingerprint VARCHAR(64) NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (link_id, visitor_fingerprint)
);

CREATE INDEX idx_page_views_page_id ON page_views(page_id);
CREATE INDEX idx_link_clicks_link_id ON link_clicks(link_id);
