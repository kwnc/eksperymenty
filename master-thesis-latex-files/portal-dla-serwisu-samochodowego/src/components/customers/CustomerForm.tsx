import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCustomerStore } from '@/stores'
import type { Customer } from '@/types'

const customerSchema = z.object({
  firstName: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki'),
  lastName: z.string().min(2, 'Nazwisko musi mieć co najmniej 2 znaki'),
  phone: z.string().min(9, 'Numer telefonu musi mieć co najmniej 9 cyfr'),
  email: z.string().email('Nieprawidłowy adres email').optional().or(z.literal('')),
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerFormProps {
  customer?: Customer
  onSuccess: () => void
  onCancel: () => void
}

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const addCustomer = useCustomerStore((state) => state.addCustomer)
  const updateCustomer = useCustomerStore((state) => state.updateCustomer)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? {
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          email: customer.email || '',
        }
      : undefined,
  })

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (customer) {
        await updateCustomer(customer.id, {
          ...data,
          email: data.email || undefined,
        })
      } else {
        await addCustomer({
          ...data,
          email: data.email || undefined,
        })
      }
      onSuccess()
    } catch (error) {
      console.error('Failed to save customer:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Imię *</Label>
          <Input
            id="firstName"
            {...register('firstName')}
            placeholder="Jan"
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Nazwisko *</Label>
          <Input
            id="lastName"
            {...register('lastName')}
            placeholder="Kowalski"
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefon *</Label>
        <Input
          id="phone"
          {...register('phone')}
          placeholder="123456789"
          type="tel"
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          {...register('email')}
          placeholder="jan.kowalski@example.com"
          type="email"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Anuluj
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Zapisywanie...' : customer ? 'Zaktualizuj' : 'Dodaj'}
        </Button>
      </div>
    </form>
  )
}