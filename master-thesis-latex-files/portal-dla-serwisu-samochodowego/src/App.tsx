import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useDataInitialization } from './hooks/useDataInitialization'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import WorkOrders from './pages/WorkOrders'
import WorkOrderNew from './pages/WorkOrderNew'
import WorkOrderDetail from './pages/WorkOrderDetail'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Vehicles from './pages/Vehicles'
import Settings from './pages/Settings'

function App() {
  const { isInitialized, error } = useDataInitialization()

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Błąd inicjalizacji
          </h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Ładowanie...</h1>
          <p className="text-muted-foreground">Inicjalizacja aplikacji</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="work-orders" element={<WorkOrders />} />
          <Route path="work-orders/new" element={<WorkOrderNew />} />
          <Route path="work-orders/:workOrderId" element={<WorkOrderDetail />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:customerId" element={<CustomerDetail />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App