import { describe, test, expect, beforeEach } from 'vitest'
import {
  dashboardStore,
  updateSearchQuery,
  updateCategory,
  updateStockFilter,
  toggleCreateModal
} from './store'
import { initialItems, filterSpecimens } from './clientDb'

describe('DSTRKT Global Dashboard Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    dashboardStore.setState(() => ({
      searchQuery: '',
      selectedCategory: 'All',
      stockFilter: 'all',
      isCreateModalOpen: false
    }))
  })

  test('should initialize with correct default values', () => {
    const state = dashboardStore.state
    expect(state.searchQuery).toBe('')
    expect(state.selectedCategory).toBe('All')
    expect(state.stockFilter).toBe('all')
    expect(state.isCreateModalOpen).toBe(false)
  })

  test('should update search query correctly', () => {
    updateSearchQuery('Ghost Shell')
    expect(dashboardStore.state.searchQuery).toBe('Ghost Shell')
  })

  test('should update selected category correctly', () => {
    updateCategory('Jackets')
    expect(dashboardStore.state.selectedCategory).toBe('Jackets')
  })

  test('should update stock filter correctly', () => {
    updateStockFilter('low-stock')
    expect(dashboardStore.state.stockFilter).toBe('low-stock')
  })

  test('should toggle create modal open and closed state', () => {
    toggleCreateModal(true)
    expect(dashboardStore.state.isCreateModalOpen).toBe(true)

    toggleCreateModal(false)
    expect(dashboardStore.state.isCreateModalOpen).toBe(false)
  })

  test('should filter database items correctly using store state parameters', () => {
    // 1. Filter by search query "Ghost"
    const searchFiltered = filterSpecimens(initialItems, 'Ghost', 'All', 'all')
    expect(searchFiltered.length).toBe(1)
    expect(searchFiltered[0].name).toBe('DSTRKT-01 Ghost Shell Jacket')

    // 2. Filter by category "Pants"
    const categoryFiltered = filterSpecimens(initialItems, '', 'Pants', 'all')
    expect(categoryFiltered.length).toBe(1)
    expect(categoryFiltered[0].name).toBe('M-06 Cybernetic Cargo Pants')

    // 3. Filter by stock level "low-stock" (1-5 units)
    const stockFiltered = filterSpecimens(initialItems, '', 'All', 'low-stock')
    expect(stockFiltered.length).toBe(1) // M-06 Cybernetic Cargo Pants has 4 units
    expect(stockFiltered[0].name).toBe('M-06 Cybernetic Cargo Pants')
  })
})

