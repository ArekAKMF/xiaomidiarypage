import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { data: news, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json(news);
    } catch (error) {
      console.error('Błąd podczas pobierania newsów:', error);
      return res.status(500).json({ error: 'Błąd podczas pobierania newsów' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description, images, created_at } = req.body;

      // Walidacja danych
      if (!title || !description || !images || !Array.isArray(images)) {
        return res.status(400).json({ error: 'Brak wymaganych pól' });
      }

      // Walidacja każdego obrazu
      for (const image of images) {
        if (!image.url) {
          return res.status(400).json({ 
            error: 'Każdy obraz musi zawierać URL',
            details: 'Pole url jest wymagane dla każdego obrazu'
          });
        }
      }

      const { data, error } = await supabase
        .from('news')
        .insert([
          {
            title,
            description,
            images,
            created_at
          }
        ])
        .select();

      if (error) throw error;

      return res.status(201).json(data[0]);
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