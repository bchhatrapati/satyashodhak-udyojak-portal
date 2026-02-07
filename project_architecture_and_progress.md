# Database 
###############################################################################
create table public.members (
-- Primary Key SUCCS10000 to SUCCS00001(reverse) and then next ID will be SUCCS10001, SUCCS10002....
account_number text not null,

-- Personal Info
  full_name text not null,
  phone_number varchar(10) not null,
  email text not null,
  date_of_birth date not null,
  
  -- Financials (Changed to Numeric for precision)
  balance numeric(15, 2) not null default 0.00,
  penalty_amount numeric(15, 2) not null default 0.00,
  
  -- Identity
  aadhar_no varchar(14) not null,
  pan_no varchar(10) null,
  
  -- Media/Docs
  photo_url text not null,
  aadhar_url text not null,
  pan_url text null,
  
  -- Nominee details
  nominee_name text not null,
  nominee_relation text not null,
  
  -- Configuration & Status
  is_active boolean not null default true,
  joining_date date not null default CURRENT_DATE,
  
  -- Installment Day (Added Check Constraint)
  monthly_installment_date integer not null default 10
  check (monthly_installment_date between 1 and 28),
  
  -- Metadata
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  -- Constraints
  constraint members_pkey primary key (account_number),
  constraint members_email_key unique (lower(email)),
  constraint members_phone_number_key unique (phone_number),
  constraint members_aadhar_unique unique (aadhar_no),
  constraint members_pan_unique unique (pan_no),
  
  constraint aadhar_format_check
    check (aadhar_no ~ '^[0-9]{4}-[0-9]{4}-[0-9]{4}$'),

  constraint pan_format_check
    check (pan_no ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
);


-- Practical additions: Indexes for performance
create index idx_members_full_name on public.members (full_name);
create index idx_members_is_active on public.members (is_active);

-- Trigger for auto-updating updated_at (add after table creation)
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_members_updated
before update on members
for each row
execute procedure update_updated_at();
########################################################################################

  
  
  
  
  
