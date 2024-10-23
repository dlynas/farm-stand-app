// src/components/VendorDashboard.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import '../VendorDashboard.css';

function VendorDashboard({ isLoaded }) {
  const user = auth.currentUser;
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');  // State to hold new item's price
  const [newItemPricePerDozen, setNewItemPricePerDozen] = useState('');  // State to hold the price per dozen
  const [vendorHours, setVendorHours] = useState({
    Mon: { open: '', close: '', closed: true },
    Tues: { open: '', close: '', closed: true },
    Weds: { open: '', close: '', closed: true },
    Thurs: { open: '', close: '', closed: true },
    Fri: { open: '', close: '', closed: true },
    Sat: { open: '', close: '', closed: true },
    Sun: { open: '', close: '', closed: true },
  });
  const handleSaveHours = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'vendors', user.uid), { hours: vendorHours }, { merge: true });
      alert('Hours of operation updated successfully');
    } catch (error) {
      console.error('Error saving hours: ', error);
      alert('Error saving hours. Please try again.');
    }
  };
  
  const [vendorName, setVendorName] = useState('');  
  const [email, setEmail] = useState('');  // Initialize as empty string
  const [locationNote, setLocationNote] = useState('');  // Initialize as empty string
  const [selectedAddress, setSelectedAddress] = useState('');  // Initialize as empty string
  const [location, setLocation] = useState({ address: '', note: '', lat: null, lng: null });  // Initialize location object with valid default values

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const navigate = useNavigate();
  const db = getFirestore();

  const {
    ready,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({ debounce: 30 });
  
  

  // Check if user is logged in and fetch vendor details
  useEffect(() => {
    if (user) {
      if (!user.emailVerified) {
        alert('Please verify your email address before accessing the dashboard.');
        navigate('/signin'); // Redirect to sign-in if email is not verified
        return;
      }

      // Fetch vendor details from Firestore
      const fetchVendorDetails = async () => {
        const vendorRef = doc(db, 'vendors', user.uid);
        try {
          const vendorDoc = await getDoc(vendorRef);

          if (vendorDoc.exists()) {
            // Vendor document exists, populate state
            const vendorData = vendorDoc.data();
            setVendorName(vendorData.vendorName || '');
            setEmail(user.email);
            if (vendorData.location) {
              setSelectedAddress(vendorData.location.address);
              setLocationNote(vendorData.location.note || '');
              setLocation(vendorData.location);
            }
            setItems(vendorData.items || []);
            setVendorHours((prevHours) => vendorData.hours || prevHours);
          } else {
            // Vendor document doesn't exist, create with default values
            await setDoc(vendorRef, {
              vendorName: '',
              email: user.email,
              location: null,
              items: [],
              hours: {
                Mon: { open: '', close: '', closed: true },
                Tues: { open: '', close: '', closed: true },
                Weds: { open: '', close: '', closed: true },
                Thurs: { open: '', close: '', closed: true },
                Fri: { open: '', close: '', closed: true },
                Sat: { open: '', close: '', closed: true },
                Sun: { open: '', close: '', closed: true },
              },
            }, { merge: true });
            console.log('Vendor document created successfully');
            setVendorName(''); // Set initial vendor name after creation
            setEmail(user.email);
          }
        } catch (error) {
          console.error('Error fetching or creating vendor document:', error);
        }
      };
      
      fetchVendorDetails();
    } else {
      navigate('/signin');
    }
  }, [navigate, db, user]);

  const handleSetLocation = async (e) => {
    e.preventDefault();
    if (!isLoaded) {
      alert('Google Maps API is not yet loaded. Please wait a moment and try again.');
      return;
    }

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
        price: parseFloat(newItemPrice),  // Add price to the new item
        pricePerDozen: newItemPricePerDozen ? parseFloat(newItemPricePerDozen) : null  // Add price per dozen if set
      };
      const updatedItems = [...items, newItem];
      await setDoc(doc(db, 'vendors', user.uid), { items: updatedItems }, { merge: true });
      setItems(updatedItems);
  
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemPrice('');  // Clear price input after adding
      setNewItemPricePerDozen('');  // Clear dozen price input after adding
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
  setNewItemPrice(itemToEdit.price);  // Set the price for editing
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
    console.error('Error removing location:', error);
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
    console.error('Error removing location note:', error);
    alert('Error removing location note. Please try again.');
  }
};

return (
  <div className="dashboard-container">
    <>
      <h2>{vendorName ? `${vendorName}'s Dashboard` : 'Vendor Dashboard'}</h2>

      {/* Email Section */}
      <div className="contact-info">
        <p>Email: {email ? email : 'Not provided'}</p>
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
          value={selectedAddress || ''} // Use selectedAddress state instead of value from usePlacesAutocomplete
          onChange={(e) => {
            setValue(e.target.value);  // Update the value for usePlacesAutocomplete
            setSelectedAddress(e.target.value);  // Update your own state for the form
          }}
          placeholder="Enter Address"
          className="location-input"
          style={{ width: '400px', height: '50px', marginBottom: '10px' }}
          disabled={!isLoaded || !ready}  // Check if the API is loaded and ready
          required
        />
        <button type="submit" className="set-location-button" style={{ height: '55px' }}>Save Location</button>
        <button type="button" onClick={() => setIsEditingLocation(false)} className="cancel-button">Cancel</button>
        {status === "OK" && (
          <ul className="suggestions-list">
            {data.map(({ place_id, description }) => (
              <li key={place_id} onClick={() => {
                setValue(description, false);
                setSelectedAddress(description);  // Update selected address when user selects suggestion
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
            value={locationNote || ''}  // Ensure '' if locationNote is null or undefined
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

      <hr />
      <div style={{ textAlign: 'center' }}>
<h3>Hours of Operation</h3>
<form onSubmit={handleSaveHours} className="hours-form" style={{ display: 'inline-block' }}>
  <table className="hours-table">
    <thead>
      <tr>
        <th>Day</th>
        <th>Opens at</th>
        <th>Closes at</th>
        <th>Closed</th>
      </tr>
    </thead>
    <tbody>
      {['Mon', 'Tues', 'Weds', 'Thurs', 'Fri', 'Sat', 'Sun'].map((day) => (
        <tr key={day}>
          <td>{day}</td>
          <td>
            <input
              type="time"
              value={vendorHours[day].open || ''}
              onChange={(e) =>
                setVendorHours((prev) => ({
                  ...prev,
                  [day]: { ...prev[day], open: e.target.value },
                }))
              }
              className="hours-input"
              disabled={vendorHours[day].closed}
            />
          </td>
          <td>
            <input
              type="time"
              value={vendorHours[day].close || ''}
              onChange={(e) =>
                setVendorHours((prev) => ({
                  ...prev,
                  [day]: { ...prev[day], close: e.target.value },
                }))
              }
              className="hours-input"
              disabled={vendorHours[day].closed}
            />
          </td>
          <td>
            <input
              type="checkbox"
              checked={vendorHours[day].closed}
              onChange={(e) =>
                setVendorHours((prev) => {
                  const updatedDay = {
                    ...prev[day],
                    closed: e.target.checked,
                    open: e.target.checked ? '' : prev[day].open,
                    close: e.target.checked ? '' : prev[day].close,
                  };
                  return {
                    ...prev,
                    [day]: updatedDay,
                  };
                })
              }
              className="closed-today-checkbox"
            />
            <label style={{ marginLeft: '5px' }}>Closed {day}</label>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
  <button type="submit" className="save-hours-button" style={{ height: '39px', marginTop: '15px' }}>Save Hours</button>
</form>
</div>



      <hr />




      {/* Stock Section */}

      <h3>Current Stock</h3>
      {items.length === 0 ? (
        <p>No items added yet.</p>
      ) : (
      <ul className="stock-list">
        {items.map((item, index) => (
          <li key={index} className="stock-item">
            {item.name}: {item.quantity} units available
            {/* Conditionally render price only if it exists */}
            {item.price !== null && item.price !== undefined && !isNaN(item.price) && ` - $${item.price.toFixed(2)} each`}
            {/* Conditionally render price per dozen only if it exists */}
            {item.pricePerDozen !== null && item.pricePerDozen !== undefined && !isNaN(item.pricePerDozen) && ` - $${item.pricePerDozen.toFixed(2)} per dozen`}
            
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
            value={newItemName || ''}
            onChange={(e) => setNewItemName(e.target.value)}
            className="item-input"
            style={{ width: '150px', height: '35px', marginRight: '10px' }}
            required
          />
          <input
            type="number"
            placeholder="Quantity Available"
            value={newItemQuantity || ''}
            onChange={(e) => setNewItemQuantity(e.target.value)}
            className="item-quantity-input"
            style={{ width: '100px', height: '35px', marginRight: '10px' }}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price per item ($)"
            value={newItemPrice || ''}
            onChange={(e) => setNewItemPrice(e.target.value)}
            className="item-price-input"
            style={{ width: '100px', height: '35px', marginRight: '10px' }}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price per Dozen ($)"
            value={newItemPricePerDozen || ''}
            onChange={(e) => setNewItemPricePerDozen(e.target.value)}
            className="item-price-input"
            style={{ width: '150px', height: '35px', marginRight: '10px' }}
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
