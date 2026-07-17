import { createServerFn } from '@tanstack/react-start'
import { importAliExpressProductHandler } from './scraperSession.server'
import { decodeImportAliExpressProduct } from './schemas'

// Define typesafe importAliExpressProductFn server function
export const importAliExpressProductFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    try {
      return decodeImportAliExpressProduct(data)
    } catch (error) {
      console.error('Import AliExpress product validation failed via @effect/schema:', error)
      throw new Error(error instanceof Error ? error.message : 'Invalid import product payload')
    }
  })
  .handler(async ({ data }) => {
    return importAliExpressProductHandler(data)
  })
