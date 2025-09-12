"use client"

import { useUser } from '@clerk/nextjs'
import Footer from './layouts/footer'

export function ConditionalFooter() {
  const { user } = useUser()
  
  // Solo mostrar footer si el usuario NO está logueado
  if (user) {
    return null
  }
  
  return <Footer />
}