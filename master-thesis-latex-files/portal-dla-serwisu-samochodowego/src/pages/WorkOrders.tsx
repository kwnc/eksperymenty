import { useState } from 'react'
import { Plus, Search, Eye, Trash2, ChevronRight } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { useWorkOrdersList } from '@/hooks'
import { useWorkOrderStore } from '@/stores'
import type { WorkOrderStatus } from '@/types'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { workOrderStatusLabels, workOrderStatusColors, formatCurrency, getNextStatus } from '@/lib/workOrderUtils'

export default function WorkOrders() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL')

  const workOrders = useWorkOrdersList()
  const deleteWorkOrder = useWorkOrderStore((state) => state.deleteWorkOrder)
  const updateWorkOrderStatus = useWorkOrderStore((state) => state.updateWorkOrderStatus)

  const filteredWorkOrders = workOrders
    .filter((wo) => {
      if (statusFilter !== 'ALL' && wo.status !== statusFilter) return false
      if (!searchQuery) return true

      const query = searchQuery.toLowerCase()
      return (
        wo.customer?.firstName.toLowerCase().includes(query) ||
        wo.customer?.lastName.toLowerCase().includes(query) ||
        wo.vehicle?.licensePlate.toLowerCase().includes(query) ||
        wo.vehicle?.make.toLowerCase().includes(query) ||
        wo.vehicle?.model.toLowerCase().includes(query) ||
        wo.description.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleDeleteWorkOrder = async (workOrderId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć to zlecenie?')) {
      try {
        await deleteWorkOrder(workOrderId)
      } catch (error) {
        alert('Nie udało się usunąć zlecenia')
      }
    }
  }

  const handleAdvanceStatus = async (workOrderId: string, currentStatus: WorkOrderStatus) => {
    const nextStatus = getNextStatus(currentStatus)
    if (nextStatus) {
      try {
        await updateWorkOrderStatus(workOrderId, nextStatus)
      } catch (error) {
        alert('Nie udało się zaktualizować statusu')
      }
    }
  }

  const statusFilters: Array<{ value: WorkOrderStatus | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'Wszystkie' },
    { value: 'INTAKE', label: 'Przyjęto' },
    { value: 'IN_PROGRESS', label: 'W trakcie' },
    { value: 'READY', label: 'Gotowe' },
    { value: 'DELIVERED', label: 'Wydano' },
    { value: 'COMPLETED', label: 'Zakończone' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zlecenia</h1>
          <p className="text-muted-foreground">
            Zarządzanie zleceniami napraw i przeglądów
          </p>
        </div>
        <Button asChild>
          <Link to="/work-orders/new">
            <Plus className="h-4 w-4 mr-2" />
            Nowe Zlecenie
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Zleceń</CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj po kliencie, pojeździe lub opisie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredWorkOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Nie znaleziono zleceń pasujących do filtrów'
                : 'Brak zleceń. Utwórz pierwsze zlecenie.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klient</TableHead>
                  <TableHead>Pojazd</TableHead>
                  <TableHead>Opis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Koszt</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkOrders.map((workOrder) => {
                  const nextStatus = getNextStatus(workOrder.status)
                  return (
                    <TableRow key={workOrder.id}>
                      <TableCell className="font-medium">
                        {workOrder.customer ? (
                          <Link
                            to={`/customers/${workOrder.customer.id}`}
                            className="text-primary hover:underline"
                          >
                            {workOrder.customer.firstName} {workOrder.customer.lastName}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {workOrder.vehicle
                          ? `${workOrder.vehicle.make} ${workOrder.vehicle.model} (${workOrder.vehicle.licensePlate})`
                          : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {workOrder.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={workOrderStatusColors[workOrder.status]}>
                          {workOrderStatusLabels[workOrder.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(workOrder.totalCost)}</TableCell>
                      <TableCell>
                        {format(new Date(workOrder.createdAt), 'dd MMM yyyy', {
                          locale: pl,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/work-orders/${workOrder.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {nextStatus && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAdvanceStatus(workOrder.id, workOrder.status)}
                              title={`Przenieś do: ${workOrderStatusLabels[nextStatus]}`}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteWorkOrder(workOrder.id)}
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
    </div>
  )
}