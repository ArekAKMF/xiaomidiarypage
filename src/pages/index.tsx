import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { NewsItem } from '../lib/supabase';

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

  const groupNewsByDate = (news: NewsItem[]) => {
    return news.reduce((groups, item) => {
      const date = new Date(item.created_at).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
      return groups;
    }, {} as Record<string, NewsItem[]>);
  };

  const handleImageClick = (date: string, imageIndex: number) => {
    setSelectedDate(date);
    setCurrentImageIndex(imageIndex);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedDate) {
      const imagesForDate = getAllImagesForDate(selectedDate);
      setCurrentImageIndex((prev) => (prev + 1) % imagesForDate.length);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedDate) {
      const imagesForDate = getAllImagesForDate(selectedDate);
      setCurrentImageIndex((prev) => (prev - 1 + imagesForDate.length) % imagesForDate.length);
    }
  };

  const getAllImagesForDate = (date: string) => {
    return news
      .filter(item => new Date(item.created_at).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) === date)
      .flatMap(item => item.images);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedDate) {
      if (e.key === 'ArrowRight') {
        handleNextImage(e as unknown as React.MouseEvent);
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage(e as unknown as React.MouseEvent);
      } else if (e.key === 'Escape') {
        setSelectedDate(null);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedDate]);

  if (loading) {
    return <div className={styles.loading}>Ładowanie...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const groupedNews = groupNewsByDate(news);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Szary Dziennik</h1>
      </header>

      <div className={styles.newsContainer}>
        {Object.entries(groupedNews).map(([date, items]) => (
          <div key={date} className={styles.dateGroup}>
            <h2 className={styles.dateHeader}>{date}</h2>
            <div className={styles.newsGrid}>
              {items.map((item) => (
                <div key={item.id} className={styles.newsCard}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className={styles.imageGrid}>
                    {item.images.map((image, index) => {
                      const allImagesForDate = getAllImagesForDate(date);
                      const imageIndex = allImagesForDate.findIndex(img => img.url === image.url);
                      return (
                        <div 
                          key={index} 
                          className={styles.imageContainer}
                          onClick={() => handleImageClick(date, imageIndex)}
                        >
                          <Image
                            src={image.url}
                            alt={image.description || `Zdjęcie ${index + 1}`}
                            width={300}
                            height={200}
                            className={styles.image}
                            unoptimized={true}
                            priority={index < 4}
                          />
                          {image.location && (
                            <p className={styles.location}>{image.location}</p>
                          )}
                          {image.description && (
                            <p className={styles.imageDescription}>{image.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className={styles.time}>
                    {new Date(item.created_at).toLocaleTimeString('pl-PL', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedDate && (
        <div 
          className={styles.modal}
          onClick={() => setSelectedDate(null)}
        >
          <button 
            className={styles.modalNavButton}
            onClick={handlePrevImage}
            style={{ left: '20px' }}
          >
            ‹
          </button>
          <div className={styles.modalContent}>
            {getAllImagesForDate(selectedDate)[currentImageIndex] && (
              <>
                <Image
                  src={getAllImagesForDate(selectedDate)[currentImageIndex].url}
                  alt={getAllImagesForDate(selectedDate)[currentImageIndex].description || 'Zdjęcie'}
                  width={800}
                  height={600}
                  className={styles.modalImage}
                  unoptimized={true}
                  priority={true}
                />
                <div className={styles.modalInfo}>
                  {getAllImagesForDate(selectedDate)[currentImageIndex].location && (
                    <p className={styles.modalLocation}>
                      {getAllImagesForDate(selectedDate)[currentImageIndex].location}
                    </p>
                  )}
                  {getAllImagesForDate(selectedDate)[currentImageIndex].description && (
                    <p className={styles.modalDescription}>
                      {getAllImagesForDate(selectedDate)[currentImageIndex].description}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <button 
            className={styles.modalNavButton}
            onClick={handleNextImage}
            style={{ right: '20px' }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
