import { Store } from '@tanstack/react-store'

export interface DashboardState {
  searchQuery: string
  selectedCategory: string
  stockFilter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'
  isCreateModalOpen: boolean
}

export const dashboardStore = new Store<DashboardState>({
  searchQuery: '',
  selectedCategory: 'All',
  stockFilter: 'all',
  isCreateModalOpen: false
})

export const updateSearchQuery = (query: string) => {
  dashboardStore.setState((state) => ({ ...state, searchQuery: query }))
}

export const updateCategory = (category: string) => {
  dashboardStore.setState((state) => ({ ...state, selectedCategory: category }))
}

export const updateStockFilter = (filter: DashboardState['stockFilter']) => {
  dashboardStore.setState((state) => ({ ...state, stockFilter: filter }))
}

export const toggleCreateModal = (isOpen: boolean) => {
  dashboardStore.setState((state) => ({ ...state, isCreateModalOpen: isOpen }))
}

// Storefront Customer Cart State
export interface CartItem {
  id: string // product.id + options combination
  productId: string
  name: string
  price: number
  quantity: number
  options: Record<string, string>
}

export interface CartState {
  items: CartItem[]
}

/**
 * Pure helper function to compute subtotal, VAT, shipping cost, and final checkout totals.
 * Consolidated here to maintain strict DRY compliance across cart and checkout page renderers.
 */
export function calculateCartTotals(items: CartItem[]) {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const shipping = subtotal > 500 || subtotal === 0 ? 0 : 35
  const vat = Math.round(subtotal * 0.2)
  return {
    subtotal,
    shipping,
    vat,
    total: subtotal + shipping + vat
  }
}

const isBrowser = typeof window !== 'undefined'

/**
 * Retrieves the initial shopping cart state from localStorage.
 * This is guarded with isBrowser checks to prevent server-side rendering (SSR) execution
 * errors or hydration mismatch crashes during TanStack Start pre-rendering.
 */
function getInitialCartState(): CartState {
  if (!isBrowser) return { items: [] }
  try {
    const stored = window.localStorage.getItem('dstrkt_cart')
    return stored ? JSON.parse(stored) : { items: [] }
  } catch (e) {
    return { items: [] }
  }
}

export const cartStore = new Store<CartState>(getInitialCartState())

function saveCartState(state: CartState) {
  if (isBrowser) {
    try {
      window.localStorage.setItem('dstrkt_cart', JSON.stringify(state))
    } catch (e) {
      // ignore
    }
  }
}

export const addToCart = (
  productId: string,
  name: string,
  price: number,
  quantity: number,
  options: Record<string, string>
) => {
  const validatedQty = Math.max(1, Math.floor(quantity))
  const validatedPrice = Math.max(0.01, price)

  cartStore.setState((state) => {
    const optionKey = Object.entries(options)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${k}:${v}`)
      .join('|')
    const id = optionKey ? `${productId}-${optionKey}` : productId

    const existingIndex = state.items.findIndex((item) => item.id === id)
    const nextItems = [...state.items]

    if (existingIndex > -1) {
      nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        quantity: nextItems[existingIndex].quantity + validatedQty
      }
    } else {
      nextItems.push({ id, productId, name, price: validatedPrice, quantity: validatedQty, options })
    }

    const nextState = { ...state, items: nextItems }
    saveCartState(nextState)
    return nextState
  })
}

export const removeFromCart = (id: string) => {
  cartStore.setState((state) => {
    const nextState = {
      ...state,
      items: state.items.filter((item) => item.id !== id)
    }
    saveCartState(nextState)
    return nextState
  })
}

export const updateCartQuantity = (id: string, quantity: number) => {
  cartStore.setState((state) => {
    const nextState = {
      ...state,
      items: state.items.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    }
    saveCartState(nextState)
    return nextState
  })
}

export const clearCart = () => {
  cartStore.setState(() => {
    const nextState = { items: [] }
    saveCartState(nextState)
    return nextState
  })
}

// -------------------------------------------------------------
// Storefront Shopper Order History & Tracking State
// -------------------------------------------------------------
export interface TrackedOrder {
  id: string
  email: string
  fullName: string
  shippingAddress: string
  walletId: string
  items: CartItem[]
  subtotal: number
  shipping: number
  vat: number
  total: number
  status: 'QUEUED FOR ROUTING' | 'INTEGRATING FABRIC' | 'OUT FOR DELIVERY' | 'NODE DELIVERED'
  placedAt: string
  telemetryLogs: string[]
}

export interface OrdersState {
  orders: TrackedOrder[]
}

const mockOrders: TrackedOrder[] = [
  {
    id: 'DSTRKT-ORD-FF89',
    email: 'operative_099@domain.com',
    fullName: 'ALEX CHEN',
    shippingAddress: 'GRID-SECTOR 4B, NEOMETROPOLIS',
    walletId: '0x71C2B9e3d99FF817a0fE37C0DEb72Cd9Eef98F09',
    items: [
      { id: '1', productId: '1', name: 'DSTRKT-01 Ghost Shell Jacket', price: 380, quantity: 1, options: { Size: 'M', Color: 'Stealth Black' } }
    ],
    subtotal: 380,
    shipping: 0,
    vat: 76,
    total: 456,
    status: 'INTEGRATING FABRIC',
    placedAt: '2026-07-05T14:32:00.000Z',
    telemetryLogs: [
      'SECURE TELEMETRY TRANSACTION ROUTED',
      'DEBIT CONFIRMED SECURE CLEARING NODE',
      'GHOST SHELL FABRIC TEXTURE RE-ALIGNMENT IN PROGRESS',
      'QUEUE REGISTERED IN SHREDDING DEPT'
    ]
  }
]

function getInitialOrdersState(): OrdersState {
  if (!isBrowser) return { orders: [] }
  try {
    const stored = window.localStorage.getItem('dstrkt_orders')
    return stored ? JSON.parse(stored) : { orders: mockOrders }
  } catch (e) {
    return { orders: mockOrders }
  }
}

export const ordersStore = new Store<OrdersState>(getInitialOrdersState())

function saveOrdersState(state: OrdersState) {
  if (isBrowser) {
    try {
      window.localStorage.setItem('dstrkt_orders', JSON.stringify(state))
    } catch (e) {
      // ignore
    }
  }
}

export const addOrder = (order: TrackedOrder) => {
  ordersStore.setState((state) => {
    const nextState = {
      ...state,
      orders: [order, ...state.orders]
    }
    saveOrdersState(nextState)
    return nextState
  })
}


