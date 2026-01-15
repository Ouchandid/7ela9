import { useState, useEffect } from 'react';

export const useLeaflet = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (document.getElementById('leaflet-css')) {
      setLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
    script.async = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
  }, []);

  return loaded;
};