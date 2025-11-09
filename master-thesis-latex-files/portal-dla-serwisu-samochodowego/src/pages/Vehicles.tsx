import { useState } from 'react'
import { Plus, Search, Edit, Trash2, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { VehicleForm } from '@/components/vehicles/VehicleForm'
import { useVehicleStore, useCustomerStore } from '@/stores'
import type { Vehicle } from '@/types'

export default function Vehicles() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>()

  const vehicles = useVehicleStore((state) => state.vehicles)
  const searchVehicles = useVehicleStore((state) => state.searchVehicles)
  const deleteVehicle = useVehicleStore((state) => state.deleteVehicle)
  const getCustomerById = useCustomerStore((state) => state.getCustomerById)

  const filteredVehicles = searchQuery ? searchVehicles(searchQuery) : vehicles

  const handleAddVehicle = () => {
    setSelectedVehicle(undefined)
    setIsDialogOpen(true)
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsDialogOpen(true)
  }

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    const customer = getCustomerById(vehicle.customerId)
    const customerName = customer
      ? `${customer.firstName} ${customer.lastName}`
      : 'nieznany'

    if (
      window.confirm(
        `Czy na pewno chcesz usunąć pojazd ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate}) należący do ${customerName}?`
      )
    ) {
      try {
        await deleteVehicle(vehicle.id)
      } catch (error) {
        alert('Nie udało się usunąć pojazdu')
      }
    }
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setSelectedVehicle(undefined)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pojazdy</h1>
          <p className="text-muted-foreground">
            Zarządzanie bazą pojazdów klientów
          </p>
        </div>
        <Button onClick={handleAddVehicle}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj Pojazd
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Pojazdów</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj po marce, modelu, rejestracji lub VIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? 'Nie znaleziono pojazdów pasujących do wyszukiwania'
                : 'Brak pojazdów w bazie. Dodaj pierwszy pojazd.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pojazd</TableHead>
                  <TableHead>Rejestracja</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead>Właściciel</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => {
                  const customer = getCustomerById(vehicle.customerId)
                  return (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">
                            {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Rocznik: {vehicle.year}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-semibold">
                          {vehicle.licensePlate}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-muted-foreground">
                          {vehicle.vin || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {customer ? (
                          <Link
                            to={`/customers/${customer.id}`}
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <User className="h-3 w-3" />
                            {customer.firstName} {customer.lastName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditVehicle(vehicle)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteVehicle(vehicle)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogClose onClose={() => setIsDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>
              {selectedVehicle ? 'Edytuj Pojazd' : 'Dodaj Nowy Pojazd'}
            </DialogTitle>
          </DialogHeader>
          <VehicleForm
            vehicle={selectedVehicle}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
