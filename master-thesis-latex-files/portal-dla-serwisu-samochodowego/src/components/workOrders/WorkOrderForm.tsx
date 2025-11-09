import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkOrderStore, useCustomerStore, useVehicleStore } from '@/stores'
import type { WorkOrder, WorkOrderItem } from '@/types'
import { formatCurrency } from '@/lib/workOrderUtils'

const workOrderSchema = z.object({
  customerId: z.string().min(1, 'Wybierz klienta'),
  vehicleId: z.string().min(1, 'Wybierz pojazd'),
  description: z.string().min(10, 'Opis musi mieć co najmniej 10 znaków'),
  diagnosis: z.string().optional().or(z.literal('')),
  estimatedCost: z.number().optional(),
})

type WorkOrderFormData = z.infer<typeof workOrderSchema>

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  type: 'LABOR' | 'PART'
}

interface WorkOrderFormProps {
  workOrder?: WorkOrder & { items: WorkOrderItem[] }
  onSuccess: () => void
  onCancel: () => void
}

export function WorkOrderForm({ workOrder, onSuccess, onCancel }: WorkOrderFormProps) {
  const addWorkOrder = useWorkOrderStore((state) => state.addWorkOrder)
  const updateWorkOrder = useWorkOrderStore((state) => state.updateWorkOrder)
  const addWorkOrderItem = useWorkOrderStore((state) => state.addWorkOrderItem)
  const updateWorkOrderItem = useWorkOrderStore((state) => state.updateWorkOrderItem)
  const deleteWorkOrderItem = useWorkOrderStore((state) => state.deleteWorkOrderItem)

  const customers = useCustomerStore((state) => state.customers)
  const vehicles = useVehicleStore((state) => state.vehicles)

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    workOrder?.customerId || ''
  )
  const [lineItems, setLineItems] = useState<LineItem[]>(
    workOrder?.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      type: item.type,
    })) || []
  )

  const customerVehicles = vehicles.filter((v) => v.customerId === selectedCustomerId)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: workOrder
      ? {
          customerId: workOrder.customerId,
          vehicleId: workOrder.vehicleId,
          description: workOrder.description,
          diagnosis: workOrder.diagnosis || '',
          estimatedCost: workOrder.estimatedCost,
        }
      : undefined,
  })

  const watchCustomerId = watch('customerId')

  useEffect(() => {
    setSelectedCustomerId(watchCustomerId)
    if (watchCustomerId && !workOrder) {
      setValue('vehicleId', '')
    }
  }, [watchCustomerId, setValue, workOrder])

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: '', quantity: 1, unitPrice: 0, type: 'PART' },
    ])
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  const onSubmit = async (data: WorkOrderFormData) => {
    try {
      if (workOrder) {
        // Update existing work order
        await updateWorkOrder(workOrder.id, {
          ...data,
          diagnosis: data.diagnosis || undefined,
        })

        // Update line items
        const existingItemIds = workOrder.items.map(item => item.id)
        const currentItems = lineItems

        // Delete removed items
        for (const itemId of existingItemIds) {
          const stillExists = workOrder.items.find(item => item.id === itemId)
          if (stillExists && !currentItems.find((_, i) => workOrder.items[i]?.id === itemId)) {
            await deleteWorkOrderItem(itemId)
          }
        }

        // Update or add items
        for (let i = 0; i < currentItems.length; i++) {
          const item = currentItems[i]
          const existingItem = workOrder.items[i]

          if (existingItem) {
            await updateWorkOrderItem(existingItem.id, {
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              type: item.type,
            })
          } else {
            await addWorkOrderItem({
              workOrderId: workOrder.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              type: item.type,
            })
          }
        }
      } else {
        // Create new work order
        const newWorkOrder = await addWorkOrder({
          customerId: data.customerId,
          vehicleId: data.vehicleId,
          status: 'INTAKE',
          description: data.description,
          diagnosis: data.diagnosis || undefined,
          estimatedCost: data.estimatedCost,
        })

        // Add line items
        for (const item of lineItems) {
          await addWorkOrderItem({
            workOrderId: newWorkOrder.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            type: item.type,
          })
        }
      }

      onSuccess()
    } catch (error) {
      console.error('Failed to save work order:', error)
      alert('Nie udało się zapisać zlecenia')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Customer and Vehicle Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerId">Klient *</Label>
          <Select
            id="customerId"
            {...register('customerId')}
            disabled={!!workOrder}
          >
            <option value="">Wybierz klienta</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.firstName} {customer.lastName}
              </option>
            ))}
          </Select>
          {errors.customerId && (
            <p className="text-sm text-destructive">{errors.customerId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicleId">Pojazd *</Label>
          <Select
            id="vehicleId"
            {...register('vehicleId')}
            disabled={!selectedCustomerId || !!workOrder}
          >
            <option value="">Wybierz pojazd</option>
            {customerVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
              </option>
            ))}
          </Select>
          {errors.vehicleId && (
            <p className="text-sm text-destructive">{errors.vehicleId.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Opis problemu *</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Opisz problem zgłoszony przez klienta..."
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Diagnosis */}
      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnoza</Label>
        <Textarea
          id="diagnosis"
          {...register('diagnosis')}
          placeholder="Diagnoza techniczna (opcjonalnie)..."
          rows={3}
        />
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pozycje zlecenia</span>
            <Button type="button" size="sm" onClick={addLineItem}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj pozycję
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Brak pozycji. Dodaj części lub robociznę.
            </p>
          ) : (
            lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-5">
                  <Input
                    placeholder="Opis"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Select
                    value={item.type}
                    onChange={(e) => updateLineItem(index, 'type', e.target.value as 'LABOR' | 'PART')}
                  >
                    <option value="PART">Część</option>
                    <option value="LABOR">Robocizna</option>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Ilość"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Cena"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}

          {lineItems.length > 0 && (
            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Suma:</p>
                <p className="text-2xl font-bold">{formatCurrency(calculateTotal())}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Anuluj
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Zapisywanie...' : workOrder ? 'Zaktualizuj' : 'Utwórz zlecenie'}
        </Button>
      </div>
    </form>
  )
}