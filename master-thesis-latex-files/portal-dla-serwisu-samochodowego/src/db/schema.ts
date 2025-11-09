import Dexie, { type EntityTable } from 'dexie'
import type { Customer, Vehicle, WorkOrder, WorkOrderItem } from '@/types'

// Define the database schema
class AutoServeDB extends Dexie {
  customers!: EntityTable<Customer, 'id'>
  vehicles!: EntityTable<Vehicle, 'id'>
  workOrders!: EntityTable<WorkOrder, 'id'>
  workOrderItems!: EntityTable<WorkOrderItem, 'id'>

  constructor() {
    super('AutoServeDB')

    this.version(1).stores({
      customers: 'id, lastName, phone, email, createdAt',
      vehicles: 'id, customerId, licensePlate, createdAt',
      workOrders: 'id, customerId, vehicleId, status, createdAt, completedAt',
      workOrderItems: 'id, workOrderId, type'
    })
  }
}

export const db = new AutoServeDB()