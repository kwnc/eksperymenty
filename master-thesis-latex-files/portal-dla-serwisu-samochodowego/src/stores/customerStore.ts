import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '@/db/schema'
import type { Customer } from '@/types'

interface CustomerState {
  customers: Customer[]
  isLoading: boolean
  error: string | null

  // Actions
  loadCustomers: () => Promise<void>
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>
  updateCustomer: (id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
  getCustomerById: (id: string) => Customer | undefined
  searchCustomers: (query: string) => Customer[]
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      isLoading: false,
      error: null,

      loadCustomers: async () => {
        set({ isLoading: true, error: null })
        try {
          const customers = await db.customers.toArray()
          set({ customers, isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      addCustomer: async (customerData) => {
        set({ isLoading: true, error: null })
        try {
          const now = new Date()
          const customer: Customer = {
            id: crypto.randomUUID(),
            ...customerData,
            createdAt: now,
            updatedAt: now,
          }

          await db.customers.add(customer)
          set((state) => ({
            customers: [...state.customers, customer],
            isLoading: false,
          }))

          return customer
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          throw error
        }
      },

      updateCustomer: async (id, updates) => {
        set({ isLoading: true, error: null })
        try {
          const updatedData = {
            ...updates,
            updatedAt: new Date(),
          }

          await db.customers.update(id, updatedData)

          set((state) => ({
            customers: state.customers.map((c) =>
              c.id === id ? { ...c, ...updatedData } : c
            ),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          throw error
        }
      },

      deleteCustomer: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await db.customers.delete(id)
          set((state) => ({
            customers: state.customers.filter((c) => c.id !== id),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          throw error
        }
      },

      getCustomerById: (id) => {
        return get().customers.find((c) => c.id === id)
      },

      searchCustomers: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().customers.filter(
          (c) =>
            c.firstName.toLowerCase().includes(lowerQuery) ||
            c.lastName.toLowerCase().includes(lowerQuery) ||
            c.phone.includes(query) ||
            c.email?.toLowerCase().includes(lowerQuery)
        )
      },
    }),
    {
      name: 'customer-storage',
      partialize: (state) => ({ customers: state.customers }),
    }
  )
)