import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { NewsItem } from '../lib/supabase';

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news');
        if (!response.ok) {
          throw new Error('Błąd podczas pobierania newsów');
        }
        const data = await response.json();
        setNews(data);
      } catch (error) {
        console.error('Błąd:', error);
        setError(error instanceof Error ? error.message : 'Wystąpił nieznany błąd');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Ładowanie...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Newsy</h1>
        <button 
          className={styles.addButton}
          onClick={() => router.push('/add-news')}
        >
          Dodaj News
        </button>
      </header>

      <div className={styles.newsGrid}>
        {news.map((item) => (
          <div key={item.id} className={styles.newsCard}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <div className={styles.imageGrid}>
              {item.images.map((image, index) => (
                <div key={index} className={styles.imageContainer}>
                  <Image
                    src={image.url}
                    alt={image.description || `Zdjęcie ${index + 1}`}
                    width={300}
                    height={200}
                    className={styles.image}
                    unoptimized={true}
                  />
                  {image.location && (
                    <p className={styles.location}>{image.location}</p>
                  )}
                  {image.description && (
                    <p className={styles.imageDescription}>{image.description}</p>
                  )}
                </div>
              ))}
            </div>
            <p className={styles.date}>
              {new Date(item.created_at).toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
