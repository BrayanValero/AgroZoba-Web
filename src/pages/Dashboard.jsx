import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDashboardStats } from '../services/stats'
import BottomNavigation from '../components/BottomNavigation'

const Dashboard = () => {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const [filtroFecha, setFiltroFecha] = useState('mes')
    const [stats, setStats] = useState({
        ingresos: 0,
        gastos: 0,
        porCobrar: 0,
        balance: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [user, filtroFecha])

    const loadStats = async () => {
        if (!user) return
        setLoading(true)

        let startDate = null
        const today = new Date()

        if (filtroFecha === 'semana') {
            const lastWeek = new Date(today)
            lastWeek.setDate(today.getDate() - 7)
            startDate = lastWeek.toISOString().split('T')[0]
        } else if (filtroFecha === 'trimestre') {
            const lastQuarter = new Date(today)
            lastQuarter.setMonth(today.getMonth() - 3)
            startDate = lastQuarter.toISOString().split('T')[0]
        }

        const data = await getDashboardStats(user.id, startDate)
        setStats(data)
        setLoading(false)
    }

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value)
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col">
            {/* TopAppBar */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 ios-blur border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center p-4 justify-between max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3">
                        <div className="shrink-0">
                            <div
                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-primary/20 shadow-sm"
                                style={{ backgroundImage: 'url("/logo.jpg")' }}
                            ></div>
                        </div>
                        <div>
                            <p className="text-xs text-[#688961] dark:text-gray-400 font-medium">Panel de Control</p>
                            <h2 className="text-[#121811] dark:text-white text-lg font-bold leading-tight tracking-tight">
                                Hola, {user?.email?.split('@')[0] || 'Usuario'}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSignOut}
                            className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-gray-50 dark:bg-white/5 text-[#121811] dark:text-white transition-colors active:scale-95"
                            title="Cerrar sesión"
                        >
                            <span className="material-symbols-outlined">logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-7xl mx-auto w-full pb-24">
                {/* Date Filters */}
                <div className="flex gap-3 p-4 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setFiltroFecha('semana')}
                        className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 ${filtroFecha === 'semana' ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-white/10 border border-gray-100 dark:border-gray-700 text-[#121811] dark:text-white'}`}
                    >
                        <p className="text-sm font-semibold">Semana</p>
                    </button>
                    <button
                        onClick={() => setFiltroFecha('mes')}
                        className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 ${filtroFecha === 'mes' ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-white/10 border border-gray-100 dark:border-gray-700 text-[#121811] dark:text-white'}`}
                    >
                        <p className="text-sm font-semibold">Este mes</p>
                    </button>
                    <button
                        onClick={() => setFiltroFecha('trimestre')}
                        className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 ${filtroFecha === 'trimestre' ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-white/10 border border-gray-100 dark:border-gray-700 text-[#121811] dark:text-white'}`}
                    >
                        <p className="text-sm font-semibold">Trimestre</p>
                    </button>
                </div>

                {/* Stats Section */}
                <section className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Ingresos */}
                        <div className="flex items-center justify-between gap-4 rounded-xl p-5 bg-white dark:bg-white/5 shadow-sm border border-gray-50 dark:border-white/5">
                            <div className="flex flex-col gap-1">
                                <p className="text-[#688961] dark:text-gray-400 text-sm font-medium">Ventas del mes (Totales)</p>
                                <p className="text-[#121811] dark:text-white tracking-tight text-2xl font-bold">
                                    {loading ? '...' : formatCurrency(stats.ingresos)}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="flex items-center text-[#078821] text-xs font-bold bg-[#078821]/10 px-2 py-1 rounded-full">
                                    <span className="material-symbols-outlined text-sm mr-1">payments</span>Cobrado + Debe
                                </span>
                            </div>
                        </div>

                        {/* Gastos */}
                        <div className="flex items-center justify-between gap-4 rounded-xl p-5 bg-white dark:bg-white/5 shadow-sm border border-gray-50 dark:border-white/5">
                            <div className="flex flex-col gap-1">
                                <p className="text-[#688961] dark:text-gray-400 text-sm font-medium">Gastos del mes</p>
                                <p className="text-[#121811] dark:text-white tracking-tight text-2xl font-bold">
                                    {loading ? '...' : formatCurrency(stats.gastos)}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="flex items-center text-[#e72208] text-xs font-bold bg-[#e72208]/10 px-2 py-1 rounded-full">
                                    <span className="material-symbols-outlined text-sm mr-1">trending_down</span>-5%
                                </span>
                            </div>
                        </div>

                        {/* Por Cobrar */}
                        <div className="flex items-center justify-between gap-4 rounded-xl p-5 bg-white dark:bg-white/5 shadow-sm border border-gray-50 dark:border-white/5">
                            <div className="flex flex-col gap-1">
                                <p className="text-[#688961] dark:text-gray-400 text-sm font-medium">Por Cobrar (Cuentas Pendientes)</p>
                                <p className="text-orange-500 tracking-tight text-2xl font-bold">
                                    {loading ? '...' : formatCurrency(stats.porCobrar)}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="flex items-center text-orange-500 text-xs font-bold bg-orange-500/10 px-2 py-1 rounded-full">
                                    <span className="material-symbols-outlined text-sm mr-1">schedule</span>Pendiente
                                </span>
                            </div>
                        </div>

                        {/* Balance */}
                        <div className="flex items-center justify-between gap-4 rounded-xl p-5 bg-[#FFD700]/10 dark:bg-[#FFD700]/20 border border-[#FFD700]/30 shadow-sm">
                            <div className="flex flex-col gap-1">
                                <p className="text-[#B8860B] dark:text-[#FFD700] text-sm font-bold">Balance General (Ventas - Gastos)</p>
                                <p className="text-[#121811] dark:text-white tracking-tight text-2xl font-extrabold">
                                    {loading ? '...' : formatCurrency(stats.balance)}
                                </p>
                            </div>
                            <div className="bg-[#FFD700] text-white p-2 rounded-lg">
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Accesos Rápidos (Restaurado Discreto) */}
                <section className="px-4 pb-4 mt-4">
                    <h3 className="text-[#121811] dark:text-white text-base font-bold mb-3">Accesos Rápidos</h3>
                    <div className="grid grid-cols-4 sm:flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        <Link to="/pollos" className="flex flex-col items-center gap-2 min-w-[80px]">
                            <div className="size-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <span className="material-symbols-outlined text-2xl">flutter_dash</span>
                            </div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Pollos</span>
                        </Link>
                        <Link to="/gallinas" className="flex flex-col items-center gap-2 min-w-[80px]">
                            <div className="size-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400">
                                <span className="material-symbols-outlined text-2xl">egg</span>
                            </div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Gallinas</span>
                        </Link>
                        <Link to="/vacas" className="flex flex-col items-center gap-2 min-w-[80px]">
                            <div className="size-14 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400">
                                <span className="material-symbols-outlined text-2xl">pets</span>
                            </div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Vacas</span>
                        </Link>
                        <Link to="/clientes" className="flex flex-col items-center gap-2 min-w-[80px]">
                            <div className="size-14 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center text-pink-600 dark:text-pink-400">
                                <span className="material-symbols-outlined text-2xl">groups</span>
                            </div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Clientes</span>
                        </Link>
                        <Link to="/contabilidad" className="flex flex-col items-center gap-2 min-w-[80px]">
                            <div className="size-14 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <span className="material-symbols-outlined text-2xl">receipt_long</span>
                            </div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Movimientos</span>
                        </Link>
                    </div>
                </section>

            </main>

            {/* BottomNavBar */}
            <BottomNavigation />
        </div>
    )
}

export default Dashboard
