import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBE3Xg8m_rJOPmBPhml7se7JOu-vCqUZPw",
  authDomain: "amezeshop.firebaseapp.com",
  projectId: "amezeshop",
  storageBucket: "amezeshop.firebasestorage.app",
  messagingSenderId: "726965398711",
  appId: "1:726965398711:web:5c03826a8f01c94c75f132",
  measurementId: "G-64N7J151K4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addDummyBanner() {
  try {
    const banners = await getDocs(collection(db, "banners"));
    
    // Always add a banner to prove it works
    const newBanner = {
      title: "Welcome to Noor Wallarts",
      description: "Discover our amazing collection of custom frames, resin arts, and acrylic works.",
      imageURL: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2070",
      category: "All",
      isActive: true,
      showOnHomepage: true,
      enableAutoSlider: true,
      link: "",
      order: banners.docs.length + 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await addDoc(collection(db, "banners"), newBanner);
    console.log("Successfully added dummy banner!");
    
    // Output current banners count
    const updatedBanners = await getDocs(collection(db, "banners"));
    console.log("Total banners in database:", updatedBanners.docs.length);
    process.exit(0);
  } catch (err) {
    console.error("Error adding banner:", err);
    process.exit(1);
  }
}

addDummyBanner();
