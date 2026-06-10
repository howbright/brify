insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit
)
values (
  'document-uploads',
  'document-uploads',
  false,
  52428800
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = null;
