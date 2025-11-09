# AutoServe - Architecture Document
## Local MVP Web Application

**Agent 1 - The Architect**
**Date**: 2025-09-29
**Version**: 1.0

---

## Architecture Overview

AutoServe is a **local-first, single-page application (SPA)** designed for car service shop owners. The application runs entirely in the browser with no backend dependencies, storing all data locally using IndexedDB.

### Architecture Type
**Local-First Single Page Application (SPA)**

### Key Principles
1. **Local-First**: All data lives in the browser, no cloud dependency
2. **Offline-Capable**: Works without internet connection
3. **Single-User**: No authentication, multi-tenancy, or collaboration features
4. **Zero Backend**: No server-side logic or APIs
5. **Data Ownership**: User has complete control over their data

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │              React Application                     │    │
│  │                                                    │    │
│  │  ┌──────────────┐  ┌──────────────┐             │    │
│  │  │   Dashboard  │  │  Work Orders │             │    │
│  │  │     Page     │  │     Page     │             │    │
│  │  └──────────────┘  └──────────────┘             │    │
│  │  ┌──────────────┐  ┌──────────────┐             │    │
│  │  │   Customers  │  │   Settings   │             │    │
│  │  │     Page     │  │     Page     │             │    │
│  │  └──────────────┘  └──────────────┘             │    │
│  │                                                    │    │
│  │  ┌──────────────────────────────────────────┐   │    │
│  │  │      React Router (Client Routing)       │   │    │
│  │  └──────────────────────────────────────────┘   │    │
│  │                                                    │    │
│  │  ┌──────────────────────────────────────────┐   │    │
│  │  │      Zustand State Management            │   │    │
│  │  │  ┌────────────┐  ┌────────────┐         │   │    │
│  │  │  │ Work Order │  │  Customer  │         │   │    │
│  │  │  │   Store    │  │   Store    │         │   │    │
│  │  │  └────────────┘  └────────────┘         │   │    │
│  │  └──────────────────────────────────────────┘   │    │
│  │                                                    │    │
│  │  ┌──────────────────────────────────────────┐   │    │
│  │  │      Dexie.js (IndexedDB Layer)          │   │    │
│  │  │  ┌────────────┐  ┌────────────┐         │   │    │
│  │  │  │ workOrders │  │ customers  │         │   │    │
│  │  │  │   Table    │  │   Table    │         │   │    │
│  │  │  └────────────┘  └────────────┘         │   │    │
│  │  │  ┌────────────┐                          │   │    │
│  │  │  │  vehicles  │                          │   │    │
│  │  │  │   Table    │                          │   │    │
│  │  │  └────────────┘                          │   │    │
│  │  └──────────────────────────────────────────┘   │    │
│  │                          ↓                       │    │
│  └──────────────────────────────────────────────────┘    │
│                             ↓                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │              IndexedDB Storage                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Layer 1: Presentation Layer (React Components)

**Purpose**: User interface and interaction handling

**Components**:
- **Pages**: Top-level route components (Dashboard, WorkOrders, Customers, Settings)
- **Features**: Complex components (WorkOrderForm, CustomerProfile, InvoiceGenerator)
- **UI Components**: Reusable primitives (Button, Input, Card, Modal) from shadcn/ui
- **Layout**: Navigation, header, sidebar

**Responsibilities**:
- Render UI based on state
- Handle user input
- Dispatch actions to state layer
- Display feedback (loading, errors, success)

---

### Layer 2: State Management Layer (Zustand)

**Purpose**: Application state and business logic

**Stores**:

#### WorkOrderStore
```typescript
interface WorkOrderStore {
  workOrders: WorkOrder[]

  // Actions
  addWorkOrder: (order: WorkOrder) => void
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void
  deleteWorkOrder: (id: string) => void
  getWorkOrderById: (id: string) => WorkOrder | undefined
  getWorkOrdersByCustomer: (customerId: string) => WorkOrder[]
  getWorkOrdersByStatus: (status: WorkOrderStatus) => WorkOrder[]

  // Sync with DB
  loadWorkOrders: () => Promise<void>
  persistWorkOrder: (order: WorkOrder) => Promise<void>
}
```

#### CustomerStore
```typescript
interface CustomerStore {
  customers: Customer[]

  // Actions
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, updates: Partial<Customer>) => void
  deleteCustomer: (id: string) => void
  getCustomerById: (id: string) => Customer | undefined
  searchCustomers: (query: string) => Customer[]

  // Sync with DB
  loadCustomers: () => Promise<void>
  persistCustomer: (customer: Customer) => Promise<void>
}
```

**Responsibilities**:
- Maintain application state
- Provide actions for state mutations
- Coordinate data persistence
- Derive computed values
- Implement business logic

**Persistence Strategy**:
- Zustand middleware auto-persists to IndexedDB
- Optimistic updates (update UI immediately, sync to DB asynchronously)
- Error rollback if DB write fails

---

### Layer 3: Data Access Layer (Dexie.js)

**Purpose**: Abstraction over IndexedDB for data persistence

**Database Schema**:

```typescript
class AutoServeDB extends Dexie {
  customers!: Table<Customer>
  vehicles!: Table<Vehicle>
  workOrders!: Table<WorkOrder>

  constructor() {
    super('AutoServeDB')

    this.version(1).stores({
      customers: 'id, name, phone, email, createdAt',
      vehicles: 'id, customerId, make, model, year, vin, licensePlate',
      workOrders: 'id, workOrderNumber, customerId, vehicleId, status, createdAt, completedAt'
    })
  }
}
```

**Indexes**:
- `customers`: Indexed on id, name, phone, email, createdAt
- `vehicles`: Indexed on id, customerId (for joins)
- `workOrders`: Indexed on id, workOrderNumber, customerId, vehicleId, status, createdAt, completedAt

**Responsibilities**:
- CRUD operations on IndexedDB
- Query optimization
- Schema versioning and migrations
- Transaction management

---

## Data Models

### Customer Entity
```typescript
interface Customer {
  id: string              // UUID
  name: string
  phone: string
  email: string
  address: string
  createdAt: number       // Unix timestamp
  updatedAt: number
}
```

### Vehicle Entity
```typescript
interface Vehicle {
  id: string              // UUID
  customerId: string      // Foreign key
  make: string
  model: string
  year: number
  vin: string
  licensePlate: string
  createdAt: number
  updatedAt: number
}
```

### WorkOrder Entity
```typescript
enum WorkOrderStatus {
  INTAKE = 'intake',
  IN_PROGRESS = 'in_progress',
  READY = 'ready',
  DELIVERED = 'delivered',
  COMPLETED = 'completed'
}

interface LineItem {
  id: string
  type: 'labor' | 'part' | 'fee'
  description: string
  quantity: number
  unitPrice: number
  total: number          // quantity * unitPrice
}

interface WorkOrder {
  id: string
  workOrderNumber: string  // Auto-generated (e.g., "WO-20250929-001")
  customerId: string       // Foreign key
  vehicleId: string        // Foreign key
  status: WorkOrderStatus
  description: string
  lineItems: LineItem[]
  subtotal: number         // Sum of line items
  taxRate: number          // e.g., 0.08 for 8%
  taxAmount: number        // subtotal * taxRate
  total: number            // subtotal + taxAmount
  notes: string
  createdAt: number
  updatedAt: number
  completedAt: number | null
}
```

### Relationships
- Customer → Vehicles (one-to-many)
- Customer → WorkOrders (one-to-many)
- Vehicle → WorkOrders (one-to-many)

---

## Application Flow Patterns

### Pattern 1: Creating a Work Order

```
User fills form
    ↓
Form validation (Zod schema)
    ↓
Submit handler calls store.addWorkOrder()
    ↓
Zustand updates state (optimistic)
    ↓
UI reflects new work order immediately
    ↓
Store calls db.workOrders.add() (async)
    ↓
Success → No action needed
Failure → Rollback state, show error
```

### Pattern 2: Loading Data on App Start

```
App initializes
    ↓
useEffect in App.tsx
    ↓
store.loadCustomers()
store.loadWorkOrders()
    ↓
Fetch from IndexedDB
    ↓
Update Zustand state
    ↓
Components re-render with data
```

### Pattern 3: Search/Filter Operations

```
User types in search box
    ↓
Debounced input handler
    ↓
Call store.searchCustomers(query)
    ↓
Filter in-memory state (fast)
    ↓
Return filtered results
    ↓
Update UI
```

---

## Routing Structure

```
/                          → Dashboard (default)
/work-orders               → Work Orders List
/work-orders/new           → Create Work Order
/work-orders/:id           → View/Edit Work Order
/work-orders/:id/invoice   → Print Invoice
/customers                 → Customers List
/customers/new             → Create Customer
/customers/:id             → View/Edit Customer
/customers/:id/vehicles    → Manage Vehicles
/settings                  → App Settings & Data Management
```

**Route Protection**: None (single-user app)

---

## UI/UX Architecture

### Design System

**Colors** (from specification):
- Primary: `#0C5EAF` (trust, professionalism)
- Surface: `#F2F5F9` (light background)
- Text: `#1B2735` (dark text)
- Accent: `#FFB020` (alerts, actions)

**Typography**:
- Font: Inter or Source Sans Pro
- Headings: 600-700 weight
- Body: 400 weight
- Code/Numbers: 500 weight (monospace for IDs)

**Spacing System** (Tailwind):
- xs: 0.5rem (8px)
- sm: 0.75rem (12px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)

### Layout Pattern

```
┌──────────────────────────────────────────────┐
│              Header / Navigation              │
├──────────────────────────────────────────────┤
│                                              │
│                                              │
│              Main Content Area               │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

**Dashboard Layout** (Split View):
```
┌────────────────────────┬─────────────────────┐
│                        │                     │
│   Active Work Orders   │   Quick Stats       │
│   (Kanban or List)     │   - Revenue         │
│                        │   - Pending Jobs    │
│                        │   - Alerts          │
│                        │                     │
│                        │   Recent Activity   │
│                        │                     │
└────────────────────────┴─────────────────────┘
```

---

## Performance Optimization

### 1. Code Splitting
- Lazy load pages with `React.lazy()`
- Bundle size target: < 500KB gzipped

### 2. Data Virtualization
- Use react-window for large lists (100+ items)
- Only render visible rows

### 3. Memoization
- `React.memo` for expensive components
- `useMemo` for computed values
- `useCallback` for event handlers

### 4. Database Indexing
- Index frequently queried fields
- Use compound indexes for multi-field queries

### 5. Debouncing
- Search inputs debounced (300ms)
- Auto-save debounced (1000ms)

---

## Error Handling Strategy

### Levels
1. **Input Validation**: Zod schemas catch invalid data before submission
2. **Database Errors**: Try-catch on all DB operations, rollback state on failure
3. **UI Feedback**: Toast notifications for errors, success, info
4. **Error Boundaries**: React error boundaries catch component crashes

### Error Types
- **ValidationError**: User input doesn't meet schema requirements
- **DatabaseError**: IndexedDB operation failed (quota exceeded, corruption)
- **NotFoundError**: Entity not found by ID
- **NetworkError**: N/A (no network operations)

### Recovery
- Auto-retry transient DB errors (up to 3 attempts)
- Manual retry button for user-triggered errors
- Data export on critical failure (last resort)

---

## Data Backup & Export

### Export Format: JSON
```json
{
  "version": "1.0",
  "exportDate": "2025-09-29T12:00:00Z",
  "data": {
    "customers": [...],
    "vehicles": [...],
    "workOrders": [...]
  }
}
```

### Import Process
1. Validate JSON schema
2. Check version compatibility
3. Clear existing data (with confirmation)
4. Import in transaction
5. Rollback on error

### Automatic Backup Reminders
- Prompt user every 30 days
- Show banner if no export in 60 days

---

## Security Considerations

### Data Security
- No sensitive data transmission (local-only)
- Input sanitization to prevent XSS
- No eval() or dynamic code execution
- Content Security Policy headers

### Data Privacy
- No telemetry or analytics
- No external API calls
- User owns and controls all data

---

## Testing Strategy

### Unit Tests (Vitest)
- Store actions and state mutations
- Utility functions (date formatting, calculations)
- Zod schemas

### Component Tests (Testing Library)
- Form submissions
- User interactions
- Conditional rendering

### Integration Tests
- Complete workflows (create work order end-to-end)
- Database operations
- Data persistence

### Manual Testing Checklist
- [ ] Create customer and vehicle
- [ ] Create work order with line items
- [ ] Update work order status
- [ ] Generate and print invoice
- [ ] Search customers
- [ ] Export/import data
- [ ] Browser refresh (data persists)
- [ ] Large dataset (1000+ records)

---

## Accessibility (WCAG 2.1 AA)

### Requirements
- [ ] Semantic HTML (headings, landmarks, labels)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus indicators (visible outlines)
- [ ] ARIA labels where needed
- [ ] Color contrast ratios (4.5:1 for text)
- [ ] Alt text for icons
- [ ] Form field labels and error messages

### Keyboard Shortcuts (Planned)
- `Ctrl+N`: New work order
- `Ctrl+K`: Global search
- `Ctrl+S`: Save current form
- `Esc`: Close modal/cancel

---

## Deployment Architecture

### Build Process
```
1. npm run build
    ↓
2. Vite bundles and optimizes
    ↓
3. Output to dist/ folder
    ↓
4. Static HTML, CSS, JS files
```

### Serving Options

**Option A: Local Web Server**
```bash
cd dist
python -m http.server 8000
# Access at http://localhost:8000
```

**Option B: Direct File Access**
- Open `dist/index.html` in browser
- Note: May have issues with routing (use hash routing)

**Option C: Electron Wrapper** (Future)
- Package as native desktop app
- Better offline guarantees
- No browser storage limits

---

## Scalability & Limitations

### Data Capacity
- **IndexedDB Limit**: ~50MB (varies by browser)
- **Estimated Capacity**:
  - 10,000 work orders (~20MB)
  - 5,000 customers (~5MB)
  - 10,000 vehicles (~10MB)
  - Total: ~35MB (with headroom)

### Performance Thresholds
- 1,000 work orders: No optimization needed
- 5,000 work orders: Enable pagination, virtualization
- 10,000+ work orders: Implement data archiving

### Workarounds for Limits
- Archive old work orders (move to separate DB or export)
- Compress exported data
- Warn user at 80% capacity

---

## Future Architecture Considerations

### Phase 2: Multi-Device Sync
- Add CouchDB/PouchDB for replication
- Conflict resolution strategy
- Keep local-first principle

### Phase 3: Multi-User
- Add authentication layer
- Role-based access control
- Real-time collaboration (optional)

### Phase 4: Mobile Apps
- React Native with shared business logic
- Same local-first architecture
- Offline-first sync

---

## Decision Log

### Architectural Decisions

#### AD-001: Local-First Architecture
- **Date**: 2025-09-29
- **Decision**: Store all data in IndexedDB, no backend
- **Rationale**: User requirement for data control, offline capability, simplicity
- **Trade-offs**: No multi-device sync, browser storage limits

#### AD-002: SPA with Client-Side Routing
- **Date**: 2025-09-29
- **Decision**: Use React Router for navigation
- **Rationale**: Better UX (no page reloads), fits SPA model
- **Trade-offs**: SEO irrelevant (not a public site), slightly larger initial bundle

#### AD-003: Zustand for State Management
- **Date**: 2025-09-29
- **Decision**: Zustand over Redux/Context
- **Rationale**: Simpler API, less boilerplate, built-in persistence
- **Trade-offs**: Smaller community than Redux, but adequate for this scale

#### AD-004: Optimistic UI Updates
- **Date**: 2025-09-29
- **Decision**: Update UI before DB confirmation
- **Rationale**: Better perceived performance, DB writes rarely fail
- **Trade-offs**: Need rollback logic for failed writes

---

## Agent Handoff: Instructions for Agent 2 (Builder)

### Pre-Implementation Checklist
- [x] Requirements defined (REQUIREMENTS.md)
- [x] Technology stack decided (TECHNOLOGY_STACK.md)
- [x] Architecture documented (this file)
- [ ] Project initialized (Agent 2)
- [ ] Core dependencies installed (Agent 2)

### Implementation Order (Recommended)

**Sprint 1: Foundation**
1. Initialize Vite + React + TypeScript project
2. Configure Tailwind CSS
3. Install and configure shadcn/ui
4. Set up basic routing (React Router)
5. Create layout components (Header, Navigation)

**Sprint 2: Data Layer**
6. Set up Dexie.js database schema
7. Create TypeScript types for entities
8. Implement Zustand stores (Customer, WorkOrder)
9. Write unit tests for stores

**Sprint 3: Customer Management**
10. Create customer list page
11. Implement customer form (add/edit)
12. Add vehicle management UI
13. Implement search/filter

**Sprint 4: Work Order Management**
14. Create work order list page
15. Implement work order form with line items
16. Add status workflow UI
17. Build invoice generation

**Sprint 5: Dashboard & Polish**
18. Build dashboard with stats
19. Implement data export/import
20. Add keyboard shortcuts
21. Polish UI/UX

### Critical Paths
- Database schema must be finalized before building stores
- Customer/Vehicle entities before Work Orders (dependencies)
- Forms with validation before complex workflows

### Testing Requirements (Agent 3)
- Unit tests for all store actions
- Component tests for forms
- Integration test for full work order workflow
- Manual testing on real data (100+ records)

---

## Appendix: Code Examples

### Example: Zustand Store with Persistence

```typescript
// src/store/workOrderStore.ts
import create from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '../lib/db'

interface WorkOrderStore {
  workOrders: WorkOrder[]
  addWorkOrder: (order: WorkOrder) => Promise<void>
  // ... other actions
}

export const useWorkOrderStore = create<WorkOrderStore>()(
  persist(
    (set, get) => ({
      workOrders: [],

      addWorkOrder: async (order) => {
        // Optimistic update
        set(state => ({
          workOrders: [...state.workOrders, order]
        }))

        try {
          await db.workOrders.add(order)
        } catch (error) {
          // Rollback on failure
          set(state => ({
            workOrders: state.workOrders.filter(wo => wo.id !== order.id)
          }))
          throw error
        }
      }
    }),
    { name: 'workOrder-storage' }
  )
)
```

### Example: Dexie Database Setup

```typescript
// src/lib/db.ts
import Dexie, { Table } from 'dexie'

class AutoServeDB extends Dexie {
  customers!: Table<Customer>
  vehicles!: Table<Vehicle>
  workOrders!: Table<WorkOrder>

  constructor() {
    super('AutoServeDB')

    this.version(1).stores({
      customers: 'id, name, phone, email, createdAt',
      vehicles: 'id, customerId, make, model, year',
      workOrders: 'id, workOrderNumber, customerId, status, createdAt'
    })
  }
}

export const db = new AutoServeDB()
```

---

**Document Status**: ✅ Complete and ready for implementation
**Next Action**: Agent 2 to begin Sprint 1 (Foundation)