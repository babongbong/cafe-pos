import { useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false); // ใช้สลับหน้า Login/Register
  const [error, setError] = useState('');

  // ฟังก์ชันจัดการการกดปุ่ม (สมัคร หรือ เข้าสู่ระบบ)
  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        // สมัครสมาชิกใหม่
        await createUserWithEmailAndPassword(auth, email, password);
        alert('🎉 สมัครสมาชิกสำเร็จ!');
      } else {
        // เข้าสู่ระบบ
        await signInWithEmailAndPassword(auth, email, password);
        alert('✅ เข้าสู่ระบบสำเร็จ!');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-stone-100">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border-t-4 border-amber-600">
        <h2 className="text-3xl font-bold text-center text-amber-800 mb-6">
          ☕ Modern Cafe POS
          <span className="block text-lg font-normal text-gray-500 mt-2">
            {isRegister ? 'สมัครสมาชิกสำหรับพนักงาน' : 'เข้าสู่ระบบ'}
          </span>
        </h2>
        
        {/* แสดงข้อความ Error สีแดง ถ้ามีข้อผิดพลาด */}
        {error && <p className="text-red-500 text-sm text-center mb-4 bg-red-50 p-2 rounded">{error}</p>}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1 font-medium">อีเมล</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@cafe.com"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-medium">รหัสผ่าน</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition font-bold text-lg"
          >
            {isRegister ? 'ยืนยันการสมัคร' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          {isRegister ? 'มีบัญชีอยู่แล้ว? ' : 'ยังไม่มีบัญชี? '}
          <button 
            onClick={() => setIsRegister(!isRegister)} 
            className="text-amber-600 font-semibold hover:underline"
          >
            {isRegister ? 'เข้าสู่ระบบที่นี่' : 'สมัครสมาชิก'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;