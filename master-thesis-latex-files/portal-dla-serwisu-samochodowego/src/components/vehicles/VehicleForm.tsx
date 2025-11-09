import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useVehicleStore, useCustomerStore } from '@/stores'
import type { Vehicle } from '@/types'

const vehicleSchema = z.object({
  customerId: z.string().min(1, 'Wybierz klienta'),
  make: z.string().min(2, 'Marka musi mieć co najmniej 2 znaki'),
  model: z.string().min(1, 'Model jest wymagany'),
  year: z.number().min(1900, 'Rok musi być większy niż 1900').max(new Date().getFullYear() + 1),
  licensePlate: z.string().min(2, 'Numer rejestracyjny jest wymagany'),
  vin: z.string().optional().or(z.literal('')),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

interface VehicleFormProps {
  vehicle?: Vehicle
  preselectedCustomerId?: string
  onSuccess: () => void
  onCancel: () => void
}

export function VehicleForm({ vehicle, preselectedCustomerId, onSuccess, onCancel }: VehicleFormProps) {
  const addVehicle = useVehicleStore((state) => state.addVehicle)
  const updateVehicle = useVehicleStore((state) => state.updateVehicle)
  const customers = useCustomerStore((state) => state.customers)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle
      ? {
          customerId: vehicle.customerId,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          licensePlate: vehicle.licensePlate,
          vin: vehicle.vin || '',
        }
      : preselectedCustomerId
      ? { customerId: preselectedCustomerId }
      : undefined,
  })

  const onSubmit = async (data: VehicleFormData) => {
    try {
      if (vehicle) {
        await updateVehicle(vehicle.id, {
          ...data,
          vin: data.vin || undefined,
        })
      } else {
        await addVehicle({
          ...data,
          vin: data.vin || undefined,
        })
      }
      onSuccess()
    } catch (error) {
      console.error('Failed to save vehicle:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customerId">Klient *</Label>
        <Select
          id="customerId"
          {...register('customerId')}
          disabled={!!vehicle || !!preselectedCustomerId}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="make">Marka *</Label>
          <Input
            id="make"
            {...register('make')}
            placeholder="Toyota"
          />
          {errors.make && (
            <p className="text-sm text-destructive">{errors.make.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model *</Label>
          <Input
            id="model"
            {...register('model')}
            placeholder="Corolla"
          />
          {errors.model && (
            <p className="text-sm text-destructive">{errors.model.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Rok produkcji *</Label>
          <Input
            id="year"
            {...register('year', { valueAsNumber: true })}
            placeholder="2020"
            type="number"
          />
          {errors.year && (
            <p className="text-sm text-destructive">{errors.year.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="licensePlate">Numer rejestracyjny *</Label>
          <Input
            id="licensePlate"
            {...register('licensePlate')}
            placeholder="ABC 1234"
          />
          {errors.licensePlate && (
            <p className="text-sm text-destructive">{errors.licensePlate.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vin">VIN</Label>
        <Input
          id="vin"
          {...register('vin')}
          placeholder="1HGBH41JXMN109186"
        />
        {errors.vin && (
          <p className="text-sm text-destructive">{errors.vin.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Anuluj
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Zapisywanie...' : vehicle ? 'Zaktualizuj' : 'Dodaj'}
        </Button>
      </div>
    </form>
  )
}