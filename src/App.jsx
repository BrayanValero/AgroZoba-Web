import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PollosEngorde from './pages/PollosEngorde'
import PollosDetalle from './pages/PollosDetalle'
import GallinasPosura from './pages/GallinasPosura'
import GallinasDetalle from './pages/GallinasDetalle'
import VacasLecheras from './pages/VacasLecheras'
import VacasDetalle from './pages/VacasDetalle'
import VacasContabilidad from './pages/VacasContabilidad'
import ContabilidadGeneral from './pages/ContabilidadGeneral'
import Reportes from './pages/Reportes'
import Perfil from './pages/Perfil'
import Clientes from './pages/Clientes'

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/pollos"
                        element={
                            <ProtectedRoute>
                                <PollosEngorde />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/gallinas"
                        element={
                            <ProtectedRoute>
                                <GallinasPosura />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/vacas"
                        element={
                            <ProtectedRoute>
                                <VacasLecheras />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/contabilidad"
                        element={
                            <ProtectedRoute>
                                <ContabilidadGeneral />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reportes"
                        element={
                            <ProtectedRoute>
                                <Reportes />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/clientes"
                        element={
                            <ProtectedRoute>
                                <Clientes />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/pollos/:id"
                        element={
                            <ProtectedRoute>
                                <PollosDetalle />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/gallinas/:id"
                        element={
                            <ProtectedRoute>
                                <GallinasDetalle />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/vacas/contabilidad"
                        element={
                            <ProtectedRoute>
                                <VacasContabilidad />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/vacas/:id"
                        element={
                            <ProtectedRoute>
                                <VacasDetalle />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/perfil"
                        element={
                            <ProtectedRoute>
                                <Perfil />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
