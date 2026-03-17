import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ItineraryItem, Language } from '../types';
import { translations } from '../translations';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  destination: string;
  items: ItineraryItem[];
  lang?: Language;
}

interface Location {
  lat: number;
  lon: number;
  name: string;
  description?: string;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

export function MapView({ destination, items, lang = 'en' }: MapViewProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [center, setCenter] = useState<[number, number]>([9.03, 38.74]); // Default to Addis Ababa
  const [loading, setLoading] = useState(true);
  const t = translations[lang];

  useEffect(() => {
    async function geocode(query: string): Promise<[number, number] | null> {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
      return null;
    }

    async function fetchAllLocations() {
      setLoading(true);
      const destCoords = await geocode(destination);
      if (destCoords) {
        setCenter(destCoords);
      }

      const itemLocations: Location[] = [];
      for (const item of items) {
        if (item.location) {
          const coords = await geocode(`${item.location}, ${destination}`);
          if (coords) {
            itemLocations.push({
              lat: coords[0],
              lon: coords[1],
              name: item.title,
              description: item.description
            });
          }
        }
      }
      setLocations(itemLocations);
      setLoading(false);
    }

    fetchAllLocations();
  }, [destination, items]);

  if (loading) {
    return (
      <div className="h-[500px] w-full bg-stone-100 rounded-[40px] flex items-center justify-center animate-pulse">
        <p className="text-stone-400 font-medium italic">{t.loadingMap}</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full rounded-[40px] overflow-hidden shadow-xl border border-stone-200">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={center} />
        
        {/* Destination Marker */}
        <Marker position={center}>
          <Popup>
            <div className="font-bold">{destination}</div>
            <div className="text-xs text-stone-500">{t.mainDestination}</div>
          </Popup>
        </Marker>

        {/* Itinerary Markers */}
        {locations.map((loc, idx) => (
          <Marker key={idx} position={[loc.lat, loc.lon]}>
            <Popup>
              <div className="font-bold">{loc.name}</div>
              {loc.description && <div className="text-xs text-stone-500 mt-1">{loc.description}</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
