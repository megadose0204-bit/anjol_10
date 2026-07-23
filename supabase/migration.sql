-- ============================================================
-- DevFlow 블로그 마이그레이션 스크립트 (통합 DB AIMaster_dev 용)
-- 서비스: blog (테이블 접두사: blog_)
-- 실행 방법: Supabase Dashboard > SQL Editor에서 이 파일 내용을 붙여넣어 실행
-- ============================================================

-- 1. blog_categories 테이블
CREATE TABLE IF NOT EXISTS blog_categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. blog_authors 테이블
CREATE TABLE IF NOT EXISTS blog_authors (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_authors_user_id ON blog_authors(user_id) WHERE user_id IS NOT NULL;

-- 3. blog_posts 테이블
CREATE TABLE IF NOT EXISTS blog_posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  published_at DATE NOT NULL DEFAULT CURRENT_DATE,
  author_id BIGINT NOT NULL REFERENCES blog_authors(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  reading_minutes INT NOT NULL DEFAULT 5,
  like_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. blog_post_categories 조인 테이블 (M:N)
CREATE TABLE IF NOT EXISTS blog_post_categories (
  post_id BIGINT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- 5. blog_comments 테이블
CREATE TABLE IF NOT EXISTS blog_comments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. blog_likes 테이블
CREATE TABLE IF NOT EXISTS blog_likes (
  post_id BIGINT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_categories_category_id ON blog_post_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_categories_post_id ON blog_post_categories(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_id ON blog_likes(post_id);

-- ============================================================
-- RLS (Row Level Security) 정책
-- ============================================================

-- blog_categories RLS
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_categories_select_all"
  ON blog_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "blog_categories_insert_auth"
  ON blog_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "blog_categories_update_auth"
  ON blog_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "blog_categories_delete_auth"
  ON blog_categories FOR DELETE
  TO authenticated
  USING (true);

-- blog_authors RLS
ALTER TABLE blog_authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_authors_select_all"
  ON blog_authors FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "blog_authors_insert_auth"
  ON blog_authors FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "blog_authors_update_auth"
  ON blog_authors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "blog_authors_delete_auth"
  ON blog_authors FOR DELETE
  TO authenticated
  USING (true);

-- blog_posts RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_select_all"
  ON blog_posts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "blog_posts_insert_auth"
  ON blog_posts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "blog_posts_update_auth"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "blog_posts_delete_auth"
  ON blog_posts FOR DELETE
  TO authenticated
  USING (true);

-- blog_post_categories RLS
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_post_categories_select_all"
  ON blog_post_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "blog_post_categories_insert_auth"
  ON blog_post_categories FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "blog_post_categories_delete_auth"
  ON blog_post_categories FOR DELETE
  TO authenticated
  USING (true);

-- blog_comments RLS
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_comments_select_all"
  ON blog_comments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "blog_comments_insert_own"
  ON blog_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "blog_comments_delete_own"
  ON blog_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- blog_likes RLS
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_likes_select_all"
  ON blog_likes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "blog_likes_insert_own"
  ON blog_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "blog_likes_delete_own"
  ON blog_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
