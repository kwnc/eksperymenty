// Core domain types will be defined here
export type WorkOrderStatus = 'INTAKE' | 'IN_PROGRESS' | 'READY' | 'DELIVERED' | 'COMPLETED'

export interface Customer {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  createdAt: Date
  updatedAt: Date
}

export interface Vehicle {
  id: string
  customerId: string
  make: string
  model: string
  year: number
  vin?: string
  licensePlate: string
  createdAt: Date
  updatedAt: Date
}

export interface WorkOrder {
  id: string
  customerId: string
  vehicleId: string
  status: WorkOrderStatus
  description: string
  diagnosis?: string
  estimatedCost?: number
  finalCost?: number
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface WorkOrderItem {
  id: string
  workOrderId: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  type: 'LABOR' | 'PART'
}