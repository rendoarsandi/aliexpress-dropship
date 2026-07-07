import { createServerFn } from '@tanstack/react-start'
import { importAliExpressProductHandler } from './scraperSession.server'

// Define typesafe importAliExpressProductFn server function
export const importAliExpressProductFn = createServerFn({ method: 'POST' })
  .validator((data: { url: string }) => data)
  .handler(async ({ data }) => {
    return importAliExpressProductHandler(data)
  })
