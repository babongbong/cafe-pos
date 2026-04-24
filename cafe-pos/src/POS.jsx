import { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, onSnapshot, query, addDoc, doc, updateDoc, increment } from 'firebase/firestore'; 
import ProductCard from './components/ProductCard';

import generatePayload from 'promptpay-qr';
import { QRCodeSVG } from 'qrcode.react';

function POS() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState([]);

  // 🎟️ State สำหรับระบบ Promo Code
  const [discount, setDiscount] = useState(0); 
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false); 
  const [paymentMethod, setPaymentMethod] = useState('cash'); 
  const [receiveAmount, setReceiveAmount] = useState(''); 
  const [receiptData, setReceiptData] = useState(null);

  const PROMPTPAY_ID = "0812345678"; 

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🛡️ เช็คสต็อกก่อนกดใส่ตะกร้า
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    const currentQtyInCart = existingItem ? existingItem.qty : 0;

    if (currentQtyInCart >= product.quantity) {
      // ถ้าของในตะกร้า >= สต็อกจริง ให้หยุดทำงานทันที (กันกดเบิ้ลรัวๆ)
      return; 
    }

    if (existingItem) setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    else setCart([...cart, { ...product, qty: 1 }]);
  };

  const removeFromCart = (productId) => setCart(cart.filter(item => item.id !== productId));
  
  // 🎟️ ฟังก์ชันเช็คโค้ดส่วนลด (แก้ชื่อโค้ดและ % ส่วนลดตรงนี้ได้เลย)
  const applyPromoCode = () => {
    const code = promoCode.toUpperCase().trim(); // แปลงเป็นพิมพ์ใหญ่ตัดช่องว่าง
    if (!code) {
      setDiscount(0);
      setPromoMessage("");
      return;
    }

    if (code === "COFFEE10") { setDiscount(10); setPromoMessage("✅ ใช้โค้ดสำเร็จ: ลด 10%"); }
    else if (code === "VIP20") { setDiscount(20); setPromoMessage("✅ ใช้โค้ดสำเร็จ: ลด 20%"); }
    else if (code === "STAFF50") { setDiscount(50); setPromoMessage("✅ ใช้โค้ดสำเร็จ: ลด 50%"); }
    else { setDiscount(0); setPromoMessage("❌ โค้ดไม่ถูกต้องหรือหมดอายุ"); }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmount = subtotal * (discount / 100);
  const netTotal = subtotal - discountAmount;
  const changeAmount = Number(receiveAmount) - netTotal;

  const qrPayload = generatePayload(PROMPTPAY_ID, { amount: netTotal });

  const confirmCheckout = async () => {
    try {
      const now = new Date();
      const localDate = now.toLocaleDateString('sv-SE'); 
      const dateStringForId = localDate.replace(/-/g, ''); 
      
      const randomNum = Math.floor(1000 + Math.random() * 9000); 
      const newBillId = `INV-${dateStringForId}-${randomNum}`;

      const orderData = {
        billId: newBillId,
        date: localDate, 
        items: cart.map(item => `${item.name} (x${item.qty})`), 
        cartDetails: [...cart], 
        subtotal: subtotal,
        discountPercent: discount,
        discountAmount: discountAmount,
        netTotal: netTotal, 
        paymentMethod: paymentMethod, 
        receiveAmount: paymentMethod === 'cash' ? Number(receiveAmount) : netTotal,
        changeAmount: paymentMethod === 'cash' ? changeAmount : 0,
        status: "Completed",
        timestamp: now 
      };

      await addDoc(collection(db, "orders"), orderData);

      for (const item of cart) {
        const productRef = doc(db, "products", item.id);
        await updateDoc(productRef, { quantity: increment(-item.qty) });
      }

      setReceiptData(orderData); 
      setIsCheckoutOpen(false);  
      setCart([]);               
      setDiscount(0);
      setPromoCode(""); // ล้างช่องโค้ด
      setPromoMessage(""); 
      setReceiveAmount('');
      setPaymentMethod('cash');

    } catch (error) {
      console.error("Error saving order:", error);
      alert("❌ เกิดข้อผิดพลาดในการชำระเงิน");
    }
  };

  const filteredProducts = products.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="p-10 text-center font-bold text-amber-900 text-xl">กำลังเชื่อมต่อข้อมูลร้าน... ☕</div>;

  return (
    <>
      <div className="print:hidden flex h-full bg-stone-100 font-sans overflow-hidden relative">
        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
          <header className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-amber-900">หน้าร้าน (POS)</h1>
            <input type="text" placeholder="🔍 ค้นหาเมนู..." className="px-4 py-2 rounded-xl border border-stone-200" onChange={(e) => setSearchTerm(e.target.value)} />
          </header>

          <div className="flex gap-2 mb-6 border-b border-stone-200 pb-4 overflow-x-auto">
            {["All", "Coffee", "Tea", "Smoothie", "Snack"].map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full font-semibold ${selectedCategory === cat ? "bg-amber-700 text-white shadow-md" : "bg-white text-stone-600"}`}>
                {cat === "All" ? "ทั้งหมด" : cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            {filteredProducts.map((item) => {
              // 🧮 คำนวณสต็อกคงเหลือ (ลบกับของที่กดลงตะกร้าไปแล้วด้วย)
              const cartItem = cart.find(c => c.id === item.id);
              const cartQty = cartItem ? cartItem.qty : 0;
              const remainingStock = item.quantity - cartQty;
              const isOutOfStock = remainingStock <= 0;

              return (
                <div 
                  key={item.id} 
                  className={`relative group ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 transition-transform'}`} 
                  onClick={() => !isOutOfStock && addToCart(item)}
                >
                  <ProductCard name={item.name} price={item.price} image={item.image} />
                  
                  {/* ป้ายแสดงจำนวน */}
                  <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-md text-white shadow-sm ${isOutOfStock ? 'bg-red-600' : remainingStock < 10 ? 'bg-orange-500' : 'bg-stone-800'}`}>
                    {isOutOfStock ? 'สินค้าหมด' : `เหลือ ${remainingStock}`}
                  </div>

                  {/* 🚫 UI สินค้าหมดคาดทับ */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center rounded-2xl z-10">
                      <span className="bg-red-600 text-white font-black px-4 py-2 rounded-lg rotate-[-12deg] border-2 border-white text-xl shadow-lg uppercase tracking-wider">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="w-[400px] bg-white shadow-xl flex flex-col border-l border-stone-200">
          <div className="p-6 border-b border-stone-100 bg-amber-50">
            <h2 className="text-2xl font-bold text-amber-900">รายการสั่งซื้อ</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border">
                <div><h4 className="font-bold">{item.name}</h4><p className="text-sm text-stone-500">฿{item.price} x {item.qty}</p></div>
                <div className="flex items-center gap-3"><span className="font-bold text-amber-700">฿{item.price * item.qty}</span><button onClick={() => removeFromCart(item.id)} className="text-red-400 font-bold p-1 hover:bg-red-50 rounded-full w-8 h-8 flex justify-center items-center">✕</button></div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-stone-200 bg-stone-50 space-y-4">
            
            {/* 🎟️ ส่วนใส่โค้ดโปรโมชั่นแบบใหม่ */}
            <div>
              <p className="text-sm font-bold text-stone-500 mb-2">โค้ดส่วนลด (Promo Code)</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={promoCode} 
                  onChange={(e) => setPromoCode(e.target.value)} 
                  placeholder="เช่น COFFEE10" 
                  className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:border-amber-500 font-bold uppercase"
                />
                <button 
                  onClick={applyPromoCode} 
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-lg transition-colors"
                >
                  ใช้โค้ด
                </button>
              </div>
              {promoMessage && (
                <p className={`text-xs mt-2 font-bold ${discount > 0 ? "text-green-600" : "text-red-500"}`}>
                  {promoMessage}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-stone-500"><span>ยอดรวม</span><span>฿{subtotal}</span></div>
              {discount > 0 && <div className="flex justify-between text-red-500 font-bold"><span>ส่วนลด ({discount}%)</span><span>-฿{discountAmount}</span></div>}
              <div className="flex justify-between text-lg font-black text-amber-900 pt-2 border-t border-stone-200"><span>ยอดสุทธิ</span><span>฿{netTotal}</span></div>
            </div>
            <button onClick={() => setIsCheckoutOpen(true)} disabled={cart.length === 0} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg text-lg transition-all ${cart.length > 0 ? "bg-amber-600 hover:bg-amber-700 active:scale-95" : "bg-stone-300"}`}>
              ชำระเงิน ฿{netTotal}
            </button>
          </div>
        </aside>

        {isCheckoutOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-[500px]">
              <h2 className="text-3xl font-black text-amber-900 mb-6 border-b pb-4">ขั้นตอนการชำระเงิน</h2>
              
              <div className="mb-6">
                <p className="text-sm font-bold text-stone-500 mb-3">เลือกวิธีชำระเงิน</p>
                <div className="flex gap-4">
                  <button onClick={() => setPaymentMethod('cash')} className={`flex-1 py-4 rounded-xl font-bold text-lg border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'cash' ? "border-amber-600 bg-amber-50 text-amber-900" : "border-stone-200 text-stone-400"}`}>
                    <span className="text-3xl">💵</span> เงินสด
                  </button>
                  <button onClick={() => setPaymentMethod('transfer')} className={`flex-1 py-4 rounded-xl font-bold text-lg border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'transfer' ? "border-blue-600 bg-blue-50 text-blue-900" : "border-stone-200 text-stone-400"}`}>
                    <span className="text-3xl">📱</span> สแกนจ่าย
                  </button>
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div className="bg-stone-50 p-6 rounded-2xl mb-6 border border-stone-200 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-500 mb-2">รับเงินมา (บาท)</label>
                    <input type="number" min={netTotal} value={receiveAmount} onChange={(e) => setReceiveAmount(e.target.value)} placeholder={`ยอดสุทธิ ${netTotal} บาท`} className="w-full text-2xl font-bold p-4 border-2 border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white" autoFocus />
                  </div>
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-200">
                    <span className="font-bold text-stone-600">เงินทอน</span>
                    <span className={`text-3xl font-black ${changeAmount >= 0 ? "text-green-600" : "text-red-500"}`}>
                      ฿{receiveAmount ? (changeAmount >= 0 ? changeAmount : 0) : 0}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <div className="bg-blue-50 p-6 rounded-2xl mb-6 flex flex-col items-center justify-center text-center border border-blue-100">
                  <p className="text-blue-800 font-bold mb-4">สแกน QR Code เพื่อชำระเงิน</p>
                  
                  <div className="bg-white p-4 rounded-xl shadow-md border border-blue-200 mb-4">
                    <QRCodeSVG value={qrPayload} size={200} />
                  </div>
                  
                  <p className="text-3xl font-black text-blue-900">ยอดชำระ: ฿{netTotal}</p>
                  <p className="text-sm text-blue-600 mt-2">PromptPay: {PROMPTPAY_ID}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={confirmCheckout} 
                  disabled={paymentMethod === 'cash' && (changeAmount < 0 || !receiveAmount)}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white py-4 rounded-xl font-bold text-lg transition-colors"
                >
                  ยืนยันรับเงิน {paymentMethod === 'transfer' && " (ลูกค้าโอนแล้ว)"}
                </button>
                <button onClick={() => setIsCheckoutOpen(false)} className="px-6 py-4 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-bold text-lg">
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popup ใบเสร็จ */}
        {receiptData && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-[400px] flex flex-col max-h-[90vh]">
              <div id="receipt-print-area" className="flex-1 overflow-y-auto pb-6 border-b border-dashed border-gray-300">
                <div className="text-center mb-6"><h2 className="text-2xl font-black text-black">☕ CAFE POS</h2><p className="text-sm text-gray-500 mt-1">ใบเสร็จรับเงิน</p></div>
                <div className="text-sm text-gray-600 mb-4 space-y-1"><p>เลขที่: <span className="font-mono text-black">{receiptData.billId}</span></p><p>วันที่: {new Date(receiptData.timestamp).toLocaleString('th-TH')}</p></div>
                <table className="w-full text-sm mb-4"><thead className="border-y border-gray-200"><tr><th className="py-2 text-left">รายการ</th><th className="py-2 text-center">จน.</th><th className="py-2 text-right">ราคา</th></tr></thead>
                  <tbody className="border-b border-gray-200">
                    {receiptData.cartDetails.map((item, idx) => (
                      <tr key={idx}><td className="py-2 text-left">{item.name}</td><td className="py-2 text-center">{item.qty}</td><td className="py-2 text-right">{(item.price * item.qty).toLocaleString()}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between"><span>ยอดรวม:</span><span>฿{receiptData.subtotal.toLocaleString()}</span></div>
                  {receiptData.discountAmount > 0 && <div className="flex justify-between text-black"><span>ส่วนลด ({receiptData.discountPercent}%):</span><span>-฿{receiptData.discountAmount.toLocaleString()}</span></div>}
                  <div className="flex justify-between text-lg font-bold text-black pt-2 border-t border-gray-200"><span>ยอดสุทธิ:</span><span>฿{receiptData.netTotal.toLocaleString()}</span></div>
                </div>
                <div className="mt-4 pt-4 border-t border-dashed border-gray-300 space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between"><span>วิธีชำระเงิน:</span><span>{receiptData.paymentMethod === 'cash' ? 'เงินสด' : 'เงินโอน'}</span></div>
                  {receiptData.paymentMethod === 'cash' && (
                    <>
                      <div className="flex justify-between"><span>รับเงินมา:</span><span>฿{receiptData.receiveAmount.toLocaleString()}</span></div>
                      <div className="flex justify-between font-bold text-black"><span>เงินทอน:</span><span>฿{receiptData.changeAmount.toLocaleString()}</span></div>
                    </>
                  )}
                </div>
                <div className="text-center mt-8 text-xs text-gray-500"><p>ขอบคุณที่ใช้บริการ</p></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => window.print()} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold flex justify-center gap-2">🖨️ พิมพ์ใบเสร็จ</button>
                <button onClick={() => setReceiptData(null)} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold">ปิด</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🌟 กระดาษพิมพ์ (จะโชว์เฉพาะตอนกด Ctrl+P) */}
      {receiptData && (
        <div className="hidden print:block text-black p-4 bg-white font-sans w-[80mm] mx-auto">
          <div className="text-center mb-4"><h2 className="text-xl font-black">☕ CAFE POS</h2><p className="text-xs mt-1">ใบเสร็จรับเงิน</p></div>
          <p className="text-xs mb-1">บิล: {receiptData.billId}</p><p className="text-xs mb-4">เวลา: {new Date(receiptData.timestamp).toLocaleString('th-TH')}</p>
          <table className="w-full text-xs mb-4"><thead className="border-y border-black"><tr><th className="py-1 text-left">รายการ</th><th className="py-1 text-center">จน.</th><th className="py-1 text-right">รวม</th></tr></thead>
            <tbody className="border-b border-black">
              {receiptData.cartDetails.map((item, idx) => (
                <tr key={idx}><td className="py-1 text-left">{item.name}</td><td className="py-1 text-center">{item.qty}</td><td className="py-1 text-right">{(item.price * item.qty).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs">
            {receiptData.discountAmount > 0 && <div className="flex justify-between mb-1"><span>ส่วนลด:</span><span>-฿{receiptData.discountAmount}</span></div>}
            <div className="flex justify-between font-bold text-sm"><span>สุทธิ:</span><span>฿{receiptData.netTotal.toLocaleString()}</span></div>
            <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-gray-400"><span>ชำระโดย:</span><span>{receiptData.paymentMethod === 'cash' ? 'เงินสด' : 'โอน'}</span></div>
            {receiptData.paymentMethod === 'cash' && (
              <>
                <div className="flex justify-between"><span>รับเงิน:</span><span>฿{receiptData.receiveAmount}</span></div>
                <div className="flex justify-between font-bold"><span>ทอน:</span><span>฿{receiptData.changeAmount}</span></div>
              </>
            )}
          </div>
          <p className="text-center text-xs mt-6">ขอบคุณที่ใช้บริการ</p>
        </div>
      )}
    </>
  );
}

export default POS;