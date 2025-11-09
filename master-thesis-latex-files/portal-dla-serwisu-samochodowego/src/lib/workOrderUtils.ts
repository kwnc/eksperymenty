import type { WorkOrderStatus } from '@/types'

export const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  INTAKE: 'Przyjęto',
  IN_PROGRESS: 'W trakcie',
  READY: 'Gotowe',
  DELIVERED: 'Wydano',
  COMPLETED: 'Zakończone',
}

export const workOrderStatusColors: Record<WorkOrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  INTAKE: 'outline',
  IN_PROGRESS: 'default',
  READY: 'secondary',
  DELIVERED: 'secondary',
  COMPLETED: 'outline',
}

export const workOrderStatusOrder: WorkOrderStatus[] = [
  'INTAKE',
  'IN_PROGRESS',
  'READY',
  'DELIVERED',
  'COMPLETED',
]

export function getNextStatus(currentStatus: WorkOrderStatus): WorkOrderStatus | null {
  const currentIndex = workOrderStatusOrder.indexOf(currentStatus)
  if (currentIndex === -1 || currentIndex === workOrderStatusOrder.length - 1) {
    return null
  }
  return workOrderStatusOrder[currentIndex + 1]
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(amount)
}