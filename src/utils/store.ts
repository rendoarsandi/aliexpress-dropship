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
