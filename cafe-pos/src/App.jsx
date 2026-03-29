import ProductCard from './components/ProductCard'

function App() {
  return (
    <div className="min-h-screen bg-stone-100 p-10">
      <h1 className="text-3xl font-bold text-amber-800 mb-8">☕ เมนูแนะนำ</h1>
      
      {/* เรียกใช้งาน Component การ์ดสินค้าที่เราเพิ่งสร้าง */}
      <div className="flex gap-4 flex-wrap">
        <ProductCard />
        <ProductCard />
        <ProductCard />
      </div>

    </div>
  )
}

export default App