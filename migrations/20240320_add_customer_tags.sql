-- Tạo bảng customer_tags
create table public.customer_tags (
  id uuid not null default gen_random_uuid(),
  name character varying(50) not null,
  color character varying(7) not null default '#000000',
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint customer_tags_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_customer_tags_name on public.customer_tags using btree (name) TABLESPACE pg_default;

create trigger update_customer_tags_updated_at BEFORE
update on customer_tags for EACH row
execute FUNCTION update_updated_at_column();

-- Thêm cột tag_id vào bảng customers
alter table public.customers add column tag_id uuid null references public.customer_tags(id) on delete set null;

create index IF not exists idx_customers_tag_id on public.customers using btree (tag_id) TABLESPACE pg_default;

-- Thêm dữ liệu mẫu cho customer_tags
insert into public.customer_tags (name, color) values
  ('1 tháng', '#4CAF50'),
  ('Đang điều trị', '#2196F3'),
  ('Nản', '#FFC107'),
  ('Bỏ', '#F44336'); 