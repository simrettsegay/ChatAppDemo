import { Loader2, Lock, Mail } from "lucide-react"

export const Icons = {
  spinner: Loader2,
  mail: Mail,
  lock: Lock,
}

export type Icon = keyof typeof Icons
