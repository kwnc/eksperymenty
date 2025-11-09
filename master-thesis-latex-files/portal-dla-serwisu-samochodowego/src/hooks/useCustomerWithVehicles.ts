import { useMemo } from 'react'
import { useCustomerStore } from '@/stores/customerStore'
import { useVehicleStore } from '@/stores/vehicleStore'
import type { Customer, Vehicle } from '@/types'

export interface CustomerWithVehicles extends Customer {
  vehicles: Vehicle[]
}

/**
 * Hook to get a customer with their associated vehicles
 */
export function useCustomerWithVehicles(customerId: string): CustomerWithVehicles | undefined {
  const customer = useCustomerStore((state) => state.getCustomerById(customerId))
  const getVehiclesByCustomerId = useVehicleStore((state) => state.getVehiclesByCustomerId)

  return useMemo(() => {
    if (!customer) return undefined

    return {
      ...customer,
      vehicles: getVehiclesByCustomerId(customerId),
    }
  }, [customer, customerId, getVehiclesByCustomerId])
}

/**
 * Hook to get all customers with their associated vehicles
 */
export function useCustomersWithVehicles(): CustomerWithVehicles[] {
  const customers = useCustomerStore((state) => state.customers)
  const vehicles = useVehicleStore((state) => state.vehicles)

  return useMemo(() => {
    return customers.map((customer) => ({
      ...customer,
      vehicles: vehicles.filter((v) => v.customerId === customer.id),
    }))
  }, [customers, vehicles])
}