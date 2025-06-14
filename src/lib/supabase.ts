import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Brak NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Brak NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export interface ImageData {
  url: string;
  description?: string;
  location?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  images: ImageData[];
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