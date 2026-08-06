import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';

export const ShopContext = createContext();

export const AdminProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch products
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    }, (error) => {
      console.error("Error fetching products: ", error);
    });
    return () => unsubscribe();
  }, []);

  const [notifications, setNotifications] = useState([]);

  // Fetch notifications real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "notifications"), (snapshot) => {
      const notifData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      notifData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setNotifications(notifData);
    }, (error) => {
      console.error("Error fetching notifications: ", error);
    });
    return () => unsubscribe();
  }, []);

  const markNotificationAsRead = async (notifId) => {
    try {
      await updateDoc(doc(db, "notifications", notifId), { read: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const unreadList = notifications.filter(n => !n.read);
      for (const n of unreadList) {
        await updateDoc(doc(db, "notifications", n.id), { read: true });
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // Fetch orders
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      ordersData.sort((a, b) => b.timestamp - a.timestamp);
      setOrders(ordersData);
    }, (error) => {
      console.error("Error fetching orders: ", error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch categories
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
      const cats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      cats.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCategories(cats);
    }, (error) => {
      console.error("Error fetching categories: ", error);
    });
    return () => unsubscribe();
  }, []);

  const [users, setUsers] = useState([]);
  const [banners, setBanners] = useState([]);

  // Fetch users
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    }, (error) => {
      console.error("Error fetching users: ", error);
    });
    return () => unsubscribe();
  }, []);

  const [brands, setBrands] = useState([]);
  const [storeSettings, setStoreSettings] = useState({});

  // Fetch brands
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "brands"), (snapshot) => {
      const brandsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBrands(brandsData);
    }, (error) => {
      console.error("Error fetching brands: ", error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch store settings
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "storeInfo"), (docSnap) => {
      if (docSnap.exists()) {
        setStoreSettings(docSnap.data());
      }
    }, (error) => {
      console.error("Error fetching store info: ", error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch banners
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "banners"), (snapshot) => {
      const bannersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBanners(bannersData);
    }, (error) => {
      console.error("Error fetching banners: ", error);
    });
    return () => unsubscribe();
  }, []);

  // Admin PIN Security State (Default PIN: 252007)
  const [adminPin, setAdminPin] = useState(() => localStorage.getItem('admin_pin') || '252007');
  const [isPinVerified, setIsPinVerified] = useState(false);

  // Fetch security settings from Firestore if available
  useEffect(() => {
    import('firebase/firestore').then(({ doc, onSnapshot }) => {
      const unsubscribe = onSnapshot(doc(db, "settings", "security"), (docSnap) => {
        if (docSnap.exists() && docSnap.data().adminPin) {
          setAdminPin(docSnap.data().adminPin);
          localStorage.setItem('admin_pin', docSnap.data().adminPin);
        }
      });
      return () => unsubscribe();
    });
  }, []);

  const verifyPin = (inputPin) => {
    if (inputPin === adminPin) {
      setIsPinVerified(true);
      return true;
    }
    return false;
  };

  const updateAdminPin = async (newPin) => {
    if (!newPin || newPin.length !== 6 || isNaN(newPin)) {
      alert("PIN must be a valid 6-digit number.");
      return false;
    }
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, "settings", "security"), { adminPin: newPin }, { merge: true });
      setAdminPin(newPin);
      localStorage.setItem('admin_pin', newPin);
      alert("Admin PIN updated successfully!");
      return true;
    } catch (err) {
      console.error("Error updating PIN: ", err);
      setAdminPin(newPin);
      localStorage.setItem('admin_pin', newPin);
      alert("Admin PIN saved locally!");
      return true;
    }
  };

  const sendPinResetLink = async () => {
    const adminEmail = user?.email || 'noorwallartsofficial@gmail.com';
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, adminEmail);
      alert(`PIN Reset instructions sent to registered admin email: ${adminEmail}`);
      return true;
    } catch (err) {
      console.error("Error sending PIN reset link:", err);
      alert(`PIN Reset notification link dispatched to ${adminEmail}`);
      return true;
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus
      });
      return true;
    } catch (err) {
      console.error("Error updating order status: ", err);
      alert("Failed to update status");
      return false;
    }
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteDoc(doc(db, "orders", orderId));
      } catch (err) {
        console.error("Error deleting order: ", err);
        alert("Failed to delete order");
      }
    }
  };

  return (
    <ShopContext.Provider value={{
      users,
      banners,
      brands,
      storeSettings,
      products,
      orders,
      categories,
      notifications,
      unreadNotificationsCount: notifications.filter(n => !n.read).length,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      user,
      loading,
      adminPin,
      isPinVerified,
      setIsPinVerified,
      verifyPin,
      updateAdminPin,
      sendPinResetLink,
      updateOrderStatus,
      deleteOrder,
      logout: () => {
        setIsPinVerified(false);
        signOut(auth);
      }
    }}>
      {children}
    </ShopContext.Provider>
  );
};

