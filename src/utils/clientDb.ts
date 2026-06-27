import { createCollection, localOnlyCollectionOptions } from '@tanstack/react-db'

export interface TechWearItem {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: 'In Stock' | 'Low Stock' | 'Out of Stock'
}

export const initialItems: TechWearItem[] = [
  { id: '1', name: 'DSTRKT-01 Ghost Shell Jacket', category: 'Jackets', price: 380, stock: 12, status: 'In Stock' },
  { id: '2', name: 'M-06 Cybernetic Cargo Pants', category: 'Pants', price: 240, stock: 4, status: 'Low Stock' },
  { id: '3', name: 'V-09 Tactical Chest Rig', category: 'Accessories', price: 150, stock: 0, status: 'Out of Stock' },
  { id: '4', name: 'N-02 Thermal Base Layer', category: 'Underwear', price: 90, stock: 25, status: 'In Stock' },
  { id: '5', name: 'S-04 All-Weather Boots', category: 'Footwear', price: 310, stock: 8, status: 'In Stock' }
]

export const techWearCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (item: TechWearItem) => item.id,
  })
)

// Populate initial collection data
initialItems.forEach((item) => {
  techWearCollection.insert(item)
})

/**
 * Shared filter helper to avoid duplicated business logic between routes and test suites
 */
export const filterSpecimens = (
  items: TechWearItem[],
  query: string,
  category: string,
  stock: string
): TechWearItem[] => {
  return items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === 'All' || item.category === category
    const matchesStock =
      stock === 'all' ||
      (stock === 'in-stock' && item.stock > 5) ||
      (stock === 'low-stock' && item.stock > 0 && item.stock <= 5) ||
      (stock === 'out-of-stock' && item.stock === 0)

    return matchesSearch && matchesCategory && matchesStock
  })
}
