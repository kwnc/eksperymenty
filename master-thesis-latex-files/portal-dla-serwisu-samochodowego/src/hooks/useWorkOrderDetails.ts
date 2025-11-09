import { useMemo } from 'react'
import { useWorkOrderStore } from '@/stores/workOrderStore'
import { useCustomerStore } from '@/stores/customerStore'
import { useVehicleStore } from '@/stores/vehicleStore'
import type { WorkOrder, WorkOrderItem, Customer, Vehicle } from '@/types'

export interface WorkOrderDetails extends WorkOrder {
  customer?: Customer
  vehicle?: Vehicle
  items: WorkOrderItem[]
  totalCost: number
}

/**
 * Hook to get complete work order details including customer, vehicle, and items
 */
export function useWorkOrderDetails(workOrderId: string): WorkOrderDetails | undefined {
  const workOrder = useWorkOrderStore((state) => state.getWorkOrderById(workOrderId))
  const getCustomerById = useCustomerStore((state) => state.getCustomerById)
  const getVehicleById = useVehicleStore((state) => state.getVehicleById)
  const getWorkOrderItems = useWorkOrderStore((state) => state.getWorkOrderItems)
  const calculateWorkOrderTotal = useWorkOrderStore((state) => state.calculateWorkOrderTotal)

  return useMemo(() => {
    if (!workOrder) return undefined

    const items = getWorkOrderItems(workOrderId)
    const totalCost = calculateWorkOrderTotal(workOrderId)

    return {
      ...workOrder,
      customer: getCustomerById(workOrder.customerId),
      vehicle: getVehicleById(workOrder.vehicleId),
      items,
      totalCost,
    }
  }, [workOrder, workOrderId, getCustomerById, getVehicleById, getWorkOrderItems, calculateWorkOrderTotal])
}

/**
 * Hook to get all work orders with full details
 */
export function useWorkOrdersList(): WorkOrderDetails[] {
  const workOrders = useWorkOrderStore((state) => state.workOrders)
  const customers = useCustomerStore((state) => state.customers)
  const vehicles = useVehicleStore((state) => state.vehicles)
  const workOrderItems = useWorkOrderStore((state) => state.workOrderItems)

  return useMemo(() => {
    return workOrders.map((workOrder) => {
      const items = workOrderItems.filter((item) => item.workOrderId === workOrder.id)
      const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0)

      return {
        ...workOrder,
        customer: customers.find((c) => c.id === workOrder.customerId),
        vehicle: vehicles.find((v) => v.id === workOrder.vehicleId),
        items,
        totalCost,
      }
    })
  }, [workOrders, customers, vehicles, workOrderItems])
}