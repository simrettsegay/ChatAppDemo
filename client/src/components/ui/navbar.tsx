// src/components/ui/navbar.tsx
import { Link } from "react-router-dom"

export function Navbar() {
  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold">
          ExceedChat
        </Link>

        <div className="flex items-center space-x-4">
          <Link to="/login" className="hover:underline">
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground transition hover:bg-primary/90"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  )
}
