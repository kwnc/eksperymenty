import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Car } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { useCustomerStore, useVehicleStore } from '@/stores'
import type { Customer } from '@/types'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>()

  const customers = useCustomerStore((state) => state.customers)
  const searchCustomers = useCustomerStore((state) => state.searchCustomers)
  const deleteCustomer = useCustomerStore((state) => state.deleteCustomer)
  const getVehiclesByCustomerId = useVehicleStore((state) => state.getVehiclesByCustomerId)

  const filteredCustomers = searchQuery
    ? searchCustomers(searchQuery)
    : customers

  const handleAddCustomer = () => {
    setSelectedCustomer(undefined)
    setIsDialogOpen(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDialogOpen(true)
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    const vehicles = getVehiclesByCustomerId(customer.id)
    const confirmMessage = vehicles.length > 0
      ? `Czy na pewno chcesz usunąć klienta ${customer.firstName} ${customer.lastName}? Klient ma ${vehicles.length} pojazd(ów) w bazie.`
      : `Czy na pewno chcesz usunąć klienta ${customer.firstName} ${customer.lastName}?`

    if (window.confirm(confirmMessage)) {
      try {
        await deleteCustomer(customer.id)
      } catch (error) {
        alert('Nie udało się usunąć klienta')
      }
    }
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setSelectedCustomer(undefined)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Klienci</h1>
          <p className="text-muted-foreground">
            Zarządzanie bazą klientów i ich pojazdami
          </p>
        </div>
        <Button onClick={handleAddCustomer}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj Klienta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Klientów</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj po imieniu, nazwisku, telefonie lub email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? 'Nie znaleziono klientów pasujących do wyszukiwania'
                : 'Brak klientów w bazie. Dodaj pierwszego klienta.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klient</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Pojazdy</TableHead>
                  <TableHead>Data dodania</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const vehicleCount = getVehiclesByCustomerId(customer.id).length
                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/customers/${customer.id}`}
                          className="text-primary hover:underline"
                        >
                          {customer.firstName} {customer.lastName}
                        </Link>
                      </TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>
                        {vehicleCount > 0 ? (
                          <Badge variant="secondary">
                            <Car className="h-3 w-3 mr-1" />
                            {vehicleCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(customer.createdAt), 'dd MMM yyyy', {
                          locale: pl,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCustomer(customer)}
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
              {selectedCustomer ? 'Edytuj Klienta' : 'Dodaj Nowego Klienta'}
            </DialogTitle>
          </DialogHeader>
          <CustomerForm
            customer={selectedCustomer}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}