import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix standard Leaflet default icon paths if needed
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PRESET_CITIES = [
  { name: 'Jakarta Pusat', lat: -6.1951, lng: 106.8208 },
  { name: 'Bandung', lat: -6.9175, lng: 107.6191 },
  { name: 'Subang', lat: -6.5683, lng: 107.7585 },
  { name: 'Surabaya', lat: -7.2575, lng: 112.7521 },
];

const TILE_LAYERS = {
  streets: {
    name: 'Akses Jalan Jelas (OSM)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    },
  },
  voyager: {
    name: 'Modern Terang',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    },
  },
  dark: {
    name: 'Studio Gelap',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    },
  },
};

function AddressMapModal({
  isOpen,
  initialAddress = '',
  initialCoords = null,
  initialNote = '',
  onClose,
  onConfirmAddress,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [coords, setCoords] = useState(
    initialCoords?.lat && initialCoords?.lng
      ? initialCoords
      : { lat: -6.1951, lng: 106.8208 } // Default: Jakarta Pusat
  );
  const [addressText, setAddressText] = useState(initialAddress || 'Memuat titik lokasi...');
  const [courierNote, setCourierNote] = useState(initialNote || '');
  const [mapStyle, setMapStyle] = useState('streets'); // Default to 'streets' so all road access is vibrant and visible!
  const [isLocating, setIsLocating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isPinHovering, setIsPinHovering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Initialize Leaflet map whenever modal opens; clean up completely when it closes
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
      }
      return;
    }

    const startLat = coords?.lat ?? -6.1951;
    const startLng = coords?.lng ?? 106.8208;

    if (!mapContainerRef.current) return;

    // Destroy any stale instance before creating a new one
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 16,
      zoomControl: false,
    });

    // Zoom control on top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial Tile Layer: OSM Streets (High visibility of roads & alleys)
    const layerConfig = TILE_LAYERS[mapStyle] || TILE_LAYERS.streets;
    const tileLayer = L.tileLayer(layerConfig.url, layerConfig.options).addTo(map);
    tileLayerRef.current = tileLayer;

    map.on('movestart', () => {
      setIsPinHovering(true);
    });

    map.on('moveend', () => {
      setIsPinHovering(false);
      const center = map.getCenter();
      const nextCoords = { lat: center.lat, lng: center.lng };
      setCoords(nextCoords);
      reverseGeocode(center.lat, center.lng);
    });

    mapInstanceRef.current = map;

    // Multiple layout passes to guarantee tiles fill the container as animation completes
    const t1 = setTimeout(() => {
      map.invalidateSize();
      if (!initialAddress) {
        reverseGeocode(startLat, startLng);
      }
    }, 60);

    const t2 = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const t3 = setTimeout(() => {
      map.invalidateSize();
    }, 550);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle map style / tile layer changes dynamically
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const layerConfig = TILE_LAYERS[mapStyle] || TILE_LAYERS.streets;
    const newLayer = L.tileLayer(layerConfig.url, layerConfig.options);
    newLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Sync initial address & note when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialAddress) setAddressText(initialAddress);
      if (initialNote) setCourierNote(initialNote);
      if (initialCoords?.lat && initialCoords?.lng) {
        setCoords(initialCoords);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([initialCoords.lat, initialCoords.lng], 16);
        }
      }
      setGeoError(null);
      setSearchResults([]);
    }
  }, [isOpen, initialAddress, initialNote, initialCoords]);

  // Reverse geocode lat, lng into human readable Indonesian address
  const reverseGeocode = async (lat, lng) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsResolving(true);
    setGeoError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'Accept-Language': 'id, en',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding error');
      }

      const data = await response.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || addr.village || '';
        const district = addr.city_district || addr.district || addr.subdistrict || addr.county || '';
        const city = addr.city || addr.town || addr.municipality || addr.state || '';
        const postcode = addr.postcode ? ` ${addr.postcode}` : '';

        const shortParts = [road, district, city].filter(Boolean);
        const readableAddress = shortParts.length > 0 ? `${shortParts.join(', ')}${postcode}` : data.display_name;
        setAddressText(readableAddress);
      } else {
        setAddressText(`Titik Terpilih (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setAddressText(`Titik Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } finally {
      setIsResolving(false);
    }
  };

  // Search places via Nominatim
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setGeoError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=id&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id, en',
          },
        }
      );

      if (!response.ok) throw new Error('Pencarian gagal');
      const results = await response.json();

      if (results.length === 0) {
        setGeoError('Lokasi tidak ditemukan. Coba ketik nama jalan, gedung, atau area yang lebih spesifik.');
      } else {
        setSearchResults(results);
      }
    } catch {
      setGeoError('Koneksi pencarian peta bermasalah. Silakan geser peta langsung.');
    } finally {
      setIsSearching(false);
    }
  };

  // Select a search result
  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setCoords({ lat, lng });
    setAddressText(result.display_name);
    setSearchResults([]);
    setSearchQuery('');

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
    }
  };

  // Detect GPS location from device
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGeoError('Fitur GPS tidak didukung di browser ini.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        setIsLocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === 1) {
          setGeoError('Izin akses lokasi belum diizinkan. Silakan geser peta secara manual.');
        } else {
          setGeoError('Gagal mendeteksi lokasi saat ini. Silakan gunakan kotak pencarian.');
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Teleport to a preset city
  const handleSelectPreset = (city) => {
    setCoords({ lat: city.lat, lng: city.lng });
    setSearchResults([]);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([city.lat, city.lng], 16, { duration: 1 });
    }
  };

  // Save and lock address
  const handleSaveAddress = () => {
    onConfirmAddress({
      address: addressText,
      coordinates: coords,
      courierNote: courierNote.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="address-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="map-modal-title">
      <div className="address-modal-container">
        {/* Modal Header */}
        <header className="address-modal-header">
          <div>
            <span className="address-modal-tag">PINPOINT MAPS</span>
            <h3 id="map-modal-title">Atur Titik Pengiriman Alamat</h3>
          </div>
          <button
            type="button"
            className="address-modal-close"
            onClick={onClose}
            aria-label="Tutup peta alamat"
          >
            ✕
          </button>
        </header>

        {/* Search Bar & GPS Trigger */}
        <div className="address-modal-search-row">
          <form className="address-modal-search-form" onSubmit={handleSearchSubmit}>
            <span className="address-modal-search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari jalan, gedung, perumahan, atau area..."
              className="address-modal-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="address-modal-search-clear"
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                aria-label="Hapus teks pencarian"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="address-modal-search-btn"
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? 'Mencari...' : 'Cari'}
            </button>
          </form>

          <button
            type="button"
            className={`address-modal-gps-btn ${isLocating ? 'is-locating' : ''}`}
            onClick={handleDetectGPS}
            disabled={isLocating}
            title="Gunakan lokasi GPS saat ini"
          >
            <span className="address-modal-gps-icon">📍</span>
            <span>{isLocating ? 'Mendeteksi...' : 'Lokasi Saya'}</span>
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <ul className="address-modal-results-list" role="listbox">
            {searchResults.map((item, idx) => (
              <li key={item.place_id || idx} role="option" aria-selected={false}>
                <button
                  type="button"
                  className="address-modal-result-item"
                  onClick={() => handleSelectSearchResult(item)}
                >
                  <span className="address-modal-result-icon">📍</span>
                  <div className="address-modal-result-info">
                    <strong>{item.name || item.display_name.split(',')[0]}</strong>
                    <small>{item.display_name}</small>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Preset City & Layer Style Row */}
        <div className="address-modal-toolbar-row">
          <div className="address-modal-presets">
            <span className="address-modal-preset-label">Kota Cepat:</span>
            {PRESET_CITIES.map((city) => (
              <button
                key={city.name}
                type="button"
                className="address-modal-preset-pill"
                onClick={() => handleSelectPreset(city)}
              >
                {city.name}
              </button>
            ))}
          </div>

          {/* Map Layer Switcher */}
          <div className="address-modal-layer-toggles" role="group" aria-label="Pilihan Tampilan Peta">
            <button
              type="button"
              className={`address-modal-layer-btn ${mapStyle === 'streets' ? 'is-active' : ''}`}
              onClick={() => setMapStyle('streets')}
              title="Peta dengan jalan dan gang sangat jelas"
            >
              🗺️ Jalan Jelas
            </button>
            <button
              type="button"
              className={`address-modal-layer-btn ${mapStyle === 'voyager' ? 'is-active' : ''}`}
              onClick={() => setMapStyle('voyager')}
              title="Peta modern bersih"
            >
              🏙️ Modern
            </button>
            <button
              type="button"
              className={`address-modal-layer-btn ${mapStyle === 'dark' ? 'is-active' : ''}`}
              onClick={() => setMapStyle('dark')}
              title="Peta tema gelap"
            >
              🌙 Studio Gelap
            </button>
          </div>
        </div>

        {/* Error / Alert notice if any */}
        {geoError && (
          <div className="address-modal-alert">
            <span>⚠️</span>
            <span>{geoError}</span>
          </div>
        )}

        {/* Map View Container with Static Center Pin Overlay */}
        <div className="address-modal-map-wrapper">
          <div ref={mapContainerRef} className="address-modal-map-viewport" />

          {/* Luxury Center Pinpoint Overlay */}
          <div
            className={`address-modal-center-pin ${isPinHovering ? 'is-lifted' : ''}`}
            aria-hidden="true"
          >
            <div className="address-modal-pin-bubble">
              <span>{isResolving ? 'Membaca titik...' : 'Geser untuk mengatur titik'}</span>
            </div>
            <div className="address-modal-pin-marker">
              <svg viewBox="0 0 38 52" fill="none" className="address-modal-pin-svg">
                <path
                  d="M19 0C8.50659 0 0 8.50659 0 19C0 32.8 19 52 19 52C19 52 38 32.8 38 19C38 8.50659 29.4934 0 19 0Z"
                  fill="#E11D48"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <circle cx="19" cy="19" r="8" fill="#FFFFFF" />
                <circle cx="19" cy="19" r="4.5" fill="#0F172A" />
              </svg>
              <div className="address-modal-pin-pulse" />
            </div>
          </div>
        </div>

        {/* Address Details Card & Courier Note */}
        <div className="address-modal-details-card">
          <div className="address-modal-selected-head">
            <span className="address-modal-selected-badge">
              {isResolving ? 'Memperbarui...' : 'TITIK TERPILIH'}
            </span>
            <span className="address-modal-coords-pill">
              {coords?.lat?.toFixed(5)}, {coords?.lng?.toFixed(5)}
            </span>
          </div>

          <div className="address-modal-selected-content">
            <span className="address-modal-selected-icon">📍</span>
            <div className="address-modal-selected-text">
              <h4>{addressText}</h4>
              <p>Geser peta atau perbesar (zoom in) untuk mengunci titik gerbang, jalan masuk, atau nomor rumah dengan presisi.</p>
            </div>
          </div>

          {/* Courier Note Input */}
          <div className="address-modal-note-group">
            <label htmlFor="address-modal-courier-note">
              Catatan Kurir & Patokan (Opsional)
            </label>
            <input
              id="address-modal-courier-note"
              type="text"
              maxLength={120}
              value={courierNote}
              onChange={(e) => setCourierNote(e.target.value)}
              placeholder="Cth: Pagar abu-abu / Blok B-12 / Masuk gang sebelah toko"
              className="address-modal-note-input"
            />
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            className="address-modal-save-btn"
            onClick={handleSaveAddress}
          >
            Gunakan Titik Alamat Ini ✓
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddressMapModal;
