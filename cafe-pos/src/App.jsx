import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// นำเข้าหน้าต่างๆ ที่เราสร้างไว้
import Login from './Login';
import POS from './POS';
import Dashboard from './Dashboard';
import ProductManagement from './ProductManagement';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // เช็คสถานะ Login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) return <div className="p-10 text-center font-sans">กำลังสตาร์ทระบบ... ☕</div>;

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      {/* 🌟 ปรับปรุง: เพิ่ม print:h-auto และ print:overflow-visible เพื่อให้กระดาษพิมพ์ยาวได้ตามต้องการ */}
      <div className="h-screen bg-stone-100 flex flex-col font-sans overflow-hidden print:h-auto print:overflow-visible print:bg-white">
        
        {/* Navbar โดนซ่อนตอนพิมพ์ (ถูกต้องแล้ว) */}
        <nav className="print:hidden bg-amber-950 text-white p-4 shadow-md flex justify-between items-center z-10">
          <div className="flex gap-8 items-center pl-4">
            <span className="font-black text-xl tracking-wider text-amber-400">☕ CAFE POS</span>
            <Link to="/" className="font-semibold hover:text-amber-300 transition-colors">หน้าร้าน (POS)</Link>
            <Link to="/dashboard" className="font-semibold hover:text-amber-300 transition-colors">หลังบ้าน (Dashboard)</Link>
            <Link to="/products" className="font-semibold hover:text-amber-300 transition-colors">จัดการสินค้า</Link>
          </div>
          <div className="flex items-center gap-4 pr-4">
            <span className="text-sm text-amber-200">พนักงาน: {user.email}</span>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
            >
              ออกจากระบบ
            </button>
          </div>
        </nav>

        {/* 🛑 เอา print:hidden ออกจากบรรทัดนี้แล้วครับ! ใบเสร็จเราจะได้โผล่มา */}
        <main className="flex-1 overflow-hidden relative print:overflow-visible print:h-auto">
          <Routes>
            <Route path="/" element={<POS />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}

export default App;