-- Live chat: visitor conversations and messages
-- Visitors are unauthenticated; access is gated by a per-conversation visitor_token.
-- Admins (portal_admins) get full access via existing is_portal_admin() helper.

create extension if not exists "pgcrypto";

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  visitor_token text unique not null,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  page_url text,
  status text not null default 'open', -- open | closed
  unread_admin int not null default 0,  -- messages from visitor not yet seen by admin
  unread_visitor int not null default 0,-- messages from admin not yet seen by visitor
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_conversations_last_msg_idx
  on public.chat_conversations (last_message_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender text not null check (sender in ('visitor', 'admin', 'system')),
  sender_name text,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_conv_created_idx
  on public.chat_messages (conversation_id, created_at);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

-- Admin-only direct access (visitor flow uses SECURITY DEFINER RPCs below)
drop policy if exists "Admins read conversations" on public.chat_conversations;
create policy "Admins read conversations"
on public.chat_conversations
for select to authenticated
using (public.is_portal_admin());

drop policy if exists "Admins update conversations" on public.chat_conversations;
create policy "Admins update conversations"
on public.chat_conversations
for update to authenticated
using (public.is_portal_admin())
with check (public.is_portal_admin());

drop policy if exists "Admins read messages" on public.chat_messages;
create policy "Admins read messages"
on public.chat_messages
for select to authenticated
using (public.is_portal_admin());

drop policy if exists "Admins insert messages" on public.chat_messages;
create policy "Admins insert messages"
on public.chat_messages
for insert to authenticated
with check (public.is_portal_admin());

-- ===== Visitor RPCs (security definer, token-gated) =====

create or replace function public.chat_start_conversation(
  p_token text,
  p_name text,
  p_email text,
  p_phone text,
  p_page_url text,
  p_first_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_token is null or length(trim(p_token)) < 16 then
    raise exception 'invalid token';
  end if;

  insert into public.chat_conversations
    (visitor_token, visitor_name, visitor_email, visitor_phone, page_url,
     unread_admin, last_message_preview, last_message_at)
  values
    (p_token, nullif(trim(p_name),''), nullif(trim(p_email),''),
     nullif(trim(p_phone),''), nullif(trim(p_page_url),''),
     case when p_first_message is null then 0 else 1 end,
     left(coalesce(p_first_message,''), 200),
     now())
  on conflict (visitor_token) do update
    set visitor_name = coalesce(nullif(trim(excluded.visitor_name),''), public.chat_conversations.visitor_name),
        visitor_email= coalesce(nullif(trim(excluded.visitor_email),''),public.chat_conversations.visitor_email),
        visitor_phone= coalesce(nullif(trim(excluded.visitor_phone),''),public.chat_conversations.visitor_phone),
        page_url     = coalesce(excluded.page_url, public.chat_conversations.page_url),
        status       = 'open',
        updated_at   = now()
  returning id into v_id;

  if p_first_message is not null and length(trim(p_first_message)) > 0 then
    insert into public.chat_messages (conversation_id, sender, sender_name, body)
    values (v_id, 'visitor', nullif(trim(p_name),''), trim(p_first_message));
  end if;

  return v_id;
end;
$$;

create or replace function public.chat_send_visitor_message(
  p_token text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv uuid;
  v_name text;
  v_msg_id uuid;
begin
  select id, visitor_name into v_conv, v_name
  from public.chat_conversations
  where visitor_token = p_token;

  if v_conv is null then
    raise exception 'conversation not found';
  end if;
  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'empty message';
  end if;

  insert into public.chat_messages (conversation_id, sender, sender_name, body)
  values (v_conv, 'visitor', v_name, trim(p_body))
  returning id into v_msg_id;

  update public.chat_conversations
     set last_message_at = now(),
         last_message_preview = left(trim(p_body), 200),
         unread_admin = unread_admin + 1,
         status = 'open',
         updated_at = now()
   where id = v_conv;

  return v_msg_id;
end;
$$;

create or replace function public.chat_poll_visitor(
  p_token text,
  p_since timestamptz
)
returns table (
  id uuid,
  sender text,
  sender_name text,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv uuid;
begin
  select c.id into v_conv
  from public.chat_conversations c
  where c.visitor_token = p_token;

  if v_conv is null then
    return;
  end if;

  -- Mark admin->visitor messages as read on poll
  update public.chat_conversations
     set unread_visitor = 0
   where chat_conversations.id = v_conv and unread_visitor > 0;

  return query
    select m.id, m.sender, m.sender_name, m.body, m.created_at
    from public.chat_messages m
    where m.conversation_id = v_conv
      and (p_since is null or m.created_at > p_since)
    order by m.created_at asc;
end;
$$;

revoke all on function public.chat_start_conversation(text,text,text,text,text,text) from public;
revoke all on function public.chat_send_visitor_message(text,text) from public;
revoke all on function public.chat_poll_visitor(text, timestamptz) from public;

grant execute on function public.chat_start_conversation(text,text,text,text,text,text) to anon, authenticated;
grant execute on function public.chat_send_visitor_message(text,text) to anon, authenticated;
grant execute on function public.chat_poll_visitor(text, timestamptz) to anon, authenticated;

-- Admin reply RPC: insert message + bump unread_visitor + reset unread_admin
create or replace function public.chat_admin_reply(
  p_conversation_id uuid,
  p_body text,
  p_sender_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_msg_id uuid;
begin
  if not public.is_portal_admin() then
    raise exception 'not authorized';
  end if;
  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'empty message';
  end if;

  insert into public.chat_messages (conversation_id, sender, sender_name, body)
  values (p_conversation_id, 'admin', coalesce(nullif(trim(p_sender_name),''),'All Dent PDR'), trim(p_body))
  returning id into v_msg_id;

  update public.chat_conversations
     set last_message_at = now(),
         last_message_preview = left(trim(p_body), 200),
         unread_visitor = unread_visitor + 1,
         unread_admin = 0,
         status = 'open',
         updated_at = now()
   where id = p_conversation_id;

  return v_msg_id;
end;
$$;

revoke all on function public.chat_admin_reply(uuid,text,text) from public;
grant execute on function public.chat_admin_reply(uuid,text,text) to authenticated;

-- Admin: mark a conversation as read (zero unread_admin)
create or replace function public.chat_admin_mark_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_portal_admin() then
    raise exception 'not authorized';
  end if;
  update public.chat_conversations
     set unread_admin = 0, updated_at = now()
   where id = p_conversation_id;
end;
$$;

revoke all on function public.chat_admin_mark_read(uuid) from public;
grant execute on function public.chat_admin_mark_read(uuid) to authenticated;

-- Realtime: enable for messages and conversations so admin dashboard can subscribe
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'chat_conversations'
  ) then
    alter publication supabase_realtime add table public.chat_conversations;
  end if;
end;
$$;
