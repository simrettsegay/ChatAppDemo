// src/components/layout/main-layout.tsx
import { Outlet } from "react-router-dom"
import { Navbar } from "@/components/ui/navbar"

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container mx-auto w-full flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
