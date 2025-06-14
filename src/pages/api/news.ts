import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

interface ImageData {
  url: string;
  location: string;
  description: string;
}

interface NewsData {
  title: string;
  description: string;
  images: ImageData[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json(data);
    } catch (error) {
      console.error('Błąd podczas pobierania newsów:', error);
      return res.status(500).json({ 
        error: 'Błąd podczas pobierania newsów',
        details: error instanceof Error ? error.message : 'Nieznany błąd'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description, images } = req.body as NewsData;

      if (!title || !description || !images || !Array.isArray(images)) {
        return res.status(400).json({ 
          error: 'Brak wymaganych pól lub nieprawidłowy format danych',
          details: {
            title: !title ? 'Brak tytułu' : null,
            description: !description ? 'Brak opisu' : null,
            images: !images ? 'Brak obrazów' : !Array.isArray(images) ? 'Nieprawidłowy format obrazów' : null
          }
        });
      }

      // Sprawdź format każdego obrazu
      const isValidImageFormat = images.every(img => 
        img && 
        typeof img.url === 'string' && 
        typeof img.location === 'string' && 
        typeof img.description === 'string'
      );

      if (!isValidImageFormat) {
        return res.status(400).json({ 
          error: 'Nieprawidłowy format danych obrazów',
          details: 'Każdy obraz musi zawierać pola: url, location, description'
        });
      }

      const { data, error } = await supabase
        .from('news')
        .insert([
          {
            title,
            description,
            images,
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Błąd Supabase:', error);
        throw error;
      }

      return res.status(201).json(data);
    } catch (error) {
      console.error('Błąd podczas dodawania newsa:', error);
      return res.status(500).json({ 
        error: 'Błąd podczas dodawania newsa',
        details: error instanceof Error ? error.message : 'Nieznany błąd'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 