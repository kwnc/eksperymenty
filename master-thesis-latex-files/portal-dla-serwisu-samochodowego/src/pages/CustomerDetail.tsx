import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Edit, Trash2, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { useCustomerWithVehicles } from '@/hooks'
import { useVehicleStore } from '@/stores'
import type { Vehicle } from '@/types'

export default function CustomerDetail() {
  const { customerId } = useParams<{ customerId: string }>()
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>()

  const customerWithVehicles = useCustomerWithVehicles(customerId!)
  const deleteVehicle = useVehicleStore((state) => state.deleteVehicle)

  if (!customerWithVehicles) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Klient nie znaleziony</h1>
        </div>
      </div>
    )
  }

  const handleAddVehicle = () => {
    setSelectedVehicle(undefined)
    setIsDialogOpen(true)
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsDialogOpen(true)
  }

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    if (window.confirm(`Czy na pewno chcesz usunąć pojazd ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})?`)) {
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
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {customerWithVehicles.firstName} {customerWithVehicles.lastName}
          </h1>
          <p className="text-muted-foreground">
            {customerWithVehicles.phone}
            {customerWithVehicles.email && ` • ${customerWithVehicles.email}`}
          </p>
        </div>
        <Button onClick={handleAddVehicle}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj Pojazd
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Pojazdy klienta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customerWithVehicles.vehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Brak pojazdów. Dodaj pierwszy pojazd dla tego klienta.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marka i Model</TableHead>
                  <TableHead>Rok</TableHead>
                  <TableHead>Numer rejestracyjny</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerWithVehicles.vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">
                      {vehicle.make} {vehicle.model}
                    </TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>{vehicle.licensePlate}</TableCell>
                    <TableCell>{vehicle.vin || '-'}</TableCell>
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
                ))}
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
            preselectedCustomerId={customerId}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}