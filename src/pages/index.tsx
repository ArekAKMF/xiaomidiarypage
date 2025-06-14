import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import { getNews, NewsItem } from '../lib/supabase';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getNews();
        setNews(data);
      } catch (error) {
        console.error('Błąd:', error);
        setError('Nie udało się pobrać newsów. Spróbuj odświeżyć stronę.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const groupNewsByDate = (news: NewsItem[]) => {
    return news.reduce((groups, item) => {
      const date = item.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
      return groups;
    }, {} as Record<string, NewsItem[]>);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleImageClick = (imageUrl: string, date: string) => {
    setSelectedImage(imageUrl);
    setSelectedDate(date);
    const imagesForDate = news.filter(item => item.date === date)
      .flatMap(item => item.images.map(img => img.url));
    setCurrentImageIndex(imagesForDate.indexOf(imageUrl));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedDate) {
      const imagesForDate = news.filter(item => item.date === selectedDate)
        .flatMap(item => item.images.map(img => img.url));
      const nextIndex = (currentImageIndex + 1) % imagesForDate.length;
      setCurrentImageIndex(nextIndex);
      setSelectedImage(imagesForDate[nextIndex]);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedDate) {
      const imagesForDate = news.filter(item => item.date === selectedDate)
        .flatMap(item => item.images.map(img => img.url));
      const prevIndex = (currentImageIndex - 1 + imagesForDate.length) % imagesForDate.length;
      setCurrentImageIndex(prevIndex);
      setSelectedImage(imagesForDate[prevIndex]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedImage) {
      if (e.key === 'ArrowRight') {
        handleNextImage(e as unknown as React.MouseEvent);
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage(e as unknown as React.MouseEvent);
      } else if (e.key === 'Escape') {
        setSelectedImage(null);
        setSelectedDate(null);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedImage, selectedDate, currentImageIndex]);

  if (loading) {
    return <div className={styles.loading}>Ładowanie...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const groupedNews = groupNewsByDate(news);

  return (
    <div className={styles.container}>
      {/* Sekcja z logo */}
      <section className={styles.logoSection}>
        <div className={styles.logoContainer}>
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={200}
            height={100}
            priority
          />
        </div>
        <Link href="/add-news" className={styles.addNewsButton}>
          Dodaj news
        </Link>
      </section>

      {/* Sekcja z newsami */}
      <section className={styles.newsSection}>
        <h2>Aktualności</h2>
        {Object.entries(groupedNews).map(([date, items]) => (
          <div key={date} className={styles.newsGroup}>
            <div className={styles.dateHeader}>
              <div className={styles.dateInfo}>
                <h3>{formatDate(date)}</h3>
                <div className={styles.dateContent}>
                  <h4>{items[0].title}</h4>
                  <p>{items[0].description}</p>
                </div>
              </div>
            </div>
            <div className={styles.newsGrid}>
              {items.flatMap(item => item.images).map((image, index) => (
                <div
                  key={`${date}-${index}`}
                  className={styles.newsItem}
                  onClick={() => handleImageClick(image.url, date)}
                >
                  <div className={styles.thumbnailContainer}>
                    <Image
                      src={image.url}
                      alt={image.description || `Zdjęcie ${index + 1}`}
                      width={150}
                      height={150}
                      className={styles.newsImage}
                    />
                  </div>
                  <div className={styles.newsContent}>
                    {image.description && <p>{image.description}</p>}
                    {image.location && (
                      <div className={styles.locationInfo}>
                        <span className={styles.locationIcon}>📍</span>
                        <span>{image.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Modal z pełnym zdjęciem */}
      {selectedImage && (
        <div className={styles.modal} onClick={() => {
          setSelectedImage(null);
          setSelectedDate(null);
        }}>
          <button 
            className={styles.modalNavButton} 
            onClick={handlePrevImage}
            style={{ left: '20px' }}
          >
            ‹
          </button>
          <div className={styles.modalContent}>
            <Image
              src={selectedImage}
              alt="Pełne zdjęcie"
              width={800}
              height={600}
              className={styles.modalImage}
            />
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
