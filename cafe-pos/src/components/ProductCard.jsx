// เพิ่ม { name, price, image } เข้าไปในวงเล็บ
function ProductCard({ name, price, image }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 w-64 border border-gray-100 transition-transform hover:scale-105">
      <img 
        src={image} 
        alt={name} 
        className="w-full h-40 object-cover rounded-lg mb-3"
      />
      
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-gray-800">{name}</h3>
        <span className="text-amber-600 font-bold">฿{price}</span>
      </div>
      
      <button className="w-full bg-amber-100 text-amber-700 py-2 rounded-lg font-semibold mt-2 hover:bg-amber-600 hover:text-white transition-all">
        + เลือกสินค้า
      </button>
    </div>
  );
}

export default ProductCard;