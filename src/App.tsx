import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { apiClient } from '@/lib/api'
import LoginPage from '@/pages/LoginPage'
import ChatPage from '@/pages/ChatPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  )
}

export default App

