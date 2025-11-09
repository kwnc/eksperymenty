import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkOrderForm } from '@/components/workOrders/WorkOrderForm'

export default function WorkOrderNew() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate('/work-orders')
  }

  const handleCancel = () => {
    navigate('/work-orders')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/work-orders')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nowe Zlecenie</h1>
          <p className="text-muted-foreground">
            Utwórz nowe zlecenie naprawy lub przeglądu
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Szczegóły zlecenia</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkOrderForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </CardContent>
      </Card>
    </div>
  )
}