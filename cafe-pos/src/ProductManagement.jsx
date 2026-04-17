import { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับฟอร์มเพิ่ม/แก้ไขสินค้า
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Coffee', // ค่าเริ่มต้น
    image: '',
    quantity: ''
  });
  
  const [editingId, setEditingId] = useState(null); // เอาไว้เช็คว่ากำลัง "เพิ่มใหม่" หรือ "แก้ไข"

  // 1. ดึงข้อมูลสินค้าทั้งหมดมาแสดง
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // จัดการเมื่อพิมพ์ข้อมูลในช่องต่างๆ
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. ฟังก์ชัน บันทึกข้อมูล (เป็นได้ทั้ง เพิ่มใหม่ และ แก้ไข)
  const handleSubmit = async (e) => {
    e.preventDefault(); // ป้องกันหน้าเว็บรีเฟรชตอนกด submit

    // แปลงราคาและจำนวนให้เป็นตัวเลขเสมอ
    const productDataToSave = {
      ...formData,
      price: Number(formData.price),
      quantity: Number(formData.quantity)
    };

    try {
      if (editingId) {
        // ✏️ กรณี: แก้ไขสินค้าเดิม
        await updateDoc(doc(db, "products", editingId), productDataToSave);
        alert("✅ แก้ไขข้อมูลสินค้าสำเร็จ!");
      } else {
        // ➕ กรณี: เพิ่มสินค้าใหม่
        await addDoc(collection(db, "products"), productDataToSave);
        alert("✅ เพิ่มสินค้าใหม่สำเร็จ!");
      }
      
      // ล้างฟอร์มและโหลดข้อมูลใหม่
      setFormData({ name: '', price: '', category: 'Coffee', image: '', quantity: '' });
      setEditingId(null);
      fetchProducts(); 
    } catch (error) {
      console.error("Error saving product:", error);
      alert("❌ เกิดข้อผิดพลาด");
    }
  };

  // 3. ฟังก์ชัน เตรียมข้อมูลเพื่อแก้ไข (เอากลับไปใส่ฟอร์ม)
  const handleEditClick = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image,
      quantity: product.quantity
    });
    setEditingId(product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // เลื่อนจอขึ้นไปบนสุด
  };

  // 4. ฟังก์ชัน ลบสินค้า
  const handleDelete = async (id, name) => {
    if (window.confirm(`⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบเมนู "${name}"?`)) {
      try {
        await deleteDoc(doc(db, "products", id));
        alert("🗑️ ลบสินค้าเรียบร้อยแล้ว");
        fetchProducts(); // โหลดข้อมูลใหม่
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  // ปุ่มยกเลิกการแก้ไข
  const handleCancelEdit = () => {
    setFormData({ name: '', price: '', category: 'Coffee', image: '', quantity: '' });
    setEditingId(null);
  };

  if (loading) return <div className="p-10 text-center font-bold">กำลังโหลดข้อมูลสินค้า... 📦</div>;

  return (
    <div className="p-8 h-full overflow-y-auto bg-stone-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-amber-900 mb-8">จัดการสินค้า (Product Management)</h1>

        {/* 📝 ส่วนที่ 1: ฟอร์มเพิ่ม/แก้ไขสินค้า */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-8">
          <h2 className="text-xl font-bold text-stone-800 mb-4">
            {editingId ? "✏️ แก้ไขข้อมูลสินค้า" : "➕ เพิ่มสินค้าใหม่"}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">ชื่อเมนู</label>
              <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="เช่น มัทฉะลาเต้" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">ราคา (บาท)</label>
              <input type="number" name="price" required min="0" value={formData.price} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="เช่น 65" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">หมวดหมู่</label>
              <select name="category" value={formData.category} onChange={handleInputChange} className="w-full p-2 border rounded-lg">
                <option value="Coffee">Coffee</option>
                <option value="Tea">Tea</option>
                <option value="Smoothie">Smoothie</option>
                <option value="Snack">Snack</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">สต็อกเริ่มต้น (ชิ้น/แก้ว)</label>
              <input type="number" name="quantity" required min="0" value={formData.quantity} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="เช่น 50" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-stone-600 mb-1">ลิงก์รูปภาพ (URL)</label>
              <input type="url" name="image" required value={formData.image} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="https://..." />
            </div>
            
            <div className="md:col-span-2 flex gap-2 mt-2">
              <button type="submit" className={`flex-1 py-3 rounded-lg font-bold text-white transition-colors ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {editingId ? "💾 บันทึกการแก้ไข" : "➕ เพิ่มสินค้าลงร้าน"}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="px-6 py-3 bg-stone-300 hover:bg-stone-400 text-stone-800 font-bold rounded-lg transition-colors">
                  ยกเลิก
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 📋 ส่วนที่ 2: ตารางแสดงสินค้าทั้งหมด */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-800 text-white">
                <th className="p-4">รูปภาพ</th>
                <th className="p-4">ชื่อเมนู</th>
                <th className="p-4">หมวดหมู่</th>
                <th className="p-4">ราคา</th>
                <th className="p-4">สต็อกคงเหลือ</th>
                <th className="p-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b hover:bg-stone-50">
                  <td className="p-4"><img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-md" /></td>
                  <td className="p-4 font-bold text-amber-900">{product.name}</td>
                  <td className="p-4"><span className="bg-stone-200 text-stone-700 px-2 py-1 rounded-md text-xs font-bold">{product.category}</span></td>
                  <td className="p-4 font-bold">฿{product.price}</td>
                  <td className="p-4">
                    <span className={`font-bold ${product.quantity < 10 ? 'text-red-500' : 'text-green-600'}`}>
                      {product.quantity}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button onClick={() => handleEditClick(product)} className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-bold transition-colors">แก้ไข</button>
                    <button onClick={() => handleDelete(product.id, product.name)} className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-bold transition-colors">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default ProductManagement;