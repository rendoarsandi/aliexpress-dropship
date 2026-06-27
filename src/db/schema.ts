import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

// ==========================================
// 1. Core E-commerce / Dropship Tables
// ==========================================

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  rawPrice: real('raw_price').notNull(),
  imageUrl: text('image_url'),
  additionalImages: text('additional_images'), // comma-separated or stringified JSON
  options: text('options'), // stringified JSON options array
  variants: text('variants'), // stringified JSON variants array
  tags: text('tags'), // comma-separated or stringified JSON
  sourceUrl: text('source_url'),
  createdAt: integer('created_at').notNull()
}, (table) => ({
  createdAtIdx: index('products_created_at_idx').on(table.createdAt)
}))

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  totalPrice: real('total_price').notNull(),
  status: text('status').notNull(), // 'pending', 'paid', 'shipped', 'cancelled'
  customerEmail: text('customer_email').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  createdAt: integer('created_at').notNull()
}, (table) => ({
  productIdIdx: index('orders_product_id_idx').on(table.productId),
  customerEmailIdx: index('orders_customer_email_idx').on(table.customerEmail),
  createdAtIdx: index('orders_created_at_idx').on(table.createdAt)
}))

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(), // e.g. "markup"
  markupType: text('markup_type').notNull(), // 'fixed' | 'multiplier'
  fixedMarkup: real('fixed_markup').notNull(),
  marginMultiplier: real('margin_multiplier').notNull(),
  updatedAt: integer('updated_at').notNull()
})

// ==========================================
// 2. better-auth Built-in Schemas (SQLite)
// ==========================================

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
}, (table) => ({
  userIdIdx: index('session_user_id_idx').on(table.userId)
}))

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
}, (table) => ({
  userIdIdx: index('account_user_id_idx').on(table.userId)
}))

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
}, (table) => ({
  identifierIdx: index('verification_identifier_idx').on(table.identifier)
}))

