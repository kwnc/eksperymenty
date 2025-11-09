import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '@/db/schema'
import type { WorkOrder, WorkOrderItem, WorkOrderStatus } from '@/types'

interface WorkOrderState {
  workOrders: WorkOrder[]
  workOrderItems: WorkOrderItem[]
  isLoading: boolean
  error: string | null

  // Work Order Actions
  loadWorkOrders: () => Promise<void>
  addWorkOrder: (workOrder: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<WorkOrder>
  updateWorkOrder: (id: string, updates: Partial<Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteWorkOrder: (id: string) => Promise<void>
  getWorkOrderById: (id: string) => WorkOrder | undefined
  getWorkOrdersByCustomerId: (customerId: string) => WorkOrder[]
  getWorkOrdersByStatus: (status: WorkOrderStatus) => WorkOrder[]
  updateWorkOrderStatus: (id: string, status: WorkOrderStatus) => Promise<void>

  // Work Order Item Actions
  loadWorkOrderItems: () => Promise<void>
  addWorkOrderItem: (item: Omit<WorkOrderItem, 'id'>) => Promise<WorkOrderItem>
  updateWorkOrderItem: (id: string, updates: Partial<Omit<WorkOrderItem, 'id'>>) => Promise<void>
  deleteWorkOrderItem: (id: string) => Promise<void>
  getWorkOrderItems: (workOrderId: string) => WorkOrderItem[]
  calculateWorkOrderTotal: (workOrderId: string) => number
}

export const useWorkOrderStore = create<WorkOrderState>()(
  persist(
    (set, get) => ({
      workOrders: [],
      workOrderItems: [],
      isLoading: false,
      error: null,

      // Work Order Actions
      loadWorkOrders: async () => {
        set({ isLoading: true, error: null })
        try {
          const workOrders = await db.workOrders.toArray()
          set({ workOrders, isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      addWorkOrder: async (workOrderData) => {
        set({ isLoading: true, error: null })
        try {
          const now = new Date()
          const workOrder: WorkOrder = {
            id: crypto.randomUUID(),
            ...workOrderData,
            createdAt: now,
            updatedAt: now,
          }

          await db.workOrders.add(workOrder)
          set((state) => ({
            workOrders: [...state.workOrders, workOrder],
            isLoading: false,
          }))

          return workOrder
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          throw error
        }
      },

      updateWorkOrder: async (id, updates) => {
        set({ isLoading: true, error: null })
        try {
          const updatedData = {
            ...updates,
            updatedAt: new Date(),
          }

          await db.workOrders.update(id, updatedData)

          set((state) => ({
            workOrders: state.workOrders.map((wo) =>
              wo.id === id ? { ...wo, ...updatedData } : wo
            ),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          throw error
        }
      },

      deleteWorkOrder: async (id) => {
        set({ isLoading: true, error: null })
        try {
          // Delete all associated items first
          const items = get().getWorkOrderItems(id)
          await Promise.all(items.map((item) => db.workOrderItems.delete(item.id)))

          await db.workOrders.delete(id)

          set((state) => ({
            workOrders: state.workOrders.filter((wo) => wo.id !== id),
            workOrderItems: state.workOrderItems.filter((item) => item.workOrderId !== id),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          throw error
        }
      },

      getWorkOrderById: (id) => {
        return get().workOrders.find((wo) => wo.id === id)
      },

      getWorkOrdersByCustomerId: (customerId) => {
        return get().workOrders.filter((wo) => wo.customerId === customerId)
      },

      getWorkOrdersByStatus: (status) => {
        return get().workOrders.filter((wo) => wo.status === status)
      },

      updateWorkOrderStatus: async (id, status) => {
        set({ isLoading: true, error: null })
        try {
          const updates: Partial<WorkOrder> = {
            status,
            updatedAt: new Date(),
          }

          if (status === 'COMPLETED') {
            updates.completedAt = new Date()
          }

          await db.workOrders.update(id, updates)

          set((state) => ({
            workOrders: state.workOrders.map((wo) =>
              wo.id === id ? { ...wo, ...updates } : wo
            ),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          throw error
        }
      },

      // Work Order Item Actions
      loadWorkOrderItems: async () => {
        set({ isLoading: true, error: null })
        try {
          const workOrderItems = await db.workOrderItems.toArray()
          set({ workOrderItems, isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      addWorkOrderItem: async (itemData) => {
        set({ isLoading: true, error: null })
        try {
          const item: WorkOrderItem = {
            id: crypto.randomUUID(),
            ...itemData,
            totalPrice: itemData.quantity * itemData.unitPrice,
          }

          await db.workOrderItems.add(item)
          set((state) => ({
            workOrderItems: [...state.workOrderItems, item],
            isLoading: false,
          }))

          return item
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          throw error
        }
      },

      updateWorkOrderItem: async (id, updates) => {
        set({ isLoading: true, error: null })
        try {
          const updatedData = {
            ...updates,
            ...(updates.quantity !== undefined || updates.unitPrice !== undefined
              ? {
                  totalPrice:
                    (updates.quantity ?? get().workOrderItems.find((i) => i.id === id)?.quantity ?? 0) *
                    (updates.unitPrice ?? get().workOrderItems.find((i) => i.id === id)?.unitPrice ?? 0),
                }
              : {}),
          }

          await db.workOrderItems.update(id, updatedData)

          set((state) => ({
            workOrderItems: state.workOrderItems.map((item) =>
              item.id === id ? { ...item, ...updatedData } : item
            ),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          throw error
        }
      },

      deleteWorkOrderItem: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await db.workOrderItems.delete(id)
          set((state) => ({
            workOrderItems: state.workOrderItems.filter((item) => item.id !== id),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          throw error
        }
      },

      getWorkOrderItems: (workOrderId) => {
        return get().workOrderItems.filter((item) => item.workOrderId === workOrderId)
      },

      calculateWorkOrderTotal: (workOrderId) => {
        const items = get().getWorkOrderItems(workOrderId)
        return items.reduce((total, item) => total + item.totalPrice, 0)
      },
    }),
    {
      name: 'work-order-storage',
      partialize: (state) => ({
        workOrders: state.workOrders,
        workOrderItems: state.workOrderItems,
      }),
    }
  )
)