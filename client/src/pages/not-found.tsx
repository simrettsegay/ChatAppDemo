import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Page not found</p>
      <Link to="/" className="mt-4 text-primary hover:underline">
        Go back home
      </Link>
    </div>
  )
}