// src/components/Map.js
import React, { useEffect, useRef, useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const defaultCenter = {
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
  const [userLocation, setUserLocation] = useState(defaultCenter); // Set initial location to defaultCenter
  // const [mapKey, setMapKey] = useState(Date.now()); // State to track map key for re-rendering
  const db = getFirestore();
  const directionsPanelRef = useRef(null); // Reference for the directions panel

  useEffect(() => {
    // Fetch vendor data from Firestore
    const fetchVendors = async () => {
      try {
        const vendorCollection = collection(db, 'vendors');
        const vendorSnapshot = await getDocs(vendorCollection);
        const vendorList = vendorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVendors(vendorList);
        // setMapKey(Date.now()); // Update map key to force re-render
      } catch (error) {
        console.error("Error fetching vendors: ", error);
      }
    };

    fetchVendors();
  }, [db]);

  useEffect(() => {
    // Get User Location
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => {
            console.warn("Geolocation permission denied. Using default location.");
          }
        );
      } else {
        console.warn("Geolocation is not supported by this browser. Using default location.");
      }
    };

    getUserLocation();
  }, []);

  useEffect(() => {
    if (isLoaded && mapRef.current) {
      // Initialize the map, centering on user's location or default center
      const map = new window.google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 10,
      });

      // Add User Location Marker
      new window.google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'You are here',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        },
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

          // Info Window and Navigation Directions
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
                  
                  <button id="navigateButton">Navigate Here</button>
                  <p><em>Last updated: ${vendor.lastUpdated ? new Date(vendor.lastUpdated.seconds * 1000).toLocaleString() : 'N/A'}</em></p>
                </div>
              `,
            });
            infoWindow.open(map, marker);

            // Add navigation functionality
            window.google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
              document.getElementById("navigateButton").addEventListener("click", () => {
                displayDirections(userLocation, { lat: vendor.location.lat, lng: vendor.location.lng }, map);
              });
            });
          });
        }
      });
    }
  }, [isLoaded, vendors, userLocation]); // Remove mapKey to avoid unnecessary reinitializing

  // Function to display directions between user location and vendor
  const displayDirections = (origin, destination, map) => {
    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      suppressMarkers: false,  // Show markers for start and end locations
      panel: directionsPanelRef.current,  // Attach the directions panel to this reference
    });
    directionsRenderer.setMap(map);

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(response);
        } else {
          alert("Directions request failed due to " + status);
        }
      }
    );
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div className="map-container-wrapper">
      <div ref={mapRef} className="map-container"></div>
      <div ref={directionsPanelRef} className="directions-panel"></div> {/* Panel for turn-by-turn directions */}
    </div>
  );
}

export default Map;
