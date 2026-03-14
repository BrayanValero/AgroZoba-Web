import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDashboardStats, getFinancialMovements } from '../services/stats'
import { formatCurrency, formatDateShort } from '../utils/formatters'
import BottomNavigation from '../components/BottomNavigation'

const ContabilidadGeneral = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        ingresos: 0,
        gastos: 0,
        aportes: 0,
        balance: 0
    })
    const [movimientos, setMovimientos] = useState([])
    const [filtroFecha, setFiltroFecha] = useState('mes')
    const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0])
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        loadData()
    }, [user, filtroFecha, customStartDate, customEndDate])

    const loadData = async () => {
        if (!user) return
        setLoading(true)

        try {
            const { start, end } = getFechaFiltro()
            const todosMovimientos = await getFinancialMovements(user.id, start, end)

            // Calcular stats locales basados en el filtro
            const ingresos = todosMovimientos.filter(m => m.tipo === 'ingreso').reduce((acc, m) => acc + (m.monto || 0), 0)
            const gastos = todosMovimientos.filter(m => m.tipo === 'gasto').reduce((acc, m) => acc + (m.monto || 0), 0)
            const aportes = todosMovimientos.filter(m => m.tipo === 'aporte').reduce((acc, m) => acc + (m.monto || 0), 0)

            setStats({
                ingresos,
                gastos,
                aportes,
                balance: (ingresos + aportes) - gastos
            })

            setMovimientos(todosMovimientos)

        } catch (error) {
            console.error('Error loading contabilidad:', error)
        } finally {
            setLoading(false)
        }
    }

    const getFechaFiltro = () => {
        if (filtroFecha === 'custom') {
            return { start: customStartDate, end: customEndDate }
        }

        const hoy = new Date()
        let fecha = new Date()

        switch (filtroFecha) {
            case 'semana':
                fecha.setDate(hoy.getDate() - 7)
                break
            case 'mes':
                fecha.setMonth(hoy.getMonth() - 1)
                break
            case 'trimestre':
                fecha.setMonth(hoy.getMonth() - 3)
                break
            default:
                fecha.setMonth(hoy.getMonth() - 1)
        }

        return { start: fecha.toISOString().split('T')[0], end: null }
    }

    const getPorcentajeCambio = (actual, anterior) => {
        if (!anterior) return 0
        return (((actual - anterior) / anterior) * 100).toFixed(1)
    }

    const exportToPDF = () => {
        import('jspdf').then(jsPDF => {
            import('jspdf-autotable').then(() => {
                const doc = new jsPDF.default()

                // Header
                doc.setFontSize(18)
                doc.text('Reporte Financiero - AgroZova', 14, 22)

                doc.setFontSize(11)
                doc.setTextColor(100)
                const fechaTexto = filtroFecha === 'custom'
                    ? `Del ${formatDateShort(customStartDate)} al ${formatDateShort(customEndDate)}`
                    : `Reporte generado: ${new Date().toLocaleDateString()}`
                doc.text(fechaTexto, 14, 30)

                // Resumen
                doc.autoTable({
                    startY: 35,
                    head: [['Concepto', 'Monto']],
                    body: [
                        ['Total Ingresos', formatCurrency(stats.ingresos)],
                        ['Total Aportes', formatCurrency(stats.aportes)],
                        ['Total Gastos', formatCurrency(stats.gastos)],
                        ['Balance Neto', formatCurrency(stats.balance)]
                    ],
                    theme: 'plain',
                    styles: { fontSize: 10, cellPadding: 2 },
                    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } }
                })

                // Detalle Movimientos
                doc.text('Detalle de Movimientos', 14, doc.lastAutoTable.finalY + 10)

                const tableRows = movimientos.map(m => [
                    formatDateShort(m.fecha),
                    m.modulo,
                    m.modulo,
                    m.concepto,
                    m.tipo === 'ingreso' ? 'Ingreso' : (m.tipo === 'aporte' ? 'Aporte' : 'Gasto'),
                    m.tipo === 'ingreso' || m.tipo === 'aporte' ? formatCurrency(m.monto) : `-${formatCurrency(m.monto)}`
                ])

                doc.autoTable({
                    startY: doc.lastAutoTable.finalY + 15,
                    head: [['Fecha', 'Módulo', 'Concepto', 'Tipo', 'Monto']],
                    body: tableRows,
                    theme: 'striped',
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [104, 137, 97] }, // primary color
                    columnStyles: { 4: { halign: 'right' } }
                })

                doc.save(`reporte_financiero_${new Date().toISOString().split('T')[0]}.pdf`)
            })
        })
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-[#121811] dark:text-white font-display min-h-screen">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 ios-blur border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center p-4 pb-4 justify-between max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="text-[#121811] dark:text-white material-symbols-outlined cursor-pointer">
                            arrow_back_ios
                        </Link>
                        <h2 className="text-[#121811] dark:text-white text-lg font-bold leading-tight tracking-tight">Contabilidad</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportToPDF}
                            className="flex items-center justify-center rounded-full w-10 h-10 bg-primary/10 text-[#121811] dark:text-white hover:bg-primary/20 transition-colors"
                        >
                            <span className="material-symbols-outlined">download</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto pb-24 w-full">
                {/* Quick Date Filters */}
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
                    <button
                        onClick={() => setFiltroFecha('custom')}
                        className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 ${filtroFecha === 'custom' ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-white/10 border border-gray-100 dark:border-gray-700 text-[#121811] dark:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    </button>
                </div>

                {filtroFecha === 'custom' && (
                    <div className="flex gap-4 px-4 pb-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1">
                            <label className="text-xs text-[#688961] mb-1 block">Desde</label>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-[#121811] dark:text-white"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-[#688961] mb-1 block">Hasta</label>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-[#121811] dark:text-white"
                            />
                        </div>
                    </div>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3 p-4">
                    <div className="flex flex-col gap-2 rounded-2xl p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="material-symbols-outlined text-primary text-[18px]">arrow_downward</span>
                            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider">Ingresos</p>
                        </div>
                        <p className="text-[#121811] dark:text-white tracking-tight text-base font-extrabold leading-tight">
                            {loading ? '...' : formatCurrency(stats.ingresos)}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 rounded-2xl p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="material-symbols-outlined text-blue-500 text-[18px]">potted_plant</span>
                            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider">Aportes</p>
                        </div>
                        <p className="text-[#121811] dark:text-white tracking-tight text-base font-extrabold leading-tight">
                            {loading ? '...' : formatCurrency(stats.aportes)}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 rounded-2xl p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="material-symbols-outlined text-red-500 text-[18px]">arrow_upward</span>
                            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider">Gastos</p>
                        </div>
                        <p className="text-[#121811] dark:text-white tracking-tight text-base font-extrabold leading-tight">
                            {loading ? '...' : formatCurrency(stats.gastos)}
                        </p>
                    </div>
                </div>

                {/* Balance Card */}
                <div className="px-4 pb-6">
                    <div className="rounded-2xl p-5 bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30">
                        <p className="text-[#688961] dark:text-gray-300 text-sm font-bold mb-1">Balance Total</p>
                        <p className="text-[#121811] dark:text-white text-3xl font-black mb-1">
                            {loading ? '...' : formatCurrency(stats.balance)}
                        </p>
                        <p className="text-xs text-[#688961] dark:text-gray-400">
                            {stats.balance >= 0 ? '✓ Superávit' : '⚠ Déficit'} - {filtroFecha === 'semana' ? 'Última semana' : filtroFecha === 'mes' ? 'Último mes' : 'Último trimestre'}
                        </p>
                    </div>
                </div>

                {/* Section Header */}
                <div className="flex items-center justify-between px-4 pb-2">
                    <h3 className="text-[#121811] dark:text-white text-lg font-extrabold tracking-tight">Movimientos Recientes</h3>
                </div>

                {/* Transactions List */}
                <div className="px-4 space-y-1">
                    {loading ? (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-4xl text-primary animate-pulse">calculate</span>
                            <p className="text-[#688961] mt-2">Cargando movimientos...</p>
                        </div>
                    ) : movimientos.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-6xl text-gray-400 opacity-50">receipt_long</span>
                            <p className="text-[#121811] dark:text-white font-bold mt-4">No hay movimientos</p>
                            <p className="text-[#688961] text-sm mt-2">Comienza registrando ingresos o gastos</p>
                        </div>
                    ) : (
                        movimientos.map((mov, index) => (
                            <div key={index} className="flex items-center gap-4 bg-white dark:bg-white/5 px-4 h-20 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-2">
                                <div className={`flex items-center justify-center rounded-xl ${mov.tipo === 'ingreso' ? 'bg-primary/10 text-primary' : (mov.tipo === 'aporte' ? 'bg-blue-100 text-blue-500' : 'bg-red-100 dark:bg-red-900/20 text-red-500')} shrink-0 w-12 h-12`}>
                                    <span className="material-symbols-outlined">
                                        {mov.tipo === 'ingreso' ? 'payments' : (mov.tipo === 'aporte' ? 'potted_plant' : 'shopping_cart')}
                                    </span>
                                </div>
                                <div className="flex flex-col flex-1">
                                    <p className="text-[#121811] dark:text-white text-[15px] font-bold">{mov.concepto}</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                                        {mov.modulo} • {formatDateShort(mov.fecha)} {mov.socios ? `• Socios: ${mov.socios}` : ''}
                                        {mov.tipo === 'ingreso' && (
                                            <span className={`ml-2 px-1 rounded-md text-[10px] font-bold ${mov.estado_pago === 'debe' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                                                {mov.estado_pago === 'debe' ? 'PENDIENTE' : 'COBRADO'}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[15px] font-extrabold ${mov.tipo === 'ingreso' ? 'text-primary' : (mov.tipo === 'aporte' ? 'text-blue-500' : 'text-[#121811] dark:text-white')}`}>
                                        {mov.tipo === 'ingreso' || mov.tipo === 'aporte' ? '+' : '-'}{formatCurrency(mov.monto)}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Bottom Tab Bar */}
            <BottomNavigation />
        </div>
    )
}

export default ContabilidadGeneral
