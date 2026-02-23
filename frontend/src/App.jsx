import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'

// Pages
import Home from './pages/Home'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminBranches from './pages/admin/AdminBranches'
import AdminOrders from './pages/admin/AdminOrders'
import AdminProducts from './pages/admin/AdminProducts'
import AdminEmployees from './pages/admin/AdminEmployees'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminStores from './pages/admin/AdminStores'
import AdminSupply from './pages/admin/AdminSupply'
import AdminUsers from './pages/admin/AdminUsers'
import CustomerLogin from './pages/customer/CustomerLogin'
import CustomerRegister from './pages/customer/CustomerRegister'
import Shop from './pages/customer/Shop'
import Checkout from './pages/customer/Checkout'
import MyOrders from './pages/customer/MyOrders'

function RequireAdmin({ children }) {
  const { role } = useAuth()
  if (!role || (role !== 'admin' && role !== 'superadmin')) {
    return <Navigate to="/login" replace />
  }
  return children
}

function RequireCustomer({ children }) {
  const { role } = useAuth()
  if (!role || role !== 'customer') {
    return <Navigate to="/customer/login" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/register" element={<CustomerRegister />} />

          {/* Customer protected */}
          <Route path="/checkout" element={<RequireCustomer><Checkout /></RequireCustomer>} />
          <Route path="/my-orders" element={<RequireCustomer><MyOrders /></RequireCustomer>} />

          {/* Admin protected */}
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin/branches" element={<RequireAdmin><AdminBranches /></RequireAdmin>} />
          <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
          <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/admin/employees" element={<RequireAdmin><AdminEmployees /></RequireAdmin>} />
          <Route path="/admin/customers" element={<RequireAdmin><AdminCustomers /></RequireAdmin>} />
          <Route path="/admin/stores" element={<RequireAdmin><AdminStores /></RequireAdmin>} />
          <Route path="/admin/supply" element={<RequireAdmin><AdminSupply /></RequireAdmin>} />
          <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
