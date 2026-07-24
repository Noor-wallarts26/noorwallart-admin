import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';

export const ShopContext = createContext();

export const AdminProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
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

  // Fetch products from Firestore
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

  // Fetch orders from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by timestamp descending (newest first)
      ordersData.sort((a, b) => b.timestamp - a.timestamp);
      setOrders(ordersData);
    }, (error) => {
      console.error("Error fetching orders: ", error);
    });
    return () => unsubscribe();
  }, []);

  const acceptOrder = async (orderId) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "Accepted"
      });
      alert("Order Accepted successfully!");
    } catch (err) {
      console.error("Error accepting order: ", err);
      alert("Failed to accept order");
    }
  };

  return (
    <ShopContext.Provider value={{
      products,
      orders,
      user,
      loading,
      acceptOrder,
      logout: () => signOut(auth)
    }}>
      {children}
    </ShopContext.Provider>
  );
};
