import { db } from '../index'
import { orders } from '../schema'
import { eq } from 'drizzle-orm'

export const orderRepository = {
  async markOrderPaid(orderId: string): Promise<void> {
    await db.update(orders).set({ status: 'paid' }).where(eq(orders.id, orderId))
  }
}
