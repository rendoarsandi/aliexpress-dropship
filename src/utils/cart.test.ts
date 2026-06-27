import { describe, test, expect, beforeEach } from 'vitest'
import {
  cartStore,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  calculateCartTotals
} from './store'
import { techWearCollection } from './clientDb'

describe('DSTRKT Shopping Cart Store & Operations', () => {
  beforeEach(() => {
    // Clear cart store state before each test
    clearCart()
  })

  test('should initialize with an empty cart state', () => {
    const state = cartStore.state
    expect(state.items).toEqual([])
  })

  test('should add items to cart correctly', () => {
    addToCart('1', 'DSTRKT-01 Ghost Shell Jacket', 380, 1, { Size: 'M', Color: 'Stealth Black' })
    
    const state = cartStore.state
    expect(state.items.length).toBe(1)
    expect(state.items[0]).toEqual({
      id: '1-Color:Stealth Black|Size:M',
      productId: '1',
      name: 'DSTRKT-01 Ghost Shell Jacket',
      price: 380,
      quantity: 1,
      options: { Size: 'M', Color: 'Stealth Black' }
    })
  })

  test('should aggregate quantities for identical items and options', () => {
    addToCart('1', 'DSTRKT-01 Ghost Shell Jacket', 380, 1, { Size: 'M', Color: 'Stealth Black' })
    addToCart('1', 'DSTRKT-01 Ghost Shell Jacket', 380, 2, { Size: 'M', Color: 'Stealth Black' })

    const state = cartStore.state
    expect(state.items.length).toBe(1)
    expect(state.items[0].quantity).toBe(3)
  })

  test('should keep unique entries for different option selections', () => {
    addToCart('1', 'DSTRKT-01 Ghost Shell Jacket', 380, 1, { Size: 'M', Color: 'Stealth Black' })
    addToCart('1', 'DSTRKT-01 Ghost Shell Jacket', 380, 1, { Size: 'L', Color: 'Stealth Black' })

    const state = cartStore.state
    expect(state.items.length).toBe(2)
    expect(state.items[0].id).not.toBe(state.items[1].id)
  })

  test('should update item quantities correctly', () => {
    addToCart('1', 'DSTRKT-01 Ghost Shell Jacket', 380, 1, { Size: 'M', Color: 'Stealth Black' })
    const itemKey = cartStore.state.items[0].id

    updateCartQuantity(itemKey, 5)
    expect(cartStore.state.items[0].quantity).toBe(5)

    // Ensure quantity never falls below 1
    updateCartQuantity(itemKey, 0)
    expect(cartStore.state.items[0].quantity).toBe(1)
  })

  test('should remove items from the cart', () => {
    addToCart('1', 'DSTRKT-01 Ghost Shell Jacket', 380, 1, { Size: 'M', Color: 'Stealth Black' })
    const itemKey = cartStore.state.items[0].id

    removeFromCart(itemKey)
    expect(cartStore.state.items.length).toBe(0)
  })

  test('should clear the cart entirely', () => {
    addToCart('1', 'DSTRKT-01 Ghost Shell Jacket', 380, 1, { Size: 'M', Color: 'Stealth Black' })
    addToCart('2', 'M-06 Cybernetic Pants', 240, 1, { Size: '32' })

    expect(cartStore.state.items.length).toBe(2)
    clearCart()
    expect(cartStore.state.items.length).toBe(0)
  })

  test('should successfully deduct inventory in TanStack DB collection during checkout simulation', () => {
    // Look up current stock of jacket (id: 1)
    const initialItem = techWearCollection.get('1')
    expect(initialItem).toBeDefined()
    const originalStock = initialItem!.stock // e.g. 12

    // Add to cart and run inventory reduction emulation
    addToCart('1', 'DSTRKT-01 Ghost Shell Jacket', 380, 3, { Size: 'M', Color: 'Stealth Black' })
    
    // Simulating checkout order placement
    cartStore.state.items.forEach((cartItem) => {
      techWearCollection.update(cartItem.productId, (item) => {
        item.stock = Math.max(0, item.stock - cartItem.quantity)
        item.status = item.stock > 5 ? 'In Stock' : item.stock > 0 ? 'Low Stock' : 'Out of Stock'
      })
    })

    const updatedItem = techWearCollection.get('1')
    expect(updatedItem!.stock).toBe(originalStock - 3)
    expect(updatedItem!.status).toBe('In Stock')
  })

  test('should compute correct totals via calculateCartTotals pure helper', () => {
    const items = [
      { id: '1', productId: '1', name: 'Product 1', price: 100, quantity: 2, options: {} },
      { id: '2', productId: '2', name: 'Product 2', price: 50, quantity: 1, options: {} }
    ]
    const totalsUnderThreshold = calculateCartTotals(items)
    // subtotal = 250, vat = 50, shipping = 35, total = 335
    expect(totalsUnderThreshold.subtotal).toBe(250)
    expect(totalsUnderThreshold.shipping).toBe(35)
    expect(totalsUnderThreshold.vat).toBe(50)
    expect(totalsUnderThreshold.total).toBe(335)

    const expensiveItems = [
      { id: '1', productId: '1', name: 'Expensive 1', price: 600, quantity: 1, options: {} }
    ]
    const totalsOverThreshold = calculateCartTotals(expensiveItems)
    // subtotal = 600, vat = 120, shipping = 0, total = 720
    expect(totalsOverThreshold.subtotal).toBe(600)
    expect(totalsOverThreshold.shipping).toBe(0)
    expect(totalsOverThreshold.vat).toBe(120)
    expect(totalsOverThreshold.total).toBe(720)
  })

  test('should validate and clamp input parameters on addToCart mutation', () => {
    // Attempting to add negative price and quantity items to state
    addToCart('1', 'DSTRKT-01 Ghost Shell Jacket', -100, -5, { Size: 'M' })
    const state = cartStore.state
    expect(state.items.length).toBe(1)
    // Quantity clamped to 1, price clamped to 0.01 (minimum safe price)
    expect(state.items[0].quantity).toBe(1)
    expect(state.items[0].price).toBe(0.01)
  })
})
