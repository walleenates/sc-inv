import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebase/firebase-config'; 
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import JsBarcode from 'jsbarcode';
import Camera from '../components/Camera'; 
import './ManageItem.css';

const colleges = ["CCS", "COC", "CED", "CBA", "BED", "COE"];
const itemTypes = ["Equipment", "Office Supplies", "Books", "Electrical Parts"];

const Barcode = ({ value }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 50,
        displayValue: true,
      });
    }
  }, [value]);

  return <svg ref={svgRef}></svg>;
};

const ManageItem = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [amount, setAmount] = useState(0);
  const [requestedDate, setRequestedDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [itemType, setItemType] = useState("Equipment");
  const [editItem, setEditItem] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);
  const [editAmount, setEditAmount] = useState(0);
  const [editRequestedDate, setEditRequestedDate] = useState("");
  const [editSupplier, setEditSupplier] = useState("");
  const [editItemType, setEditItemType] = useState("Equipment");
  const [imagePreview, setImagePreview] = useState(null); 
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [visibleColleges, setVisibleColleges] = useState({});
  const [saveOption, setSaveOption] = useState('local'); 

  useEffect(() => {
    const itemsCollection = collection(db, "items");
    const unsubscribe = onSnapshot(itemsCollection, (snapshot) => {
      const fetchedItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(fetchedItems);
    });

    return () => unsubscribe();
  }, []);

  const generateBarcode = () => {
    return `ITEM-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAddItem = async () => {
    if (
      newItem.trim() &&
      selectedCollege &&
      quantity > 0 &&
      amount >= 0 &&
      requestedDate &&
      supplier &&
      itemType
    ) {
      const newBarcode = generateBarcode();
      try {
        await addDoc(collection(db, "items"), {
          text: newItem.trim(),
          college: selectedCollege,
          quantity,
          amount,
          requestedDate: new Date(requestedDate),
          supplier,
          itemType,
          barcode: newBarcode,
          image: imagePreview, 
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        setNewItem("");
        setSelectedCollege("");
        setQuantity(1);
        setAmount("");
        setRequestedDate("");
        setSupplier("");
        setItemType("Equipment");
        setImagePreview(null); 
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    }
  };

  const handleEditItem = (item) => {
    setEditItem(item);
    setEditValue(item.text);
    setEditCollege(item.college);
    setEditQuantity(item.quantity);
    setEditAmount(item.amount);
    setEditRequestedDate(item.requestedDate.toDate().toISOString().substr(0, 10));
    setEditSupplier(item.supplier);
    setEditItemType(item.itemType);
    setImagePreview(item.image);
  };

  const handleSaveEdit = async () => {
    if (
      editItem &&
      editValue.trim() &&
      editCollege &&
      editQuantity > 0 &&
      editAmount >= 0 &&
      editRequestedDate &&
      editSupplier &&
      editItemType
    ) {
      try {
        const itemDoc = doc(db, "items", editItem.id);
        await updateDoc(itemDoc, {
          text: editValue.trim(),
          college: editCollege,
          quantity: editQuantity,
          amount: editAmount,
          requestedDate: new Date(editRequestedDate),
          supplier: editSupplier,
          itemType: editItemType,
          image: imagePreview, 
          updatedAt: Timestamp.now(),
        });
        setEditItem(null);
        setEditValue("");
        setEditCollege("");
        setEditQuantity(1);
        setEditAmount(0);
        setEditRequestedDate("");
        setEditSupplier("");
        setEditItemType("Equipment");
        setImagePreview(null);
      } catch (error) {
        console.error("Error updating document: ", error);
      }
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const itemDoc = doc(db, "items", id);
      await deleteDoc(itemDoc);
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const toggleFolderVisibility = (college) => {
    setVisibleColleges((prevState) => ({
      ...prevState,
      [college]: !prevState[college],
    }));
  };

  // Group items by college and calculate the total quantity of items per college
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.college]) {
      acc[item.college] = {
        items: [],
        totalQuantity: 0,
      };
    }
    acc[item.college].items.push(item);
    acc[item.college].totalQuantity += item.quantity; // Summing the quantity
    return acc;
  }, {});

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const storageRef = ref(storage, `images/${file.name}`); 
      try {
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        setImagePreview(downloadURL); // Set preview URL
        console.log("Uploaded a file and got URL:", downloadURL);
      } catch (error) {
        console.error("Error uploading file: ", error);
      }
    }
  };

  const handleSaveOptionChange = (e) => {
    setSaveOption(e.target.value);
  };

  const handleCameraCapture = async (imageUrl) => {
    if (saveOption === 'local') {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'captured-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert("Image download initiated. The file will be saved to your default downloads folder.");
    } else if (saveOption === 'system') {
      const fileName = `captured-image-${Date.now()}.png`;
      const storageRef = ref(storage, `images/${fileName}`);
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        setImagePreview(downloadURL); // Set preview URL
        console.log("Uploaded a file and got URL:", downloadURL);
      } catch (error) {
        console.error("Error uploading file: ", error);
      }
    } else {
      alert("Invalid option. Please choose 'local' or 'system'.");
    }
    setIsCameraOpen(false);
  };

  return (
    <div className="manage-item-container">
      <h1>Manage Items</h1>
      <div className="add-item">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add new item"
        />
        <select
          value={selectedCollege}
          onChange={(e) => setSelectedCollege(e.target.value)}
        >
          <option value="">Select College</option>
          {colleges.map((college) => (
            <option key={college} value={college}>
              {college}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={quantity}
          min="1"
          onChange={(e) => setQuantity(parseInt(e.target.value))}
        />
        <input
          type="number"
          value={amount}
          min="0"
          onChange={(e) => setAmount(parseFloat(e.target.value))}
        />
        <input
          type="date"
          value={requestedDate}
          onChange={(e) => setRequestedDate(e.target.value)}
        />
        <input
          type="text"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Supplier"
        />
        <select
          value={itemType}
          onChange={(e) => setItemType(e.target.value)}
        >
          {itemTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input type="file" onChange={handleImageUpload} />
        <button onClick={handleAddItem}>Add Item</button>
      </div>

      {/* Display grouped items by college */}
      {Object.entries(groupedItems).map(([college, { items: collegeItems, totalQuantity }]) => (
        <div key={college}>
          <h2 onClick={() => toggleFolderVisibility(college)}>
            {college} - Total Quantity: {totalQuantity}
          </h2>
          {visibleColleges[college] && (
            <ul>
              {collegeItems.map((item) => (
                <li key={item.id}>
                  {item.text} - Quantity: {item.quantity} - Amount: ${item.amount}
                  <br />
                  Supplier: {item.supplier}, Type: {item.itemType}
                  <br />
                  Requested Date: {item.requestedDate.toDate().toLocaleDateString()}
                  <br />
                  {item.image && <img src={item.image} alt="Item" width="100" />}
                  <button onClick={() => handleEditItem(item)}>Edit</button>
                  <button onClick={() => handleDeleteItem(item.id)}>Delete</button>
                  <Barcode value={item.barcode} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {editItem && (
        <div className="edit-item">
          <h2>Edit Item</h2>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
          <select
            value={editCollege}
            onChange={(e) => setEditCollege(e.target.value)}
          >
            <option value="">Select College</option>
            {colleges.map((college) => (
              <option key={college} value={college}>
                {college}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={editQuantity}
            min="1"
            onChange={(e) => setEditQuantity(parseInt(e.target.value))}
          />
          <input
            type="number"
            value={editAmount}
            min="0"
            onChange={(e) => setEditAmount(parseFloat(e.target.value))}
          />
          <input
            type="date"
            value={editRequestedDate}
            onChange={(e) => setEditRequestedDate(e.target.value)}
          />
          <input
            type="text"
            value={editSupplier}
            onChange={(e) => setEditSupplier(e.target.value)}
            placeholder="Supplier"
          />
          <select
            value={editItemType}
            onChange={(e) => setEditItemType(e.target.value)}
          >
            {itemTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input type="file" onChange={handleImageUpload} />
          <button onClick={handleSaveEdit}>Save Changes</button>
        </div>
      )}

      {isCameraOpen && (
        <Camera onCapture={handleCameraCapture} onClose={() => setIsCameraOpen(false)} />
      )}
      <div className="camera-save-option">
        <label>Save to:</label>
        <select value={saveOption} onChange={handleSaveOptionChange}>
          <option value="local">Local</option>
          <option value="system">System</option>
        </select>
        <button onClick={() => setIsCameraOpen(true)}>Open Camera</button>
      </div>

      {imagePreview && (
        <div className="image-preview">
          <h3>Image Preview:</h3>
          <img src={imagePreview} alt="Preview" width="200" />
        </div>
      )}
    </div>
  );
};

export default ManageItem;
