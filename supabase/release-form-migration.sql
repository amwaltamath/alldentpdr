-- Migration: add release_form_data column to vehicle_jobs
-- Run this once in the Supabase SQL Editor

alter table public.vehicle_jobs
  add column if not exists release_form_data jsonb;
