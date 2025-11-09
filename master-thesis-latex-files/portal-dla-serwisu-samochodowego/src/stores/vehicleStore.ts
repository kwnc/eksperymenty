import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '@/db/schema'
import type { Vehicle } from '@/types'

interface VehicleState {
  vehicles: Vehicle[]
  isLoading: boolean
  error: string | null

  // Actions
  loadVehicles: () => Promise<void>
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Vehicle>
  updateVehicle: (id: string, updates: Partial<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteVehicle: (id: string) => Promise<void>
  getVehicleById: (id: string) => Vehicle | undefined
  getVehiclesByCustomerId: (customerId: string) => Vehicle[]
  searchVehicles: (query: string) => Vehicle[]
}

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set, get) => ({
      vehicles: [],
      isLoading: false,
      error: null,

      loadVehicles: async () => {
        set({ isLoading: true, error: null })
        try {
          const vehicles = await db.vehicles.toArray()
          set({ vehicles, isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      addVehicle: async (vehicleData) => {
        set({ isLoading: true, error: null })
        try {
          const now = new Date()
          const vehicle: Vehicle = {
            id: crypto.randomUUID(),
            ...vehicleData,
            createdAt: now,
            updatedAt: now,
          }

          await db.vehicles.add(vehicle)
          set((state) => ({
            vehicles: [...state.vehicles, vehicle],
            isLoading: false,
          }))

          return vehicle
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          throw error
        }
      },

      updateVehicle: async (id, updates) => {
        set({ isLoading: true, error: null })
        try {
          const updatedData = {
            ...updates,
            updatedAt: new Date(),
          }

          await db.vehicles.update(id, updatedData)

          set((state) => ({
            vehicles: state.vehicles.map((v) =>
              v.id === id ? { ...v, ...updatedData } : v
            ),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          throw error
        }
      },

      deleteVehicle: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await db.vehicles.delete(id)
          set((state) => ({
            vehicles: state.vehicles.filter((v) => v.id !== id),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
          throw error
        }
      },

      getVehicleById: (id) => {
        return get().vehicles.find((v) => v.id === id)
      },

      getVehiclesByCustomerId: (customerId) => {
        return get().vehicles.filter((v) => v.customerId === customerId)
      },

      searchVehicles: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().vehicles.filter(
          (v) =>
            v.make.toLowerCase().includes(lowerQuery) ||
            v.model.toLowerCase().includes(lowerQuery) ||
            v.licensePlate.toLowerCase().includes(lowerQuery) ||
            v.vin?.toLowerCase().includes(lowerQuery)
        )
      },
    }),
    {
      name: 'vehicle-storage',
      partialize: (state) => ({ vehicles: state.vehicles }),
    }
  )
)