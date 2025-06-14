import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src/data/news.json');

interface NewsItem {
  id: string;
  title: string;
  description: string;
  date: string;
  images: {
    url: string;
    description: string;
  }[];
}

// Funkcja pomocnicza do odczytu danych
const readData = (): { news: NewsItem[] } => {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { news: [] };
  }
};

// Funkcja pomocnicza do zapisu danych
const writeData = (data: { news: NewsItem[] }) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const data = readData();
      return res.status(200).json(data.news);
    } catch (error) {
      return res.status(500).json({ error: 'Błąd podczas odczytu danych' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description, images } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ error: 'Brak wymaganych pól' });
      }

      const data = readData();
      const newNews: NewsItem = {
        id: Date.now().toString(),
        title,
        description,
        date: new Date().toISOString().split('T')[0],
        images: images || []
      };

      data.news.unshift(newNews); // Dodaj na początek tablicy
      writeData(data);

      return res.status(201).json(newNews);
    } catch (error) {
      console.error('Błąd podczas zapisywania:', error);
      return res.status(500).json({ error: 'Błąd podczas zapisywania danych' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 