import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase-config';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db } from '../firebase/firebase-config';
import './Dashboard.css';

const DashboardPage = () => {
  const [totalItems, setTotalItems] = useState(0);
  const [collegeItemCounts, setCollegeItemCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [approvedRequestsCount, setApprovedRequestsCount] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const navigate = useNavigate();
  const userName = "Admin";

  useEffect(() => {
    const itemsCollection = collection(db, 'items');
    const unsubscribeItems = onSnapshot(itemsCollection, (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data());
      setTotalItems(items.length);

      const collegeMap = items.reduce((acc, item) => {
        if (item.college) {
          acc[item.college] = (acc[item.college] || 0) + 1;
        }
        return acc;
      }, {});

      setCollegeItemCounts(collegeMap);

      // Find low stock items
      const lowStock = items.filter(item => item.quantity <= 10); // Using a hardcoded limit for now
      setLowStockItems(lowStock);
    });

    const requestsCollection = collection(db, 'requests');
    const approvedRequestsQuery = query(requestsCollection, where('approved', '==', true));
    const unsubscribeRequests = onSnapshot(approvedRequestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => doc.data());
      const collegeMap = requests.reduce((acc, request) => {
        if (request.college) {
          acc[request.college] = (acc[request.college] || 0) + request.itemCount;
        }
        return acc;
      }, {});

      setApprovedRequestsCount(collegeMap);
    });

    return () => {
      unsubscribeItems();
      unsubscribeRequests();
    };
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const handleCollegeClick = (college) => {
    setSelectedCollege(college === selectedCollege ? null : college);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/sign-in');
    } catch (error) {
      console.error('Error logging out: ', error);
    }
  };

  const handleLowStockClick = (itemId) => {
    navigate('/manage-item');
  };

  const filteredColleges = Object.keys(collegeItemCounts).filter(college =>
    college.toLowerCase().includes(searchTerm)
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <div className="search-and-profile">
          <input
            type="text"
            placeholder="Search colleges..."
            className="search-input"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <div className="profile">
            <img src="userdashboard.png" alt="Profile Icon" className="profile-icon" />
            <span className="user-name">{userName}</span>
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              &#9662;
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <Link to="/account-settings">Account Settings</Link>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
          <div className="notification-bell" onClick={toggleDropdown}>
            🛎️
            {lowStockItems.length > 0 && <span className="notification-count">{lowStockItems.length}</span>}
          </div>
          {dropdownOpen && (
            <div className="dropdown-menu">
              <h3>Low Stock Items</h3>
              {lowStockItems.length > 0 ? (
                lowStockItems.map(item => (
                  <div key={item.id} className="low-stock-item" onClick={() => handleLowStockClick(item.id)}>
                    <p>{item.text} - Quantity: {item.quantity}</p>
                  </div>
                ))
              ) : (
                <p>No low stock items</p>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="dashboard-content">
        <section className="cards">
          <div className="card item-card">
            <h3>ITEMS</h3>
            <p>Total Items: {totalItems}</p>
          </div>
          <div className="card folder-card">
            <h3>FOLDER</h3>
            <div className="folder-list">
              {filteredColleges.length > 0 ? (
                filteredColleges.map((college) => (
                  <div key={college} className="folder">
                    <h4 onClick={() => handleCollegeClick(college)}>
                      {college}
                    </h4>
                    {selectedCollege === college && (
                      <ul className="item-list">
                        {Object.entries(collegeItemCounts).map(([key, count]) => (
                          key === college && (
                            <li key={key}>Items: {count}</li>
                          )
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <p>No folders to display</p>
              )}
            </div>
          </div>
          <div className="card approve-request-card">
            <h3>APPROVE PURCHASE REQUEST</h3>
            <p>Total Requested Items: {Object.values(approvedRequestsCount).reduce((a, b) => a + b, 0)}</p>
            {Object.entries(approvedRequestsCount).map(([college, count]) => (
              <p key={college}>{college}: {count} items</p>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
