import { db } from '@/db/schema'
import type { Customer, Vehicle, WorkOrder, WorkOrderItem } from '@/types'

interface ExportData {
  version: string
  exportDate: string
  customers: Customer[]
  vehicles: Vehicle[]
  workOrders: WorkOrder[]
  workOrderItems: WorkOrderItem[]
}

export async function exportAllData(): Promise<ExportData> {
  const [customers, vehicles, workOrders, workOrderItems] = await Promise.all([
    db.customers.toArray(),
    db.vehicles.toArray(),
    db.workOrders.toArray(),
    db.workOrderItems.toArray(),
  ])

  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    customers,
    vehicles,
    workOrders,
    workOrderItems,
  }
}

export function downloadJSON(data: ExportData, filename: string = 'autoserve-export.json') {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function importData(data: ExportData): Promise<void> {
  // Validate version
  if (data.version !== '1.0') {
    throw new Error('Nieobsługiwana wersja pliku exportu')
  }

  // Clear existing data
  await Promise.all([
    db.customers.clear(),
    db.vehicles.clear(),
    db.workOrders.clear(),
    db.workOrderItems.clear(),
  ])

  // Import new data
  await Promise.all([
    db.customers.bulkAdd(data.customers),
    db.vehicles.bulkAdd(data.vehicles),
    db.workOrders.bulkAdd(data.workOrders),
    db.workOrderItems.bulkAdd(data.workOrderItems),
  ])
}

export function parseImportFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ExportData

        // Basic validation
        if (!data.version || !data.customers || !data.vehicles || !data.workOrders) {
          reject(new Error('Nieprawidłowy format pliku'))
          return
        }

        resolve(data)
      } catch (error) {
        reject(new Error('Nie udało się odczytać pliku'))
      }
    }

    reader.onerror = () => reject(new Error('Błąd odczytu pliku'))
    reader.readAsText(file)
  })
}