import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';

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
        status: "Accepted",
        paymentStatus: "PAID"
      });
      alert("Order Accepted successfully!");
    } catch (err) {
      console.error("Error accepting order: ", err);
      alert("Failed to accept order");
    }
  };

  const rejectOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to REJECT this order? The customer will see it as rejected.")) {
      try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
          status: "Rejected",
          paymentStatus: "FAILED"
        });
        alert("Order Rejected successfully!");
      } catch (err) {
        console.error("Error rejecting order: ", err);
        alert("Failed to reject order");
      }
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
      products,
      orders,
      user,
      loading,
      acceptOrder,
      rejectOrder,
      deleteOrder,
      logout: () => signOut(auth)
    }}>
      {children}
    </ShopContext.Provider>
  );
};
