alter table public.map_generation_chunks
add column if not exists structure_result jsonb null;
