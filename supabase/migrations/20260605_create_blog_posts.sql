create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('ko', 'en', 'fr')),
  slug text not null,
  title text not null,
  excerpt text not null default '',
  image_url text not null default '',
  markdown text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_locale_slug_key unique (locale, slug),
  constraint blog_posts_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index if not exists blog_posts_locale_status_published_idx
  on public.blog_posts (locale, status, published_at desc);

create or replace function public.set_blog_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_blog_posts_updated_at on public.blog_posts;
create trigger trg_blog_posts_updated_at
before update on public.blog_posts
for each row
execute function public.set_blog_posts_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts"
on public.blog_posts
for select
using (
  status = 'published'
  and (published_at is null or published_at <= now())
);

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read blog images" on storage.objects;
create policy "Public can read blog images"
on storage.objects
for select
using (bucket_id = 'blog-images');
