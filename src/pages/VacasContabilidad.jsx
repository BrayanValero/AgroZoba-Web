import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGastosGenerales, getProduccionGeneral, getAportesGenerales, updateProduccionLeche, createGasto } from '../services/vacas'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDateShort } from '../utils/formatters'
import BottomNavigation from '../components/BottomNavigation'

const VacasContabilidad = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [gastos, setGastos] = useState([])
    const [produccion, setProduccion] = useState([])
    const [aportes, setAportes] = useState([])
    const [activeTab, setActiveTab] = useState('resumen')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            loadData()
        }
    }, [user])

    const loadData = async () => {
        setLoading(true)
        const { data: g } = await getGastosGenerales(user.id)
        setGastos(g || [])
        const { data: p } = await getProduccionGeneral(user.id)
        setProduccion(p || [])
        const { data: a } = await getAportesGenerales(user.id)
        setAportes(a || [])
        setLoading(false)
    }

    const handleMarkAsPaid = async (produccionId) => {
        const { error } = await updateProduccionLeche(produccionId, { estado_pago: 'pagado' })
        if (!error) {
            loadData()
        }
    }

    if (loading) return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary animate-pulse">analytics</span>
        </div>
    )

    const totalGastos = gastos.reduce((acc, g) => acc + (g.monto || 0), 0)
    const totalVentas = produccion.reduce((acc, p) => acc + (p.monto_total || 0), 0)
    const totalAportes = aportes.reduce((acc, a) => acc + (a.monto || 0), 0)
    const totalPorCobrar = produccion.filter(p => p.estado_pago === 'debe').reduce((acc, p) => acc + (p.monto_total || 0), 0)
    const balance = (totalVentas + totalAportes - totalPorCobrar) - totalGastos

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display max-w-7xl mx-auto bg-white dark:bg-[#0a1108] shadow-2xl relative">
            {/* Header */}
            <header className="bg-white dark:bg-[#0a1108] border-b border-[#dde6db] dark:border-[#2a3528] p-4 sticky top-0 z-40 safe-top">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/vacas')} className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                        arrow_back_ios
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-[#121811] dark:text-white leading-tight">
                            Contabilidad Vacas
                        </h1>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#688961]">
                            Historial General de Movimientos
                        </p>
                    </div>
                </div>
            </header>

            {/* Quick Stats Header */}
            <div className="bg-white dark:bg-[#0a1108] p-4 border-b border-[#dde6db] dark:border-[#2a3528] grid grid-cols-4 divide-x divide-[#dde6db] dark:divide-[#2a3528]">
                <div className="px-1 text-center">
                    <p className="text-[9px] uppercase text-[#688961] font-bold">Gastos</p>
                    <p className="text-xs font-bold text-red-500">{formatCurrency(totalGastos)}</p>
                </div>
                <div className="px-1 text-center">
                    <p className="text-[9px] uppercase text-[#688961] font-bold">Aportes</p>
                    <p className="text-xs font-bold text-blue-500">{formatCurrency(totalAportes)}</p>
                </div>
                <div className="px-1 text-center">
                    <p className="text-[9px] uppercase text-[#688961] font-bold">Balance</p>
                    <p className={`text-xs font-bold ${balance >= 0 ? 'text-primary' : 'text-red-500'}`}>
                        {formatCurrency(balance)}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#dde6db] dark:border-[#2a3528] bg-white dark:bg-[#0a1108]">
                {['resumen', 'gastos', 'ventas', 'aportes'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-[#688961]'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <main className="flex-1 p-4 pb-32 overflow-y-auto">
                {activeTab === 'resumen' && (
                    <div className="space-y-4">
                        <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20">
                            <h4 className="text-xs font-bold text-primary uppercase mb-4 tracking-widest text-center">Resumen Financiero</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-primary/10">
                                    <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Total Ventas</p>
                                    <p className="text-sm font-black text-green-600">{formatCurrency(totalVentas)}</p>
                                </div>
                                <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-primary/10">
                                    <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Total Aportes</p>
                                    <p className="text-sm font-black text-blue-500">{formatCurrency(totalAportes)}</p>
                                </div>
                                <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-primary/10">
                                    <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Total Gastos</p>
                                    <p className="text-sm font-black text-red-500">{formatCurrency(totalGastos)}</p>
                                </div>
                                <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-primary/10">
                                    <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Por Cobrar</p>
                                    <p className="text-sm font-black text-orange-500">{formatCurrency(totalPorCobrar)}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-primary/10 flex justify-between items-center px-2">
                                <span className="text-xs font-black text-[#121811] dark:text-white uppercase">Utilidad Neta</span>
                                <span className={`text-xl font-black ${balance >= 0 ? 'text-primary' : 'text-red-500'}`}>{formatCurrency(balance)}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 text-center">
                            <p className="text-[10px] text-gray-500 font-medium">
                                * Los datos mostrados corresponden a todos los movimientos de la sección vacas de este usuario.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'gastos' && (
                    <div className="space-y-3">
                        {gastos.length === 0 ? (
                            <div className="text-center py-12 text-[#688961] bg-[#f1f4f0] dark:bg-[#1a2618] rounded-2xl border border-dashed border-[#dde6db] dark:border-[#2a3528]">
                                No hay gastos registrados
                            </div>
                        ) : (
                            gastos.map(g => (
                                <div key={g.id} className="bg-white dark:bg-[#1a2618] p-4 rounded-xl border border-[#dde6db] dark:border-[#2a3528] flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                            <span className="material-symbols-outlined text-xl">payments</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#121811] dark:text-white text-sm">{g.concepto}</p>
                                            <p className="text-[10px] text-[#688961] uppercase font-bold">{formatDateShort(g.fecha)} • {g.categoria}</p>
                                        </div>
                                    </div>
                                    <span className="font-black text-red-500">{formatCurrency(g.monto)}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'ventas' && (
                    <div className="space-y-3">
                        {produccion.length === 0 ? (
                            <div className="text-center py-12 text-[#688961] bg-[#f1f4f0] dark:bg-[#1a2618] rounded-2xl border border-dashed border-[#dde6db] dark:border-[#2a3528]">
                                No hay ventas registradas
                            </div>
                        ) : (
                            produccion.map(p => (
                                <div key={p.id} className="bg-white dark:bg-[#1a2618] p-4 rounded-xl border border-[#dde6db] dark:border-[#2a3528] flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                                            <span className="material-symbols-outlined text-xl">water_drop</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-[#121811] dark:text-white text-sm">{p.litros} Litros</p>
                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${p.estado_pago === 'debe' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                    {p.estado_pago || 'Pagado'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#688961] uppercase font-bold">{formatDateShort(p.fecha)} • {p.cliente || 'Consumidor'}</p>
                                            {p.estado_pago === 'debe' && (
                                                <button
                                                    onClick={() => handleMarkAsPaid(p.id)}
                                                    className="mt-1 text-[9px] font-bold text-primary underline underline-offset-2 flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                                    Marcar pagado
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <span className="font-bold text-[#121811] dark:text-white">{formatCurrency(p.monto_total)}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'aportes' && (
                    <div className="space-y-3">
                        {aportes.length === 0 ? (
                            <div className="text-center py-12 text-[#688961] bg-[#f1f4f0] dark:bg-[#1a2618] rounded-2xl border border-dashed border-[#dde6db] dark:border-[#2a3528]">
                                No hay aportes registrados
                            </div>
                        ) : (
                            aportes.map(a => (
                                <div key={a.id} className="bg-white dark:bg-[#1a2618] p-4 rounded-xl border border-[#dde6db] dark:border-[#2a3528] flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                                            <span className="material-symbols-outlined text-xl">potted_plant</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#121811] dark:text-white text-sm">{a.concepto}</p>
                                            <p className="text-[10px] text-[#688961] uppercase font-bold">{formatDateShort(a.fecha)} • {a.socios || 'No especificado'}</p>
                                        </div>
                                    </div>
                                    <span className="font-black text-blue-500">{formatCurrency(a.monto)}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            <BottomNavigation />
        </div>
    )
}

export default VacasContabilidad
