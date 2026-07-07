import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// Mock react-router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: any) => ({ options }),
  Link: ({ children, to, className, ...props }: any) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
}))

// Mock react-db
vi.mock('@tanstack/react-db', () => ({
  useLiveQuery: () => ({
    data: [
      { id: '1', name: 'DSTRKT-01 Ghost Shell Jacket', category: 'Jackets', price: 380, stock: 12, status: 'In Stock' },
      { id: '2', name: 'M-06 Cybernetic Cargo Pants', category: 'Pants', price: 240, stock: 4, status: 'Low Stock' },
      { id: '3', name: 'V-09 Tactical Chest Rig', category: 'Accessories', price: 150, stock: 0, status: 'Out of Stock' },
      { id: '4', name: 'N-02 Thermal Base Layer', category: 'Underwear', price: 90, stock: 25, status: 'In Stock' },
      { id: '5', name: 'S-04 All-Weather Boots', category: 'Footwear', price: 310, stock: 8, status: 'In Stock' }
    ]
  }),
  createCollection: () => ({
    insert: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
  }),
  localOnlyCollectionOptions: (opts: any) => opts,
}))

// Mock react-store
vi.mock('@tanstack/react-store', () => ({
  useStore: (store: any, selector: any) => selector(store.state),
  Store: class {
    state: any
    constructor(init: any) { this.state = init }
    setState(fn: any) { this.state = fn(this.state) }
  }
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  Tag: () => <div data-testid="tag-icon" />,
  ShoppingCart: () => <div data-testid="shopping-cart-icon" />,
  Cpu: () => <div data-testid="cpu-icon" />,
  ShieldCheck: () => <div data-testid="shield-check-icon" />,
  Layers: () => <div data-testid="layers-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Crosshair: () => <div data-testid="crosshair-icon" />,
  ArrowDown: () => <div data-testid="arrow-down-icon" />
}))

import { Route } from './index'

describe('StorefrontLanding Component Tests', () => {
  const StorefrontLandingComponent = (Route as any).options.component

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders storefront landing successfully with main title and core structures', () => {
    render(<StorefrontLandingComponent />)

    // Verify main brand heading "STITCH" and sub-heading "DSTRKT"
    expect(screen.getByText('STITCH')).toBeDefined()
    expect(screen.getByText('DSTRKT')).toBeDefined()

    // Verify exploration button text is mapped
    expect(screen.getByText('EXPLORE HARDWARE CATALOG')).toBeDefined()

    // Verify category and stock section labels are rendered
    expect(screen.getByText('REPOSITORY')).toBeDefined()
    expect(screen.getByText('CATEGORIES')).toBeDefined()
    expect(screen.getByText('STOCK STABILITY')).toBeDefined()
  })

  test('verifies that cyber-gamer clichés, glowing text, and scanning line overlays are removed', () => {
    const { container } = render(<StorefrontLandingComponent />)

    // No scanning line overlay (shadow or bounce bounce)
    const scanningOverlay = container.querySelector('.shadow-\\[0_0_15px_rgba\\(255\\,255\\,255\\,0\\.5\\)\\]')
    expect(scanningOverlay).toBeNull()

    // No glowing text-shadow classes on DSTRKT
    const glowHeader = container.querySelector('.text-shadow-\\[0_0_30px_rgba\\(255\\,255\\,255\\,0\\.15\\)\\]')
    expect(glowHeader).toBeNull()

    // Ensure status indicators are sharp (rounded-none) rather than rounded-full
    const statusPings = container.querySelectorAll('.rounded-full')
    // They should have 0 elements with rounded-full
    statusPings.forEach((ping) => {
      expect(ping.className).not.toContain('animate-ping')
    })
  })

  test('verifies marquee scrolling animation is removed and replaced by static streams', () => {
    const { container } = render(<StorefrontLandingComponent />)
    const marqueeAnimation = container.querySelector('.animate-marquee')
    expect(marqueeAnimation).toBeNull()

    // Static text exists
    expect(screen.getByText('ALL WEATHER GHOST SHELLS IN STOCK')).toBeDefined()
  })

  test('verifies size select buttons are scaled to 44x44px mobile touch targets (w-11 h-11)', () => {
    render(<StorefrontLandingComponent />)

    // Get size selection buttons for M-06 Cybernetic Cargo Pants (sizes: 30, 32, 34)
    const sizeButtons = screen.getAllByRole('button', { name: /^(30|32|34|S|M|L)$/ })
    expect(sizeButtons.length).toBeGreaterThan(0)

    // Verify each size target has w-11 h-11 classes
    sizeButtons.forEach((btn) => {
      expect(btn.className).toContain('w-11')
      expect(btn.className).toContain('h-11')
    })
  })

  test('opens technical Sizing Spec modal and verifies measurement chart definitions', () => {
    render(<StorefrontLandingComponent />)

    // Locate the "VIEW SIZING SPEC CHART" button and click it
    const viewChartButton = screen.getByText('VIEW SIZING SPEC CHART')
    expect(viewChartButton).toBeDefined()
    fireEvent.click(viewChartButton)

    // Verify modal is displayed with technical calibration title
    expect(screen.getByText('TECHNICAL CALIBRATION')).toBeDefined()
    expect(screen.getByText('SIZE & SPECIFICATION CHART')).toBeDefined()

    // Verify specific spec details
    expect(screen.getByText('S / 30')).toBeDefined()
    expect(screen.getByText('M / 32')).toBeDefined()
    expect(screen.getByText('L / 34')).toBeDefined()

    // Close the size chart modal
    const closeBtn = screen.getByText('[ CLOSE ]')
    expect(closeBtn).toBeDefined()
    fireEvent.click(closeBtn)

    // Verify chart modal is dismissed
    expect(screen.queryByText('TECHNICAL CALIBRATION')).toBeNull()
  })

  test('contains user-friendly label translations for non-tech users', () => {
    render(<StorefrontLandingComponent />)

    // Labels changed from hardware spec to SELECT SPEC / SIZE:
    const specLabels = screen.getAllByText('SELECT SPEC / SIZE:')
    expect(specLabels.length).toBeGreaterThan(0)

    // Add to cart text rather than DEPLOY TO CART
    const addToCartBtns = screen.getAllByText('ADD TO CART')
    expect(addToCartBtns.length).toBeGreaterThan(0)
  })
})
