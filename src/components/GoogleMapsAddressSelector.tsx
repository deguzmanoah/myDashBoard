"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface AddressComponents {
  address: string;
  city: string;
  region: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

interface GoogleMapsAddressSelectorProps {
  onAddressSelect: (addressData: AddressComponents) => void;
  onMapStatusChange?: (status: { isLoaded: boolean; hasError: boolean }) => void;
  initialValue?: string;
  initialLatitude?: number;
  initialLongitude?: number;
  placeholder?: string;
}

// Note: You'll need to add your Google Maps API key to environment variables
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function GoogleMapsAddressSelector({
  onAddressSelect,
  onMapStatusChange,
  initialValue = '',
  initialLatitude,
  initialLongitude,
  placeholder = 'Search for an address...'
}: GoogleMapsAddressSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string>('');

  const parseAddressComponents = useCallback((components: google.maps.GeocoderAddressComponent[]) => {
    const addressData = {
      city: '',
      region: '',
      zipCode: '',
    };

    components.forEach((component) => {
      const types = component.types;

      if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        addressData.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        addressData.region = component.long_name;
      } else if (types.includes('postal_code') || types.includes('postal_code_prefix')) {
        // Use postal_code_prefix as fallback for areas where full postal code isn't available
        addressData.zipCode = component.long_name;
      }
    });

    return addressData;
  }, []);

  const handlePlaceChanged = useCallback(() => {
    const autocomplete = autocompleteRef.current;
    const map = mapInstanceRef.current;
    
    if (!autocomplete || !map) return;
    
    const place = autocomplete.getPlace();

    if (place.geometry && place.geometry.location) {
      const location = place.geometry.location;
      // Google Maps LatLng has lat() and lng() methods that return numbers
      const lat: number = location.lat();
      const lng: number = location.lng();

      // Update map center and zoom
      map.setCenter({ lat, lng });
      map.setZoom(17);

      // Remove existing marker
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // Add new marker
      const newMarker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: place.formatted_address,
      });

      markerRef.current = newMarker;

      // Parse address components
      const addressComponents = parseAddressComponents(place.address_components || []);
      
      onAddressSelect({
        address: place.formatted_address || '',
        city: addressComponents.city,
        region: addressComponents.region,
        zipCode: addressComponents.zipCode,
        latitude: lat,
        longitude: lng,
      });
    }
  }, [onAddressSelect, parseAddressComponents]);

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    const map = mapInstanceRef.current;
    
    if (!event.latLng || !map) return;
    
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    // Update marker position
    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
    } else {
      const newMarker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
      });
      markerRef.current = newMarker;
    }

    // Reverse geocode to get address
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        if (inputRef.current) {
          inputRef.current.value = result.formatted_address;
        }

        const addressComponents = parseAddressComponents(result.address_components || []);
        
        onAddressSelect({
          address: result.formatted_address || '',
          city: addressComponents.city,
          region: addressComponents.region,
          zipCode: addressComponents.zipCode,
          latitude: lat,
          longitude: lng,
        });
      }
    });
  }, [onAddressSelect, parseAddressComponents]);

  useEffect(() => {
    let isComponentMounted = true;

    const loadGoogleMapsScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (!GOOGLE_MAPS_API_KEY) {
          reject(new Error('Google Maps API key is not configured'));
          return;
        }

        // Check if Google Maps is already loaded
        const googleWindow = window as typeof window & {
          google?: typeof google;
        };

        if (googleWindow.google?.maps) {
          resolve();
          return;
        }

        // Check if script is already loading
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
          return;
        }

        // Create and load the script
        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps script'));
        
        document.head.appendChild(script);
      });
    };

    const setupMap = () => {
      if (!isComponentMounted || !mapRef.current || !inputRef.current) return;

      try {
        setIsLoaded(true);
        onMapStatusChange?.({ isLoaded: true, hasError: false });

        // Initialize map with initial coordinates or default center (Philippines)
        const initialCenter = (initialLatitude && initialLongitude) 
          ? { lat: initialLatitude, lng: initialLongitude }
          : { lat: 14.5995, lng: 120.9842 }; // Manila, Philippines
        
        const initialZoom = (initialLatitude && initialLongitude) ? 17 : 11;
        
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = mapInstance;

        // Add initial marker if coordinates are provided
        if (initialLatitude && initialLongitude) {
          const initialMarker = new google.maps.Marker({
            position: { lat: initialLatitude, lng: initialLongitude },
            map: mapInstance,
            title: initialValue || 'Current location',
          });
          markerRef.current = initialMarker;
        }

        // Initialize autocomplete
        const autocompleteInstance = new google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: 'ph' }, // Restrict to Philippines
            fields: ['address_components', 'geometry', 'formatted_address'],
          }
        );

        autocompleteRef.current = autocompleteInstance;

        // Add place changed listener
        autocompleteInstance.addListener('place_changed', handlePlaceChanged);

        // Add click listener to map
        mapInstance.addListener('click', handleMapClick);
      } catch (error) {
        console.error('Error setting up map:', error);
        setError('Failed to initialize Google Maps.');
        onMapStatusChange?.({ isLoaded: false, hasError: true });
      }
    };

    const initializeMap = async () => {
      try {
        await loadGoogleMapsScript();
        if (isComponentMounted) {
          setupMap();
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        if (isComponentMounted) {
          setError(error instanceof Error ? error.message : 'Failed to load Google Maps');
          onMapStatusChange?.({ isLoaded: false, hasError: true });
        }
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      isComponentMounted = false;
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [handleMapClick, handlePlaceChanged, onMapStatusChange, initialLatitude, initialLongitude, initialValue]);

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Address Search (Fallback)
          </label>
          <input
            ref={inputRef}
            type="text"
            defaultValue={initialValue}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Search Address on Map
        </label>
        <input
          ref={inputRef}
          type="text"
          defaultValue={initialValue}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500">
          Search for an address or click on the map to select a location
        </p>
      </div>
      
      <div 
        ref={mapRef}
        className="w-full h-64"
        style={{ minHeight: '400px' }}
      />
      
      {!isLoaded && !error && (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <p className="text-gray-600">Loading map...</p>
        </div>
      )}
    </div>
  );
}
