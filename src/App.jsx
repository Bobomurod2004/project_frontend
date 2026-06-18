import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Korxonalar from './pages/Korxonalar'
import Hisobotlar from './pages/Hisobotlar'
import HisobotDetail from './pages/HisobotDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            border: '1px solid #d9e1ec',
            borderRadius: 8,
            boxShadow: '0 16px 40px rgb(16 24 40 / 0.14)',
            color: '#101828',
            fontSize: 13,
            fontWeight: 700,
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="korxonalar" element={<Korxonalar />} />
          <Route path="hisobotlar" element={<Hisobotlar />} />
          <Route path="hisobotlar/:id" element={<HisobotDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
