// src/components/VendorDashboard.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import '../VendorDashboard.css';

function VendorDashboard() {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [user, setUser] = useState(null);
  const [vendorName, setVendorName] = useState('');
  const [email, setEmail] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const navigate = useNavigate();
  const db = getFirestore();
  const auth = getAuth();

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({ debounce: 30 });

  // Check if user is logged in and fetch vendor details
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (!currentUser.emailVerified) {
          alert('Please verify your email address before accessing the dashboard.');
          navigate('/signin'); // Redirect to sign-in if email is not verified
          return;
        }

        setUser(currentUser);

        // Fetch vendor details from Firestore
        const vendorDoc = await getDoc(doc(db, 'vendors', currentUser.uid));
        if (vendorDoc.exists()) {
          const vendorData = vendorDoc.data();
          setVendorName(vendorData.vendorName);
          setEmail(currentUser.email); // Get email from the current user
          if (vendorData.location) {
            setSelectedAddress(vendorData.location.address);
            setLocationNote(vendorData.location.note || '');
            setLocation(vendorData.location);
          }
          setItems(vendorData.items || []);
        }
      } else {
        navigate('/signin');
      }
    });

    return () => unsubscribe();
  }, [navigate, db, auth]);

  const handleSetLocation = async (e) => {
    e.preventDefault();
    if (selectedAddress) {
      try {
        const response = await getGeocode({ address: selectedAddress });
        if (response.length === 0) {
          throw new Error("No geocode results found for this address");
        }
        const { lat, lng } = await getLatLng(response[0]);
        const updatedLocation = {
          address: selectedAddress,
          note: locationNote || '',
          lat,
          lng,
        };

        await setDoc(doc(db, 'vendors', user.uid), { location: updatedLocation, lastUpdated: new Date() }, { merge: true });
        setLocation(updatedLocation);
        alert('Location updated successfully');
        clearSuggestions();
        setIsEditingLocation(false);
      } catch (error) {
        console.error('Error setting location: ', error);
        alert('Error setting location. Please check the address and try again.');
      }
    } else {
      alert('Please enter a valid address.');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (locationNote) {
      try {
        const updatedLocation = {
          ...location,
          note: locationNote,
        };
        await setDoc(doc(db, 'vendors', user.uid), { location: updatedLocation, lastUpdated: new Date() }, { merge: true });
        setLocation(updatedLocation);
        alert('Location note updated successfully');
        setIsEditingNote(false);
      } catch (error) {
        console.error('Error updating note: ', error);
        alert('Error updating note. Please try again.');
      }
    }
  };

  // Handle adding a new item
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (newItemName && newItemQuantity) {
      try {
        const newItem = {
          name: newItemName,
          quantity: parseInt(newItemQuantity, 10),
        };
        const updatedItems = [...items, newItem];
        await setDoc(doc(db, 'vendors', user.uid), { items: updatedItems }, { merge: true });
        setItems(updatedItems);

        setNewItemName('');
        setNewItemQuantity('');
      } catch (error) {
        console.error('Error adding new item:', error);
        alert('Error adding item. Please try again.');
      }
    }
  };

  // Handle editing an item
  const handleEditItem = (index) => {
    const itemToEdit = items[index];
    setNewItemName(itemToEdit.name);
    setNewItemQuantity(itemToEdit.quantity);
    handleDeleteItem(index); // Remove the item so it can be updated
  };

  // Handle deleting an item
  const handleDeleteItem = async (index) => {
    try {
      const updatedItems = items.filter((_, i) => i !== index);
      await setDoc(doc(db, 'vendors', user.uid), { items: updatedItems }, { merge: true });
      setItems(updatedItems);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item. Please try again.');
    }
  };

  const handleRemoveLocation = async () => {
    try {
      await setDoc(doc(db, 'vendors', user.uid), { location: null }, { merge: true });
      setLocation(null);
      setSelectedAddress('');
      alert('Location removed successfully');
    } catch (error) {
      console.error('Error removing location: ', error);
      alert('Error removing location. Please try again.');
    }
  };

  const handleRemoveLocationNote = async () => {
    try {
      const updatedLocation = {
        ...location,
        note: null,
      };
      await setDoc(doc(db, 'vendors', user.uid), { location: updatedLocation }, { merge: true });
      setLocationNote('');
      setLocation(updatedLocation);
      alert('Location note removed successfully');
    } catch (error) {
      console.error('Error removing location note: ', error);
      alert('Error removing location note. Please try again.');
    }
  };

  return (
    <div className="dashboard-container">
      <>
        <h2>{vendorName ? `${vendorName}'s Dashboard` : 'Vendor Dashboard'}</h2>

        {/* Email Section */}
        <div className="contact-info">
          <p>Email: {email}</p>
        </div>

        {/* Change Password Link */}
        <div className="change-password-link">
          <a href="/changepassword">Change Password</a>
        </div>
        <div id="recaptcha-container"></div>

        <hr />
        {/* Location Section */}
        {isEditingLocation ? (
          <form onSubmit={handleSetLocation} className="location-form">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter Address"
              className="location-input"
              style={{ width: '400px', height: '50px', marginBottom: '10px' }}
              disabled={!ready}
              required
            />
            <button type="submit" className="set-location-button" style={{ height: '55px' }}>Save Location</button>
            <button type="button" onClick={() => setIsEditingLocation(false)} className="cancel-button">Cancel</button>
            {status === "OK" && (
              <ul className="suggestions-list">
                {data.map(({ place_id, description }) => (
                  <li key={place_id} onClick={() => {
                    setValue(description, false);
                    setSelectedAddress(description);
                    clearSuggestions();
                  }}>
                    {description}
                  </li>
                ))}
              </ul>
            )}
          </form>
        ) : (
          <div className="location-info">
            {!selectedAddress && (
              <>
                <p><i>Click the "ADD ADDRESS" button below to share your address. If you don't have an address set, no one will be able to see your vendor page!

                </i></p>
              </>
            )}
            <p>Address: {selectedAddress}</p>
            <button onClick={() => setIsEditingLocation(true)} className="edit-button">ADD ADDRESS</button>
            <button onClick={() => handleRemoveLocation()} className="remove-button">REMOVE ADDRESS</button>
          </div>
        )}

        {/* Location Note Section */}
        {isEditingNote ? (
          <form onSubmit={handleAddNote} className="location-note-form">
            <input
              type="text"
              placeholder="Location Note (e.g., at the end of the driveway)"
              value={locationNote}
              onChange={(e) => setLocationNote(e.target.value)}
              className="location-input"
              style={{ width: '400px', height: '50px', marginBottom: '10px' }}
            />
            <button type="submit" className="add-note-button" style={{ height: '55px' }}>Save Note</button>
            <button type="button" onClick={() => setIsEditingNote(false)} className="cancel-button">Cancel</button>
          </form>
        ) : (
          <div className="location-note-info">
            {!locationNote && (
              <>
                <p><i>OPTIONAL (but recommended): Click the "ADD LOCATION NOTE" button below to add a note that might help people find your farm stand.</i></p>
              </>
            )}
            <p>Note: {locationNote || 'N/A'}</p>
            <button onClick={() => setIsEditingNote(true)} className="edit-button">ADD LOCATION NOTE</button>
            <button onClick={() => handleRemoveLocationNote()} className="remove-button">REMOVE NOTE</button>
          </div>
        )}

        <hr />

        {/* Stock Section */}

        <h3>Current Stock</h3>
        {items.length === 0 ? (
          <p>No items added yet.</p>
        ) : (
          <ul className="stock-list">
            {items.map((item, index) => (
              <li key={index} className="stock-item">
                {item.name}: {item.quantity}
                <button onClick={() => handleEditItem(index)} className="edit-item-button">Edit</button>
                <button onClick={() => handleDeleteItem(index)} className="delete-item-button">Delete</button>
              </li>
            ))}
          </ul>
        )}

        <hr />

        <h3>Add New Item</h3>
        <form onSubmit={handleAddItem} className="item-form">
          <div className="item-form-row">
            <input
              type="text"
              placeholder="Item Name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="item-input"
              style={{ width: '200px', height: '35px', marginRight: '10px' }}
              required
            />
            <input
              type="number"
              placeholder="Quantity"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              className="item-quantity-input"
              style={{ width: '200px', height: '35px', marginRight: '10px' }}
              required
            />
            <button type="submit" className="add-item-button" style={{ height: '39px' }}>Add Item</button>
          </div>
        </form>

        <hr />

        <div className="qr-code-section">
        <h3>QR Code for Your Vendor Page</h3>
         <p>Generate and print a QR code for your customers to scan:</p>
          {user && user.uid && (
            <Link to={`/generate-qrcode/${user.uid}`} className="generate-qrcode-link">
              Generate QR Code </Link>
          )}
      </div>

      </>
    </div>
  );
}

export default VendorDashboard;
