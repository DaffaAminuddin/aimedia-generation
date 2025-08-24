import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmvghsjnrpbjzgkbwisk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtdmdoc2pucnBianpna2J3aXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzM4NzYsImV4cCI6MjA3MTYwOTg3Nn0._iJV6oJl0A9IbTUEw-jQp9ssoUCBsdYy7S8YtoqM3Ek';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
