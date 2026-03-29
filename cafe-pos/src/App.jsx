import { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, getDocs } from 'firebase/firestore';
import ProductCard from './components/ProductCard';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- ส่วนที่เพิ่มใหม่: State สำหรับการค้นหาและกรอง ---
  const [searchTerm, setSearchTerm] = useState(""); // เก็บคำค้นหา
  const [selectedCategory, setSelectedCategory] = useState("All"); // เก็บหมวดหมู่ที่เลือก

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- ส่วนที่เพิ่มใหม่: Logic การกรองข้อมูล ---
  const filteredProducts = products.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="p-10 text-center text-amber-900 font-bold text-xl">กำลังชงกาแฟรอสักครู่... ☕</div>;

  return (
    <div className="min-h-screen bg-stone-100 p-8">
      <header className="mb-8 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-amber-900 mb-6">Cafe POS Menu</h1>
        
        {/* ส่วนของช่องค้นหาและปุ่มหมวดหมู่ */}
        <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <input 
            type="text" 
            placeholder="🔍 ค้นหาเมนูที่ต้องการ..." 
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="flex gap-2 justify-center flex-wrap">
            {["All", "Coffee", "Tea", "Smoothie", "Snack"].map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  selectedCategory === cat 
                  ? "bg-amber-700 text-white shadow-md" 
                  : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                }`}
              >
                {cat === "All" ? "ทั้งหมด" : cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* แสดงผลการ์ดตามข้อมูลที่กรองแล้ว */}
      <div className="flex flex-wrap gap-6 justify-center max-w-6xl mx-auto">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((item) => (
            <ProductCard 
              key={item.id} 
              name={item.name} 
              price={item.price} 
              image={item.image} 
            />
          ))
        ) : (
          <div className="text-stone-400 mt-10 italic">ไม่พบเมนูที่คุณกำลังค้นหา...</div>
        )}
      </div>
    </div>
  );
}

export default App;