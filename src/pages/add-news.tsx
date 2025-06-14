import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/AddNews.module.css';
import { addNews } from '../lib/supabase';

interface ImageData {
  file: File;
  preview: string;
  description: string;
  location?: string;
}

export default function AddNews() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<ImageData[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newImage = {
        file,
        preview: URL.createObjectURL(file),
        description: '',
        location: ''
      };
      setImages(prev => [...prev, newImage]);
      // Resetuj input, aby można było wybrać to samo zdjęcie ponownie
      e.target.value = '';
    }
  };

  const handleDescriptionChange = (index: number, value: string) => {
    setImages(prev => prev.map((img, i) => 
      i === index ? { ...img, description: value } : img
    ));
  };

  const handleLocationClick = async (index: number) => {
    if ("geolocation" in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        const { latitude, longitude } = position.coords;
        const location = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        setImages(prev => prev.map((img, i) => 
          i === index ? { ...img, location } : img
        ));
      } catch (error) {
        console.error('Błąd podczas pobierania lokalizacji:', error);
        alert('Nie udało się pobrać lokalizacji. Sprawdź uprawnienia przeglądarki.');
      }
    } else {
      alert('Twoja przeglądarka nie wspiera geolokalizacji.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || images.length === 0) {
      alert('Proszę wypełnić wszystkie pola i dodać przynajmniej jedno zdjęcie');
      return;
    }

    setUploading(true);

    try {
      const uploadedImages = await Promise.all(
        images.map(async (image) => {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(image.file);
          });

          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64,
              filename: image.file.name,
            }),
          });

          if (!response.ok) {
            throw new Error('Błąd podczas przesyłania zdjęcia');
          }

          const data = await response.json();
          return {
            url: data.url,
            description: image.description,
            location: image.location
          };
        })
      );

      await addNews({
        title,
        description,
        images: uploadedImages,
        date: new Date().toISOString()
      });

      router.push('/');
    } catch (error) {
      console.error('Błąd:', error);
      alert('Wystąpił błąd podczas zapisywania newsa');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Dodaj nowy news</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Tytuł:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Opis:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Zdjęcia:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            className={styles.hiddenInput}
          />
          <button
            type="button"
            onClick={handleAddImage}
            className={styles.addImageButton}
          >
            + Dodaj zdjęcie
          </button>
        </div>

        <div className={styles.imageGrid}>
          {images.map((image, index) => (
            <div key={index} className={styles.imageContainer}>
              <img
                src={image.preview}
                alt={`Podgląd ${index + 1}`}
                className={styles.preview}
              />
              <div className={styles.imageControls}>
                <input
                  type="text"
                  value={image.description}
                  onChange={(e) => handleDescriptionChange(index, e.target.value)}
                  placeholder="Opis zdjęcia"
                  className={styles.descriptionInput}
                />
                <button
                  type="button"
                  onClick={() => handleLocationClick(index)}
                  className={styles.locationButton}
                >
                  {image.location ? '✓ Lokalizacja dodana' : 'Dodaj lokalizację'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className={styles.removeButton}
                >
                  Usuń
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={uploading}
          className={styles.submitButton}
        >
          {uploading ? 'Zapisywanie...' : 'Zapisz news'}
        </button>
      </form>
    </div>
  );
} 