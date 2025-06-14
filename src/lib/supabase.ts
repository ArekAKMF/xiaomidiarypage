import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  date: string;
  images: {
    url: string;
    description: string;
    location?: string;
  }[];
  created_at: string;
}

export async function getNews() {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Błąd podczas pobierania newsów:', error);
    throw error;
  }

  return data as NewsItem[];
}

export async function addNews(news: Omit<NewsItem, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('news')
    .insert([news])
    .select()
    .single();

  if (error) {
    console.error('Błąd podczas dodawania newsa:', error);
    throw error;
  }

  return data as NewsItem;
} 