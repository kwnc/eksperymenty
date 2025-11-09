import { useEffect, useState } from 'react'
import { useCustomerStore } from '@/stores/customerStore'
import { useVehicleStore } from '@/stores/vehicleStore'
import { useWorkOrderStore } from '@/stores/workOrderStore'

/**
 * Hook to initialize all data stores on app startup
 * Loads data from IndexedDB into Zustand stores
 */
export function useDataInitialization() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCustomers = useCustomerStore((state) => state.loadCustomers)
  const loadVehicles = useVehicleStore((state) => state.loadVehicles)
  const loadWorkOrders = useWorkOrderStore((state) => state.loadWorkOrders)
  const loadWorkOrderItems = useWorkOrderStore((state) => state.loadWorkOrderItems)

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          loadCustomers(),
          loadVehicles(),
          loadWorkOrders(),
          loadWorkOrderItems(),
        ])
        setIsInitialized(true)
      } catch (err) {
        setError((err as Error).message)
        console.error('Failed to initialize data:', err)
      }
    }

    initializeData()
  }, [loadCustomers, loadVehicles, loadWorkOrders, loadWorkOrderItems])

  return { isInitialized, error }
}