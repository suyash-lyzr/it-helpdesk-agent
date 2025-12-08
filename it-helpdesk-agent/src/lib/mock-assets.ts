// Mock asset/CMDB data for enterprise admin console

export interface Asset {
  id: string
  owner: string
  ownerEmail: string
  model: string
  manufacturer: string
  serial: string
  assetTag: string
  warrantyEnd: string // ISO date
  lastCheckin: string // ISO timestamp
  os?: string
  status: "active" | "retired" | "pending_replacement"
  ticketHistory: string[] // Array of ticket IDs
}

// Sample assets linked to tickets
export const mockAssets: Asset[] = [
  {
    id: "ASSET-001",
    owner: "John Doe",
    ownerEmail: "john.doe@company.com",
    model: "MacBook Pro 16-inch",
    manufacturer: "Apple",
    serial: "C02XK0ABCDEF",
    assetTag: "IT-2023-001",
    warrantyEnd: "2026-12-31",
    lastCheckin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    os: "macOS Sonoma 14.2",
    status: "active",
    ticketHistory: [],
  },
  {
    id: "ASSET-002",
    owner: "Jane Smith",
    ownerEmail: "jane.smith@company.com",
    model: "Dell Latitude 5540",
    manufacturer: "Dell",
    serial: "DL-2024-ABC123",
    assetTag: "IT-2024-045",
    warrantyEnd: "2027-06-30",
    lastCheckin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    os: "Windows 11 Pro",
    status: "active",
    ticketHistory: [],
  },
  {
    id: "ASSET-003",
    owner: "Bob Johnson",
    ownerEmail: "bob.johnson@company.com",
    model: "ThinkPad X1 Carbon",
    manufacturer: "Lenovo",
    serial: "TP-X1-2023-789",
    assetTag: "IT-2023-156",
    warrantyEnd: "2025-09-15",
    lastCheckin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    os: "Windows 11 Pro",
    status: "active",
    ticketHistory: [],
  },
  {
    id: "ASSET-004",
    owner: "Alice Williams",
    ownerEmail: "alice.williams@company.com",
    model: "MacBook Air 13-inch",
    manufacturer: "Apple",
    serial: "C02YK1XYZ123",
    assetTag: "IT-2024-089",
    warrantyEnd: "2026-03-20",
    lastCheckin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    os: "macOS Sonoma 14.1",
    status: "active",
    ticketHistory: [],
  },
  {
    id: "ASSET-005",
    owner: "Charlie Brown",
    ownerEmail: "charlie.brown@company.com",
    model: "Surface Laptop 5",
    manufacturer: "Microsoft",
    serial: "SL5-2024-DEF456",
    assetTag: "IT-2024-112",
    warrantyEnd: "2027-01-10",
    lastCheckin: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    os: "Windows 11 Pro",
    status: "active",
    ticketHistory: [],
  },
  {
    id: "ASSET-006",
    owner: "Diana Prince",
    ownerEmail: "diana.prince@company.com",
    model: "HP EliteBook 840",
    manufacturer: "HP",
    serial: "HP-ELITE-2023-456",
    assetTag: "IT-2023-234",
    warrantyEnd: "2025-11-30",
    lastCheckin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    os: "Windows 11 Pro",
    status: "pending_replacement",
    ticketHistory: [],
  },
  {
    id: "ASSET-007",
    owner: "Edward Norton",
    ownerEmail: "edward.norton@company.com",
    model: "MacBook Pro 14-inch",
    manufacturer: "Apple",
    serial: "C02ZK2GHI789",
    assetTag: "IT-2024-167",
    warrantyEnd: "2026-08-15",
    lastCheckin: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    os: "macOS Sonoma 14.2",
    status: "active",
    ticketHistory: [],
  },
  {
    id: "ASSET-008",
    owner: "Fiona Apple",
    ownerEmail: "fiona.apple@company.com",
    model: "Dell XPS 13",
    manufacturer: "Dell",
    serial: "DL-XPS-2024-321",
    assetTag: "IT-2024-201",
    warrantyEnd: "2027-04-22",
    lastCheckin: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    os: "Windows 11 Pro",
    status: "active",
    ticketHistory: [],
  },
  {
    id: "ASSET-009",
    owner: "George Clooney",
    ownerEmail: "george.clooney@company.com",
    model: "ThinkPad P1",
    manufacturer: "Lenovo",
    serial: "TP-P1-2023-654",
    assetTag: "IT-2023-312",
    warrantyEnd: "2025-12-31",
    lastCheckin: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    os: "Windows 11 Pro",
    status: "active",
    ticketHistory: [],
  },
  {
    id: "ASSET-010",
    owner: "Helen Mirren",
    ownerEmail: "helen.mirren@company.com",
    model: "Surface Pro 9",
    manufacturer: "Microsoft",
    serial: "SP9-2024-JKL012",
    assetTag: "IT-2024-278",
    warrantyEnd: "2026-11-05",
    lastCheckin: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    os: "Windows 11 Pro",
    status: "active",
    ticketHistory: [],
  },
]

// Get asset by ID
export function getAssetById(assetId: string): Asset | null {
  return mockAssets.find((a) => a.id === assetId) || null
}

// Get asset ticket history
export function getAssetTicketHistory(assetId: string, tickets: Array<{ id: string; asset_id?: string }>): string[] {
  return tickets.filter((t) => t.asset_id === assetId).map((t) => t.id)
}

// Get asset metrics
export function getAssetMetrics(assets: Asset[], tickets: Array<{ id: string; asset_id?: string }>) {
  const ticketsByAsset = new Map<string, number>()
  const ticketsByModel = new Map<string, number>()
  const ticketsByOS = new Map<string, number>()

  for (const ticket of tickets) {
    if (ticket.asset_id) {
      ticketsByAsset.set(ticket.asset_id, (ticketsByAsset.get(ticket.asset_id) || 0) + 1)

      const asset = assets.find((a) => a.id === ticket.asset_id)
      if (asset) {
        ticketsByModel.set(asset.model, (ticketsByModel.get(asset.model) || 0) + 1)
        if (asset.os) {
          ticketsByOS.set(asset.os, (ticketsByOS.get(asset.os) || 0) + 1)
        }
      }
    }
  }

  return {
    ticketsPerAsset: Array.from(ticketsByAsset.entries()).map(([assetId, count]) => ({
      assetId,
      count,
    })),
    ticketsPerModel: Array.from(ticketsByModel.entries()).map(([model, count]) => ({
      model,
      count,
    })),
    ticketsPerOS: Array.from(ticketsByOS.entries()).map(([os, count]) => ({
      os,
      count,
    })),
  }
}

