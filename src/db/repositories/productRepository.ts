import { db } from '../index'
import { products } from '../schema'
import type { InferInsertModel } from 'drizzle-orm'

export type NewProduct = InferInsertModel<typeof products>

export const productRepository = {
  async insertProduct(product: NewProduct): Promise<void> {
    await db.insert(products).values(product)
  }
}
