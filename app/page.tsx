"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (apiClient.isAuthenticated()) {
      router.push("/chat")
    } else {
      router.push("/login")
    }
  }, [router])

  return null
}

