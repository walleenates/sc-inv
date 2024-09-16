import React, { useState } from 'react';
import { BarcodeScannerComponent } from 'react-qr-barcode-scanner';
import { db } from '../firebase/firebase-config';  // Correct path


const Scanner = () => {
  const [data, setData] = useState('');

  const handleScan = async (barcodeData) => {
    if (barcodeData) {
      setData(barcodeData);
      // Delete item from Firestore based on scanned barcode
      const itemRef = db.collection('items').doc(barcodeData);
      const itemSnapshot = await itemRef.get();
      if (itemSnapshot.exists) {
        await itemRef.delete();
        console.log(`Item with barcode ${barcodeData} deleted.`);
      } else {
        console.log("Item not found!");
      }
    }
  };

  return (
    <div>
      <h3>Scan an item</h3>
      <BarcodeScannerComponent
        width={500}
        height={500}
        onUpdate={(err, result) => {
          if (result) handleScan(result.text);
        }}
      />
      <p>Scanned: {data}</p>
    </div>
  );
};

export default Scanner;
