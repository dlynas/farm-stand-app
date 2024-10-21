import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Import useParams to get the vendorId from the URL
import QRCode from 'qrcode';
import './GenerateQrCode.css';

function GenerateQrCode() {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const { vendorId } = useParams(); // Get vendorId from URL parameters

  useEffect(() => {
    if (vendorId) {
      console.log('Generating QR code for vendorId:', vendorId);
      const hostname = window.location.origin;
      const vendorUrl = `${hostname}/adjuststock/${vendorId}`;

      // Generate QR code using the vendor URL
      QRCode.toDataURL(vendorUrl, { width: 500 }) // Increase the width to make the QR code larger
        .then((url) => {
          console.log('QR code generated successfully:', url);
          setQrCodeUrl(url);
        })
        .catch((error) => {
          console.error('Error generating QR code:', error);
        });
    }
  }, [vendorId]);

  return (
    <div className="generate-qrcode-container">
      <h2>QR Code for Vendor Page</h2>
      {qrCodeUrl ? (
        <div className="qr-code-display">
          <img src={qrCodeUrl} alt="Vendor QR Code" style={{ width: '500px', height: '500px' }} />
          <p>Scan this QR code or print it out to share the vendor page.</p>
        </div>
      ) : (
        <p>Generating QR code...</p>
      )}
    </div>
  );
}

export default GenerateQrCode;
