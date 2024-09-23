import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const Scanner = () => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [quantityInput, setQuantityInput] = useState(1);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

  // Function to fetch items from Firestore
  const fetchItems = async () => {
    const itemsCollection = collection(db, "items");
    const itemSnapshot = await getDocs(itemsCollection);
    const itemList = itemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setItems(itemList);
  };

  useEffect(() => {
    fetchItems(); // Fetch items when the component mounts
  }, []);

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    const item = items.find(item => item.barcode === barcodeInput);

    if (item) {
      const updatedQuantity = item.quantity - quantityInput;
      if (updatedQuantity < 0) {
        setMessage('Quantity cannot be less than zero.');
        return;
      }
      
      const itemDoc = doc(db, "items", item.id);
      await updateDoc(itemDoc, { quantity: updatedQuantity });

      if (updatedQuantity === 0) {
        await deleteItem(itemDoc);
        setMessage(`Successfully scanned and deleted item: ${item.text}.`);
      } else {
        setMessage(`Successfully scanned item: ${item.text}. Remaining quantity: ${updatedQuantity}`);
      }
    } else {
      setMessage('Item not found. Please check the barcode and try again.');
    }

    setBarcodeInput('');
    setQuantityInput(1);
    await fetchItems(); // Re-fetch items to update the list
  };

  // Function to delete item from the database
  const deleteItem = async (itemDoc) => {
    await deleteDoc(itemDoc);
  };

  return (
    <div>
      <h1>Scanner</h1>
      <form onSubmit={handleBarcodeSubmit}>
        <input
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          placeholder="Enter barcode"
          required
        />
        <input
          type="number"
          value={quantityInput}
          onChange={(e) => setQuantityInput(Number(e.target.value))}
          placeholder="Quantity"
          min="1"
          required
        />
        <button type="submit">Submit</button>
      </form>
      {message && <p>{message}</p>}
      
      <h2>All Items</h2>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.text} - Barcode: {item.barcode} - Quantity: {item.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Scanner;
