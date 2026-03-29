function ProductCard() {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden w-64 border border-gray-100">
      {/* รูปภาพสินค้า (ใช้รูปจำลองไปก่อน) */}
      <img 
        src="https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=500&q=80" 
        alt="Americano" 
        className="w-full h-48 object-cover"
      />
      
      {/* รายละเอียดสินค้า */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-800">Iced Americano</h3>
          <span className="text-amber-600 font-bold">฿55</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">อเมริกาโน่เย็น หอมเข้ม สดชื่น</p>
        
        {/* ปุ่มเพิ่มลงตะกร้า */}
        <button className="w-full bg-amber-100 text-amber-700 font-semibold py-2 rounded-lg hover:bg-amber-600 hover:text-white transition-colors duration-200">
          + เพิ่มลงตะกร้า
        </button>
      </div>
    </div>
  );
}

export default ProductCard;