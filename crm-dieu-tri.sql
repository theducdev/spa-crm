create table public.customers (
  id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  phone character varying(20) null,
  email character varying(255) null,
  gender public.customer_gender null,
  birth_date date null,
  address text null,
  face_image_url text null,
  face_image_path text null,
  notes text null,
  status public.customer_status null default 'active'::customer_status,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint customers_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_customers_name on public.customers using gin (to_tsvector('english'::regconfig, (name)::text)) TABLESPACE pg_default;

create index IF not exists idx_customers_phone on public.customers using btree (phone) TABLESPACE pg_default;

create index IF not exists idx_customers_email on public.customers using btree (email) TABLESPACE pg_default;

create index IF not exists idx_customers_status on public.customers using btree (status) TABLESPACE pg_default;

create index IF not exists idx_customers_created_at on public.customers using btree (created_at) TABLESPACE pg_default;

create trigger update_customers_updated_at BEFORE
update on customers for EACH row
execute FUNCTION update_updated_at_column ();


create table public.treatments (
  id uuid not null default extensions.uuid_generate_v4 (),
  customer_id uuid null,
  treatment_name character varying(255) not null,
  total_sessions integer not null,
  current_session integer null default 1,
  start_date date not null,
  end_date date null,
  price numeric(12, 2) null,
  status character varying(20) null default 'active'::character varying,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint treatments_pkey primary key (id),
  constraint treatments_customer_id_fkey foreign KEY (customer_id) references customers (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_treatments_customer_id on public.treatments using btree (customer_id) TABLESPACE pg_default;

create index IF not exists idx_treatments_status on public.treatments using btree (status) TABLESPACE pg_default;

create index IF not exists idx_treatments_created_at on public.treatments using btree (created_at) TABLESPACE pg_default;

create trigger update_treatments_updated_at BEFORE
update on treatments for EACH row
execute FUNCTION update_treatments_updated_at ();


create table public.treatment_sessions (
  id uuid not null default extensions.uuid_generate_v4 (),
  treatment_id uuid null,
  session_number integer not null,
  session_date date not null,
  products_used text null,
  skin_condition text null,
  reaction text null,
  next_appointment date null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint treatment_sessions_pkey primary key (id),
  constraint treatment_sessions_treatment_id_fkey foreign KEY (treatment_id) references treatments (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_treatment_sessions_treatment_id on public.treatment_sessions using btree (treatment_id) TABLESPACE pg_default;


create table public.treatment_images (
  id uuid not null default extensions.uuid_generate_v4 (),
  session_id uuid null,
  image_type character varying(20) not null,
  image_url text not null,
  storage_path text not null,
  created_at timestamp with time zone null default now(),
  constraint treatment_images_pkey primary key (id),
  constraint treatment_images_session_id_fkey foreign KEY (session_id) references treatment_sessions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_treatment_images_session_id on public.treatment_images using btree (session_id) TABLESPACE pg_default;


create table public.treatment_packages (
  id uuid not null default gen_random_uuid(),
  name character varying(255) not null,
  description text null,
  total_sessions integer not null,
  price numeric(12, 2) not null,
  status character varying(20) null default 'active'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint treatment_packages_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_treatment_packages_status on public.treatment_packages using btree (status) TABLESPACE pg_default;

create trigger update_treatment_packages_updated_at BEFORE
update on treatment_packages for EACH row
execute FUNCTION update_updated_at_column();


create table public.products (
  id uuid not null default gen_random_uuid(),
  name character varying(255) not null,
  notes text null,
  usage_times text[] null default array[]::text[],
  status character varying(20) null default 'active'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint products_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_products_status on public.products using btree (status) TABLESPACE pg_default;

create trigger update_products_updated_at BEFORE
update on products for EACH row
execute FUNCTION update_updated_at_column();