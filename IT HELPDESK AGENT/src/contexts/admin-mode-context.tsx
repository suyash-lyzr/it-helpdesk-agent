"use client"

import React from "react"

interface AdminModeContextValue {
  isAdmin: boolean
  setIsAdmin: (value: boolean) => void
}

const AdminModeContext = React.createContext<AdminModeContextValue | undefined>(
  undefined,
)

export function AdminModeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdmin, setIsAdmin] = React.useState<boolean>(true)

  return (
    <AdminModeContext.Provider value={{ isAdmin, setIsAdmin }}>
      {children}
    </AdminModeContext.Provider>
  )
}

export function useAdminMode(): AdminModeContextValue {
  const ctx = React.useContext(AdminModeContext)
  if (!ctx) {
    throw new Error("useAdminMode must be used within an AdminModeProvider")
  }
  return ctx
}
