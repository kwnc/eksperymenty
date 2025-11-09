import { useState, useRef } from 'react'
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { exportAllData, downloadJSON, parseImportFile, importData } from '@/lib/dataExport'
import { useCustomerStore, useVehicleStore, useWorkOrderStore } from '@/stores'

export default function Settings() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importMessage, setImportMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadCustomers = useCustomerStore((state) => state.loadCustomers)
  const loadVehicles = useVehicleStore((state) => state.loadVehicles)
  const loadWorkOrders = useWorkOrderStore((state) => state.loadWorkOrders)
  const loadWorkOrderItems = useWorkOrderStore((state) => state.loadWorkOrderItems)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const data = await exportAllData()
      const filename = `autoserve-export-${new Date().toISOString().split('T')[0]}.json`
      downloadJSON(data, filename)
    } catch (error) {
      alert('Nie udało się wyeksportować danych')
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      setImportStatus('idle')
      setImportMessage('')

      const data = await parseImportFile(file)

      const confirmed = window.confirm(
        `Czy na pewno chcesz zaimportować dane?\n\n` +
        `Klienci: ${data.customers.length}\n` +
        `Pojazdy: ${data.vehicles.length}\n` +
        `Zlecenia: ${data.workOrders.length}\n\n` +
        `UWAGA: Wszystkie obecne dane zostaną usunięte!`
      )

      if (!confirmed) {
        setIsImporting(false)
        return
      }

      await importData(data)

      // Reload all data into stores
      await Promise.all([
        loadCustomers(),
        loadVehicles(),
        loadWorkOrders(),
        loadWorkOrderItems(),
      ])

      setImportStatus('success')
      setImportMessage('Dane zostały pomyślnie zaimportowane')
    } catch (error) {
      setImportStatus('error')
      setImportMessage(error instanceof Error ? error.message : 'Nie udało się zaimportować danych')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const stats = {
    customers: useCustomerStore((state) => state.customers.length),
    vehicles: useVehicleStore((state) => state.vehicles.length),
    workOrders: useWorkOrderStore((state) => state.workOrders.length),
    workOrderItems: useWorkOrderStore((state) => state.workOrderItems.length),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ustawienia</h1>
        <p className="text-muted-foreground">
          Zarządzanie danymi i konfiguracją aplikacji
        </p>
      </div>

      {/* Database Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statystyki bazy danych</CardTitle>
          <CardDescription>Aktualna liczba rekordów w bazie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Klienci</p>
              <p className="text-2xl font-bold">{stats.customers}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pojazdy</p>
              <p className="text-2xl font-bold">{stats.vehicles}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Zlecenia</p>
              <p className="text-2xl font-bold">{stats.workOrders}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pozycje zleceń</p>
              <p className="text-2xl font-bold">{stats.workOrderItems}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle>Eksport danych</CardTitle>
          <CardDescription>
            Pobierz kopię wszystkich danych w formacie JSON
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Eksportowanie...' : 'Eksportuj dane'}
          </Button>
        </CardContent>
      </Card>

      {/* Data Import */}
      <Card>
        <CardHeader>
          <CardTitle>Import danych</CardTitle>
          <CardDescription>
            Wczytaj dane z pliku JSON. UWAGA: Wszystkie obecne dane zostaną zastąpione!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              onClick={handleImportClick}
              disabled={isImporting}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importowanie...' : 'Wybierz plik JSON'}
            </Button>
          </div>

          {importStatus === 'success' && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              {importMessage}
            </div>
          )}

          {importStatus === 'error' && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {importMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informacje o aplikacji</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nazwa:</span>
            <span className="font-medium">AutoServe</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Wersja:</span>
            <span className="font-medium">0.0.1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Przechowywanie:</span>
            <span className="font-medium">IndexedDB (lokalne)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}