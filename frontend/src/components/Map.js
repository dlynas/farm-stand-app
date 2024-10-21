// src/components/Map.js
import React, { useEffect, useRef, useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const center = {
  lat: 41.9000,
  lng: -72.0000,
};

const LIBRARIES = ['places'];

function Map() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const mapRef = useRef(null);
  const [vendors, setVendors] = useState([]);
  const db = getFirestore();

  // Fetch vendor data from Firestore
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const vendorCollection = collection(db, 'vendors');
        const vendorSnapshot = await getDocs(vendorCollection);
        const vendorList = vendorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVendors(vendorList);
      } catch (error) {
        console.error("Error fetching vendors: ", error);
      }
    };

    fetchVendors();
  }, [db]);

  useEffect(() => {
    if (isLoaded && mapRef.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: 10,
      });

      // Adding Markers for Each Vendor
      vendors.forEach((vendor) => {
        if (vendor.location) {
          const totalQuantity = vendor.items ? vendor.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
          const markerIconUrl = totalQuantity > 0
            ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
            : "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

          const marker = new window.google.maps.Marker({
            position: { lat: vendor.location.lat, lng: vendor.location.lng },
            map: map,
            title: vendor.vendorName,
            icon: {
              url: markerIconUrl,
            },
          });

          marker.addListener("click", () => {
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div>
                  <h3>${vendor.vendorName}</h3>
                  <a href="/adjuststock/${vendor.id}">Vendor Details...</a> <!-- Link to Vendor Details -->
                  <p><strong>Address:</strong> ${vendor.location.address}</p>
                  ${vendor.location.note ? `<p><strong>Note:</strong> ${vendor.location.note}</p>` : ''}
                  <h4>Stock Available:</h4>
                  ${vendor.items && vendor.items.length > 0 ? 
                    `<ul>${vendor.items.map(item => `<li>${item.name}: ${item.quantity}</li>`).join('')}</ul>`
                    : '<p>No items available</p>'
                  }
                  
                  <p><em>Last updated: ${vendor.lastUpdated ? new Date(vendor.lastUpdated.seconds * 1000).toLocaleString() : 'N/A'}</em></p>
                </div>
              `,
            });
            infoWindow.open(map, marker);
          });
        }
      });
    }
  }, [isLoaded, vendors]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div ref={mapRef} className="map-container"></div>
  );
}

export default Map;
