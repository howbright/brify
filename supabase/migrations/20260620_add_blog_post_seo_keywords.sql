alter table public.blog_posts
  add column if not exists seo_keywords text[] not null default '{}';
