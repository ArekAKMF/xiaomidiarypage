import { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, filename } = req.body;

    if (!image || !filename) {
      return res.status(400).json({ error: 'Brak obrazu lub nazwy pliku' });
    }

    // Konwertuj base64 na Buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generuj unikalną nazwę pliku
    const uniqueFilename = `${Date.now()}-${filename}`;

    // Upload do Vercel Blob
    const blob = await put(uniqueFilename, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
    });

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Błąd podczas uploadu:', error);
    return res.status(500).json({ 
      error: 'Błąd podczas uploadu obrazu',
      details: error instanceof Error ? error.message : 'Nieznany błąd'
    });
  }
} 