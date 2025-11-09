import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit, ChevronRight, Printer } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { WorkOrderForm } from '@/components/workOrders/WorkOrderForm'
import { WorkOrderPrint } from '@/components/workOrders/WorkOrderPrint'
import { useWorkOrderDetails } from '@/hooks'
import { useWorkOrderStore } from '@/stores'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  workOrderStatusLabels,
  workOrderStatusColors,
  formatCurrency,
  getNextStatus,
} from '@/lib/workOrderUtils'

export default function WorkOrderDetail() {
  const { workOrderId } = useParams<{ workOrderId: string }>()
  const navigate = useNavigate()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const workOrderDetails = useWorkOrderDetails(workOrderId!)
  const updateWorkOrderStatus = useWorkOrderStore((state) => state.updateWorkOrderStatus)

  if (!workOrderDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/work-orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Zlecenie nie znalezione</h1>
        </div>
      </div>
    )
  }

  const nextStatus = getNextStatus(workOrderDetails.status)

  const handleAdvanceStatus = async () => {
    if (nextStatus) {
      try {
        await updateWorkOrderStatus(workOrderDetails.id, nextStatus)
      } catch (error) {
        alert('Nie udało się zaktualizować statusu')
      }
    }
  }

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <WorkOrderPrint workOrder={workOrderDetails} />
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/work-orders')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Zlecenie #{workOrderDetails.id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground">
            Utworzono {format(new Date(workOrderDetails.createdAt), 'dd MMMM yyyy', { locale: pl })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrint} title="Drukuj zlecenie">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edytuj
          </Button>
          {nextStatus && (
            <Button onClick={handleAdvanceStatus}>
              {workOrderStatusLabels[nextStatus]}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer & Vehicle Info */}
        <Card>
          <CardHeader>
            <CardTitle>Klient i Pojazd</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Klient</p>
              {workOrderDetails.customer ? (
                <Link
                  to={`/customers/${workOrderDetails.customer.id}`}
                  className="text-lg font-medium text-primary hover:underline"
                >
                  {workOrderDetails.customer.firstName} {workOrderDetails.customer.lastName}
                </Link>
              ) : (
                <p className="text-lg font-medium">-</p>
              )}
              {workOrderDetails.customer?.phone && (
                <p className="text-sm">{workOrderDetails.customer.phone}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Pojazd</p>
              {workOrderDetails.vehicle ? (
                <>
                  <p className="text-lg font-medium">
                    {workOrderDetails.vehicle.make} {workOrderDetails.vehicle.model}
                  </p>
                  <p className="text-sm">
                    {workOrderDetails.vehicle.year} • {workOrderDetails.vehicle.licensePlate}
                  </p>
                  {workOrderDetails.vehicle.vin && (
                    <p className="text-sm text-muted-foreground">VIN: {workOrderDetails.vehicle.vin}</p>
                  )}
                </>
              ) : (
                <p className="text-lg font-medium">-</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status & Costs */}
        <Card>
          <CardHeader>
            <CardTitle>Status i Koszty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={workOrderStatusColors[workOrderDetails.status]} className="mt-1">
                {workOrderStatusLabels[workOrderDetails.status]}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Koszt całkowity</p>
              <p className="text-2xl font-bold">{formatCurrency(workOrderDetails.totalCost)}</p>
            </div>

            {workOrderDetails.estimatedCost !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Szacowany koszt</p>
                <p className="text-lg">{formatCurrency(workOrderDetails.estimatedCost)}</p>
              </div>
            )}

            {workOrderDetails.completedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Data zakończenia</p>
                <p className="text-sm">
                  {format(new Date(workOrderDetails.completedAt), 'dd MMMM yyyy', { locale: pl })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description & Diagnosis */}
      <Card>
        <CardHeader>
          <CardTitle>Opis i Diagnoza</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Opis problemu</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {workOrderDetails.description}
            </p>
          </div>

          {workOrderDetails.diagnosis && (
            <div>
              <p className="text-sm font-medium mb-2">Diagnoza</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {workOrderDetails.diagnosis}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Pozycje zlecenia</CardTitle>
        </CardHeader>
        <CardContent>
          {workOrderDetails.items.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Brak pozycji w zleceniu
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opis</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead className="text-right">Ilość</TableHead>
                    <TableHead className="text-right">Cena jedn.</TableHead>
                    <TableHead className="text-right">Suma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrderDetails.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.type === 'PART' ? 'Część' : 'Robocizna'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end pt-4 border-t mt-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Razem:</p>
                  <p className="text-2xl font-bold">{formatCurrency(workOrderDetails.totalCost)}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogClose onClose={() => setIsEditDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Edytuj Zlecenie</DialogTitle>
          </DialogHeader>
          <WorkOrderForm
            workOrder={workOrderDetails}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      </div>
    </>
  )
}