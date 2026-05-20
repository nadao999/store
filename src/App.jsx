import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import Login from './pages/Login';
import Register from './pages/Register';
import AddRequest from './pages/AddRequest';
import Home from './pages/Home';
import RequestDetails from './pages/RequestDetails';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import VendorDashboard from './pages/VendorDashboard';
import CategoryPage from './pages/CategoryPage';
import ProductDetails from './pages/ProductDetails';
import Search from './pages/Search';
import Messages from './pages/Messages';
import VendorProfile from './pages/VendorProfile';
import Requests from './pages/Requests';
import Wishlist from './pages/Wishlist';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-right pb-16 md:pb-0" dir="rtl">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />   
            <Route path="/admin" element={<AdminDashboard />} />         
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/add" element={<AddRequest />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/request/:id" element={<RequestDetails />} />
            <Route path="/mystore" element={<VendorDashboard />} />
            <Route path="/category/:categorySlug" element={<CategoryPage />} />
            <Route path="/product/:slug" element={<ProductDetails />} />
            <Route path="/search" element={<Search />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/vendor/:id" element={<VendorProfile />} />
            <Route path="requests" element={<Requests />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <MobileBottomNav />
      </div>
    </Router>
  );
}

export default App;