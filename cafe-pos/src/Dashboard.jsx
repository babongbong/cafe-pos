import { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 

  // ✅ ใช้วันที่ปัจจุบันโซนเวลาไทยเป็นค่าเริ่มต้น (แก้ไขบัคเที่ยงคืน)
  const todayString = new Date().toLocaleDateString('sv-SE'); 
  const [selectedDate, setSelectedDate] = useState(todayString);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ตัวกรองอัจฉริยะ: คัดมาเฉพาะบิลที่ตรงกับวันที่เลือก
  const displayedOrders = selectedDate 
    ? orders.filter(order => order.date === selectedDate)
    : orders;

  const totalSales = displayedOrders.reduce((sum, order) => sum + (order.netTotal || order.total || 0), 0);

  const processTopItems = () => {
    const itemCounts = {};
    displayedOrders.forEach(order => {
      if (order.cartDetails) {
        order.cartDetails.forEach(item => { itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty; });
      } else if (order.items) {
        order.items.forEach(str => {
          const match = str.match(/(.+) \(x(\d+)\)/);
          if (match) itemCounts[match[1]] = (itemCounts[match[1]] || 0) + parseInt(match[2]);
        });
      }
    });
    return Object.keys(itemCounts)
      .map(key => ({ name: key, จำนวน: itemCounts[key] }))
      .sort((a, b) => b.จำนวน - a.จำนวน)
      .slice(0, 5);
  };
  const topItemsData = processTopItems();

  const processPaymentMethods = () => {
    let cash = 0, transfer = 0;
    displayedOrders.forEach(order => {
      if (order.paymentMethod === 'transfer') transfer++;
      else cash++; 
    });
    return [ { name: 'เงินสด', value: cash }, { name: 'เงินโอน', value: transfer } ];
  };
  const paymentData = processPaymentMethods();
  const COLORS = ['#d97706', '#2563eb']; 

  const exportToExcel = () => {
    const BOM = '\uFEFF'; 
    const header = "เลขที่บิล,วันที่,รายการสินค้า,ยอดรวม,ส่วนลด,ยอดสุทธิ,วิธีชำระเงิน\n";
    const rows = displayedOrders.map(order => {
      const dateStr = order.timestamp?.toDate ? order.timestamp.toDate().toLocaleString('th-TH') : order.date;
      const itemsStr = `"${order.items ? order.items.join(', ') : '-'}"`; 
      const subtotal = order.subtotal || order.total;
      const discount = order.discountAmount || 0;
      const netTotal = order.netTotal || order.total;
      const payMethod = order.paymentMethod === 'transfer' ? 'Transfer' : 'Cash';
      return `${order.billId},"${dateStr}",${itemsStr},${subtotal},${discount},${netTotal},${payMethod}`;
    }).join('\n');

    const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const fileNameDate = selectedDate ? selectedDate : 'all_time';
    link.download = `sales_report_${fileNameDate}.csv`; 
    link.click();
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = displayedOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(displayedOrders.length / itemsPerPage) || 1;

  if (loading) return <div className="p-10 text-center font-bold text-amber-900 text-xl">กำลังดึงข้อมูล... 📊</div>;

  return (
    <div className="p-8 h-full overflow-y-auto bg-stone-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold text-amber-900 mb-2">สรุปยอดขาย (Analytics)</h1>
            <p className="text-stone-500">
              {selectedDate ? `ข้อมูลประจำวันที่ ${new Date(selectedDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}` : "ข้อมูลตั้งแต่เปิดร้านทั้งหมด"}
            </p>
          </div>
          
          <div className="flex gap-4 items-end">
            <div className="bg-white px-4 py-4 rounded-2xl shadow-md border border-stone-200 flex flex-col justify-center">
              <label className="text-xs font-bold text-stone-500 mb-1">📅 เลือกวันที่ดูยอดขาย</label>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="font-bold text-amber-900 outline-none cursor-pointer"
                />
                {selectedDate && (
                  <button 
                    onClick={() => { setSelectedDate(""); setCurrentPage(1); }} 
                    className="text-xs px-2 py-1 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-md font-bold transition-colors"
                  >
                    ดูรวมทั้งหมด
                  </button>
                )}
              </div>
            </div>

            <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl shadow-md font-bold transition-colors flex items-center gap-2 h-full">
              📥 โหลดไฟล์ Excel
            </button>
            <div className="bg-white px-8 py-4 rounded-2xl shadow-md border border-stone-200 text-right">
              <p className="text-sm text-gray-500 font-bold mb-1">รายได้สุทธิ ({selectedDate ? 'รายวัน' : 'รวมทั้งหมด'})</p>
              <p className="text-4xl font-black text-green-600">฿{totalSales.toLocaleString()}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 lg:col-span-2">
            <h3 className="text-lg font-bold text-amber-900 mb-4">🏆 5 อันดับเมนูขายดี</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItemsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f5f5f4'}} />
                  <Bar dataKey="จำนวน" fill="#d97706" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h3 className="text-lg font-bold text-amber-900 mb-4">💳 สัดส่วนวิธีชำระเงิน</h3>
            <div className="h-[300px]">
              {paymentData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {paymentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-stone-400 font-bold">ไม่มีข้อมูลในวันที่เลือก</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col min-h-[400px]">
          <table className="w-full text-left border-collapse flex-1">
            <thead>
              <tr className="bg-stone-800 text-white">
                <th className="p-4">เลขที่บิล</th>
                <th className="p-4">เวลา</th>
                <th className="p-4 w-1/3">รายการสินค้า</th>
                <th className="p-4 text-center">วิธีชำระ</th>
                <th className="p-4 text-right">ส่วนลด</th>
                <th className="p-4 text-right text-green-400 font-bold">ยอดสุทธิ</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {currentOrders.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-stone-400">ไม่มีบิลการขายในวันที่เลือก</td></tr>
              ) : (
                currentOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-stone-50 transition-colors">
                    <td className="p-4 font-bold text-amber-900">{order.billId}</td>
                    <td className="p-4 text-stone-600">{order.timestamp?.toDate ? order.timestamp.toDate().toLocaleTimeString('th-TH') : order.date}</td>
                    <td className="p-4 text-stone-500">{order.items ? order.items.join(', ') : '-'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-md font-bold text-xs ${order.paymentMethod === 'transfer' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {order.paymentMethod === 'transfer' ? 'โอน' : 'เงินสด'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-red-500">{order.discountAmount > 0 ? `-฿${order.discountAmount}` : '-'}</td>
                    <td className="p-4 text-right font-bold text-stone-800 text-base">฿{order.netTotal || order.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="p-4 bg-stone-50 flex justify-between items-center border-t mt-auto">
            <span className="text-sm text-stone-500 font-medium">หน้า {currentPage} จาก {totalPages} | รวม {displayedOrders.length} บิล</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-5 py-2 bg-white border rounded-lg disabled:opacity-40 font-bold text-stone-600 hover:bg-stone-100 shadow-sm">◀ ก่อนหน้า</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-5 py-2 bg-white border rounded-lg disabled:opacity-40 font-bold text-stone-600 hover:bg-stone-100 shadow-sm">ถัดไป ▶</button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default Dashboard;