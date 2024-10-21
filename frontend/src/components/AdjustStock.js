// src/components/AdjustStock.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useLoadScript } from '@react-google-maps/api';
import './AdjustStock.css';

const LIBRARIES = ['places'];

function AdjustStock() {
  const { vendorId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorLocation, setVendorLocation] = useState(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorNote, setVendorNote] = useState('');
  const [updatedQuantities, setUpdatedQuantities] = useState({});
  const mapRef = useRef(null);
  const db = getFirestore();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  // Fetch vendor items and location from Firestore
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const vendorItemsRef = doc(db, `vendors/${vendorId}`);
        const vendorDoc = await getDoc(vendorItemsRef);

        if (vendorDoc.exists()) {
          const vendorData = vendorDoc.data();
          setItems(vendorData.items || []);
          setVendorLocation(vendorData.location || null);
          setVendorName(vendorData.vendorName || '');
          setVendorAddress(vendorData.location?.address || '');
          setVendorNote(vendorData.location?.note || '');
        } else {
          console.error('Vendor not found');
        }
      } catch (error) {
        console.error('Error fetching vendor items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [db, vendorId]);

  useEffect(() => {
    if (isLoaded && mapRef.current && vendorLocation) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: vendorLocation.lat, lng: vendorLocation.lng },
        zoom: 14,
      });

      new window.google.maps.Marker({
        position: { lat: vendorLocation.lat, lng: vendorLocation.lng },
        map: map,
        title: 'Vendor Location',
      });
    }
  }, [isLoaded, vendorLocation]);

  const handleQuantityChange = (index, newQuantity) => {
    setUpdatedQuantities((prevQuantities) => ({
      ...prevQuantities,
      [index]: newQuantity,
    }));
  };

  const handleUpdateClick = async (index) => {
    try {
      const newQuantity = updatedQuantities[index];
      if (newQuantity != null) {
        // Update the quantity in the items array
        const updatedItems = [...items];
        updatedItems[index] = {
          ...updatedItems[index],
          quantity: newQuantity,
        };

        // Update the entire vendor document with the modified items array
        const vendorRef = doc(db, `vendors/${vendorId}`);
        await updateDoc(vendorRef, { items: updatedItems });
        setItems(updatedItems);
        alert('Stock updated successfully');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock, please try again.');
    }
  };


  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div className="adjust-stock-container">
      {loading ? (
        <p>Loading vendor details...</p>
      ) : (
        <>
          <div className="vendor-details">
            <h2>{vendorName}'s Farm Stand</h2>
            <p><strong>Address:</strong> {vendorAddress}</p>
            {vendorNote && <p><strong>Note:</strong> {vendorNote}</p>}
          </div>
          <div className="current-stock">
            <h3>Current Stock</h3>
            <div className="stock-list-container centered">
              {items.length === 0 ? (
                <p>No items available for this vendor.</p>
              ) : (
                <ul className="stock-list centered-stock-list">
                  {items.map((item, index) => (
                    <li key={index} className="stock-item centered-stock-item">
                      <div className="item-info">
                        <span className="item-name" style={{ marginRight: '10px', fontWeight: 'bold' }}>Item: {item.name}</span>
                        <label htmlFor={`quantity-${index}`} style={{ marginRight: '10px' }}>Quantity available:</label>
                        <input
                          type="number"
                          id={`quantity-${index}`}
                          value={updatedQuantities[index] !== undefined ? updatedQuantities[index] : item.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10))}
                          style={{ marginLeft: '10px' }}
                        />
                        <button onClick={() => handleUpdateClick(index)} style={{ marginLeft: '10px' }}>Update Quantity</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div ref={mapRef} className="map-container"></div>
        </>
      )}
    </div>
  );
}

export default AdjustStock;
