import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { getInventoryStats, getProductionHistory, getFinancialHistory } from '../services/stats'
import BottomNavigation from '../components/BottomNavigation'

const Reportes = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalPollos: 0,
        totalGallinas: 0,
        totalVacas: 0
    })
    const [chartData, setChartData] = useState([])
    const [financialData, setFinancialData] = useState([])

    useEffect(() => {
        loadReportes()
    }, [user])

    const loadReportes = async () => {
        if (!user) return
        setLoading(true)

        try {
            const [inventory, history, financialHistory] = await Promise.all([
                getInventoryStats(user.id),
                getProductionHistory(user.id, 30),
                getFinancialHistory(user.id, 30)
            ])

            setStats(inventory)
            setChartData(history)
            setFinancialData(financialHistory)

        } catch (error) {
            console.error('Error loading reports:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen text-[#121811] dark:text-white pb-24">
            <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden max-w-7xl mx-auto bg-white dark:bg-[#0a1108] shadow-2xl">
                {/* TopAppBar */}
                <div className="flex items-center bg-white dark:bg-[#0a1108] p-4 pb-2 justify-between sticky top-0 z-50 border-b border-[#dde6db] dark:border-[#2a3528]">
                    <Link to="/" className="text-[#121811] dark:text-white flex size-12 shrink-0 items-center cursor-pointer">
                        <span className="material-symbols-outlined text-2xl">arrow_back_ios</span>
                    </Link>
                    <div className="flex flex-col items-center">
                        <h2 className="text-[#121811] dark:text-white text-lg font-bold leading-tight">Reportes</h2>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#688961]">Métricas de Producción</span>
                    </div>
                    <div className="flex w-12 items-center justify-end"></div>
                </div>

                <div className="p-4 space-y-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-[#688961]">Cargando métricas...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {/* Resumen de Inventario */}
                            <section className="space-y-3">
                                <h3 className="font-bold text-lg text-[#121811] dark:text-white px-1">Inventario Actual</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div className="bg-[#f1f4f0] dark:bg-[#1a2618] p-4 rounded-xl border border-[#dde6db] dark:border-[#2a3528]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-primary">flutter_dash</span>
                                            <span className="text-xs font-bold uppercase text-[#688961]">Pollos</span>
                                        </div>
                                        <p className="text-2xl font-black text-[#121811] dark:text-white">{stats.totalPollos}</p>
                                        <p className="text-xs text-[#688961]">Cabezas</p>
                                    </div>

                                    <div className="bg-[#f1f4f0] dark:bg-[#1a2618] p-4 rounded-xl border border-[#dde6db] dark:border-[#2a3528]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-primary">egg</span>
                                            <span className="text-xs font-bold uppercase text-[#688961]">Gallinas</span>
                                        </div>
                                        <p className="text-2xl font-black text-[#121811] dark:text-white">{stats.totalGallinas}</p>
                                        <p className="text-xs text-[#688961]">Aves Ponedoras</p>
                                    </div>

                                    <div className="bg-[#f1f4f0] dark:bg-[#1a2618] p-4 rounded-xl border border-[#dde6db] dark:border-[#2a3528] col-span-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-primary">pets</span>
                                                    <span className="text-xs font-bold uppercase text-[#688961]">Ganado Bovino</span>
                                                </div>
                                                <p className="text-2xl font-black text-[#121811] dark:text-white">{stats.totalVacas}</p>
                                                <p className="text-xs text-[#688961]">Cabezas totales</p>
                                            </div>
                                            <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-3xl text-primary">grass</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Gráfica de Huevos */}
                            <section className="pt-2">
                                <h3 className="font-bold text-lg text-[#121811] dark:text-white mb-4 px-1">Producción de Huevos</h3>
                                <div className="h-64 w-full bg-white dark:bg-[#1a2618] p-2 rounded-xl border border-[#dde6db] dark:border-[#2a3528] shadow-sm">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorHuevos" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                            <XAxis
                                                dataKey="shortDate"
                                                tick={{ fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                                interval={4}
                                            />
                                            <YAxis
                                                hide={false}
                                                tick={{ fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                                width={30}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1a2618', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="huevos"
                                                stroke="#eab308"
                                                fillOpacity={1}
                                                fill="url(#colorHuevos)"
                                                strokeWidth={2}
                                                name="Huevos"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>

                            {/* Gráfica de Leche */}
                            <section className="pt-2">
                                <h3 className="font-bold text-lg text-[#121811] dark:text-white mb-4 px-1">Producción de Leche</h3>
                                <div className="h-64 w-full bg-white dark:bg-[#1a2618] p-2 rounded-xl border border-[#dde6db] dark:border-[#2a3528] shadow-sm">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                            <XAxis
                                                dataKey="shortDate"
                                                tick={{ fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                                interval={4}
                                            />
                                            <YAxis
                                                hide={false}
                                                tick={{ fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                                width={30}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ backgroundColor: '#1a2618', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Bar
                                                dataKey="leche"
                                                fill="#3b82f6"
                                                radius={[4, 4, 0, 0]}
                                                name="Litros"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>

                            {/* Gráfica de Balance Financiero */}
                            <section className="pt-2">
                                <h3 className="font-bold text-lg text-[#121811] dark:text-white mb-4 px-1">Balance Financiero</h3>
                                <div className="h-64 w-full bg-white dark:bg-[#1a2618] p-2 rounded-xl border border-[#dde6db] dark:border-[#2a3528] shadow-sm">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={financialData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                            <XAxis
                                                dataKey="shortDate"
                                                tick={{ fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                                interval={4}
                                            />
                                            <YAxis
                                                hide={false}
                                                tick={{ fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={false}
                                                width={35}
                                                tickFormatter={(value) => `$${value / 1000}k`}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ backgroundColor: '#1a2618', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value) => [`$${value.toLocaleString()}`, '']}
                                            />
                                            <Legend verticalAlign="top" height={36} />
                                            <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                <BottomNavigation />
            </div>
        </div>
    )
}

export default Reportes
