alter table public.blog_posts
  add column if not exists translation_group_id uuid;

drop index if exists blog_posts_translation_group_locale_idx;
create unique index if not exists blog_posts_translation_group_locale_idx
  on public.blog_posts (translation_group_id, locale)
  where translation_group_id is not null;

alter table public.blog_posts
  drop constraint if exists blog_posts_locale_check;

alter table public.blog_posts
  add constraint blog_posts_locale_format
  check (locale ~ '^[a-z]{2,8}(-[a-z0-9]{2,8})?$');

create index if not exists blog_posts_translation_group_idx
  on public.blog_posts (translation_group_id);
