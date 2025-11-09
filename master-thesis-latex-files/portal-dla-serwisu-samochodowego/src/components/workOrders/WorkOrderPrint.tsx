import type { WorkOrderDetails } from '@/hooks'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { workOrderStatusLabels, formatCurrency } from '@/lib/workOrderUtils'

interface WorkOrderPrintProps {
  workOrder: WorkOrderDetails
}

export function WorkOrderPrint({ workOrder }: WorkOrderPrintProps) {
  return (
    <div className="print:block hidden">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-content, #print-content * {
            visibility: visible;
          }
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
        }
      `}</style>

      <div id="print-content" className="max-w-4xl mx-auto p-8 bg-white text-black">
        {/* Header */}
        <div className="border-b-2 border-gray-900 pb-4 mb-6">
          <h1 className="text-3xl font-bold">AutoServe</h1>
          <p className="text-sm text-gray-600">Portal dla Serwisu Samochodowego</p>
        </div>

        {/* Work Order Info */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Zlecenie #{workOrder.id.slice(0, 8)}</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Data utworzenia:</span>{' '}
                {format(new Date(workOrder.createdAt), 'dd MMMM yyyy', { locale: pl })}
              </div>
              <div>
                <span className="font-medium">Status:</span> {workOrderStatusLabels[workOrder.status]}
              </div>
              {workOrder.completedAt && (
                <div>
                  <span className="font-medium">Data zakończenia:</span>{' '}
                  {format(new Date(workOrder.completedAt), 'dd MMMM yyyy', { locale: pl })}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2">Klient</h3>
            <div className="text-sm space-y-1">
              {workOrder.customer && (
                <>
                  <div>{workOrder.customer.firstName} {workOrder.customer.lastName}</div>
                  <div>{workOrder.customer.phone}</div>
                  {workOrder.customer.email && <div>{workOrder.customer.email}</div>}
                </>
              )}
            </div>

            <h3 className="font-bold mt-4 mb-2">Pojazd</h3>
            <div className="text-sm space-y-1">
              {workOrder.vehicle && (
                <>
                  <div>{workOrder.vehicle.make} {workOrder.vehicle.model}</div>
                  <div>Rok: {workOrder.vehicle.year}</div>
                  <div>Rejestracja: {workOrder.vehicle.licensePlate}</div>
                  {workOrder.vehicle.vin && <div>VIN: {workOrder.vehicle.vin}</div>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">Opis problemu</h3>
          <p className="text-sm whitespace-pre-wrap border border-gray-300 p-3 rounded">
            {workOrder.description}
          </p>
        </div>

        {/* Diagnosis */}
        {workOrder.diagnosis && (
          <div className="mb-6">
            <h3 className="font-bold mb-2">Diagnoza</h3>
            <p className="text-sm whitespace-pre-wrap border border-gray-300 p-3 rounded">
              {workOrder.diagnosis}
            </p>
          </div>
        )}

        {/* Line Items */}
        <div className="mb-6">
          <h3 className="font-bold mb-3">Pozycje zlecenia</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-2">Opis</th>
                <th className="text-center py-2">Typ</th>
                <th className="text-right py-2">Ilość</th>
                <th className="text-right py-2">Cena jedn.</th>
                <th className="text-right py-2">Suma</th>
              </tr>
            </thead>
            <tbody>
              {workOrder.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="py-2">{item.description}</td>
                  <td className="text-center py-2">{item.type === 'PART' ? 'Część' : 'Robocizna'}</td>
                  <td className="text-right py-2">{item.quantity}</td>
                  <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                  <td className="text-right py-2 font-medium">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-900">
                <td colSpan={4} className="text-right py-3 font-bold">Razem:</td>
                <td className="text-right py-3 font-bold text-lg">
                  {formatCurrency(workOrder.totalCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-300 text-xs text-gray-600">
          <p>Dokument wygenerowany: {format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: pl })}</p>
          <p className="mt-2">AutoServe - System zarządzania serwisem samochodowym</p>
        </div>
      </div>
    </div>
  )
}