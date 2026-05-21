export const prerender = false;

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const GET: APIRoute = async ({ url }) => {
  if (!supabase) {
    return new Response(JSON.stringify({ messages: [] }), { status: 200 });
  }
  const token = (url.searchParams.get('token') || '').trim();
  const since = url.searchParams.get('since');

  if (token.length < 16) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 400 });
  }

  const { data, error } = await supabase.rpc('chat_poll_visitor', {
    p_token: token,
    p_since: since || null,
  });

  if (error) {
    console.error('[chat/poll] rpc error:', error.message);
    return new Response(JSON.stringify({ error: 'Poll failed' }), { status: 500 });
  }

  return new Response(JSON.stringify({ messages: data || [] }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
