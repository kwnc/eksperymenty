import { useMemo } from 'react'
import { useWorkOrderStore } from '@/stores/workOrderStore'
import { useCustomerStore } from '@/stores/customerStore'
import { startOfMonth, endOfMonth } from 'date-fns'

export interface DashboardStats {
  activeWorkOrders: number
  readyForPickup: number
  totalCustomers: number
  monthlyRevenue: number
  inProgressOrders: number
  completedThisMonth: number
}

/**
 * Hook to calculate dashboard statistics
 */
export function useDashboardStats(): DashboardStats {
  const workOrders = useWorkOrderStore((state) => state.workOrders)
  const customers = useCustomerStore((state) => state.customers)
  const workOrderItems = useWorkOrderStore((state) => state.workOrderItems)

  return useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Active work orders (INTAKE or IN_PROGRESS)
    const activeWorkOrders = workOrders.filter(
      (wo) => wo.status === 'INTAKE' || wo.status === 'IN_PROGRESS'
    ).length

    // Ready for pickup
    const readyForPickup = workOrders.filter((wo) => wo.status === 'READY').length

    // In progress
    const inProgressOrders = workOrders.filter((wo) => wo.status === 'IN_PROGRESS').length

    // Completed this month
    const completedThisMonth = workOrders.filter((wo) => {
      if (wo.status !== 'COMPLETED' || !wo.completedAt) return false
      const completedDate = new Date(wo.completedAt)
      return completedDate >= monthStart && completedDate <= monthEnd
    }).length

    // Monthly revenue (from completed orders this month)
    const monthlyRevenue = workOrders
      .filter((wo) => {
        if (wo.status !== 'COMPLETED' || !wo.completedAt) return false
        const completedDate = new Date(wo.completedAt)
        return completedDate >= monthStart && completedDate <= monthEnd
      })
      .reduce((total, wo) => {
        const items = workOrderItems.filter((item) => item.workOrderId === wo.id)
        const orderTotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
        return total + orderTotal
      }, 0)

    return {
      activeWorkOrders,
      readyForPickup,
      totalCustomers: customers.length,
      monthlyRevenue,
      inProgressOrders,
      completedThisMonth,
    }
  }, [workOrders, customers, workOrderItems])
}