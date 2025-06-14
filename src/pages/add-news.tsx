import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/AddNews.module.css';
import { ImageData } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

interface ImageWithFile extends Omit<ImageData, 'url'> {
  file: File;
  preview: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_WIDTH_OR_HEIGHT = 1920; // maksymalna szerokość lub wysokość
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
  useWebWorker: true,
  fileType: 'image/jpeg'
};

export default function AddNews() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<ImageWithFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compressImage = async (file: File): Promise<File> => {
    try {
      // Jeśli plik jest mniejszy niż MAX_FILE_SIZE, nie kompresuj
      if (file.size <= MAX_FILE_SIZE) {
        return file;
      }

      const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
      console.log('Oryginalny rozmiar:', file.size / 1024 / 1024, 'MB');
      console.log('Skompresowany rozmiar:', compressedFile.size / 1024 / 1024, 'MB');
      return compressedFile;
    } catch (error) {
      console.error('Błąd podczas kompresji:', error);
      throw new Error('Nie udało się skompresować obrazu');
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      try {
        const newFiles = Array.from(e.target.files);
        const compressedFiles = await Promise.all(
          newFiles.map(async (file) => {
            const compressedFile = await compressImage(file);
            return {
              file: compressedFile,
              preview: URL.createObjectURL(compressedFile),
              description: '',
              location: ''
            };
          })
        );
        setImages(prev => [...prev, ...compressedFiles]);
      } catch (error) {
        console.error('Błąd podczas przetwarzania obrazów:', error);
        setError('Nie udało się przetworzyć obrazów. Spróbuj ponownie.');
      }
    }
  };

  const handleImageRemove = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleImageDescriptionChange = (index: number, value: string) => {
    setImages(prev => {
      const newImages = [...prev];
      newImages[index] = { ...newImages[index], description: value };
      return newImages;
    });
  };

  const handleImageLocationChange = (index: number, value: string) => {
    setImages(prev => {
      const newImages = [...prev];
      newImages[index] = { ...newImages[index], location: value };
      return newImages;
    });
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64,
              filename: file.name,
            }),
          });

          if (!response.ok) {
            throw new Error('Błąd podczas uploadu obrazu');
          }

          const data = await response.json();
          resolve(data.url);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Błąd podczas odczytu pliku'));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    try {
      const uploadedImages = await Promise.all(
        images.map(async (image) => {
          try {
            const url = await handleImageUpload(image.file);
            return {
              url,
              description: image.description,
              location: image.location
            };
          } catch (error) {
            console.error('Błąd podczas uploadu obrazu:', error);
            throw new Error(`Błąd podczas uploadu obrazu ${image.file.name}: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
          }
        })
      );

      const newsData = {
        title,
        description,
        images: uploadedImages,
        created_at: new Date().toISOString()
      };

      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas zapisywania newsa');
      }

      router.push('/');
    } catch (error) {
      console.error('Błąd podczas zapisywania:', error);
      setError(error instanceof Error ? error.message : 'Wystąpił nieznany błąd');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dodaj nowy wpis</h1>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Tytuł:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Opis:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className={styles.textarea}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Zdjęcia:</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className={styles.fileInput}
          />
          <div className={styles.imageGrid}>
            {images.map((image, index) => (
              <div key={index} className={styles.imageContainer}>
                <img
                  src={image.preview}
                  alt={`Podgląd ${index + 1}`}
                  className={styles.preview}
                />
                <input
                  type="text"
                  placeholder="Opis zdjęcia"
                  value={image.description}
                  onChange={(e) => handleImageDescriptionChange(index, e.target.value)}
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="Lokalizacja"
                  value={image.location}
                  onChange={(e) => handleImageLocationChange(index, e.target.value)}
                  className={styles.input}
                />
                <button
                  type="button"
                  onClick={() => handleImageRemove(index)}
                  className={styles.removeButton}
                >
                  Usuń
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className={styles.submitButton}
        >
          {uploading ? 'Zapisywanie...' : 'Zapisz'}
        </button>
      </form>
    </div>
  );
} 