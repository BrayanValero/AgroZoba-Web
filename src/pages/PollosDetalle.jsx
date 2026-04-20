import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProduccionById, getGastosByProduccion, getIngresosByProduccion, createGasto, createIngreso, updateProduccion, updateIngreso, deleteIngreso, getAportesByProduccion } from '../services/pollos'
import { getAllRecentClients } from '../services/clients'
import { formatCurrency, formatDateShort } from '../utils/formatters'
import BottomNavigation from '../components/BottomNavigation'

const PollosDetalle = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [produccion, setProduccion] = useState(null)
    const [gastos, setGastos] = useState([])
    const [ingresos, setIngresos] = useState([])
    const [aportes, setAportes] = useState([])
    const [activeTab, setActiveTab] = useState('resumen')
    const [loading, setLoading] = useState(true)

    // Modals
    const [showGastoModal, setShowGastoModal] = useState(false)
    const [showVentaModal, setShowVentaModal] = useState(false)
    const [showEditVentaModal, setShowEditVentaModal] = useState(false)
    const [showEditLoteModal, setShowEditLoteModal] = useState(false)
    const [showMortalidadModal, setShowMortalidadModal] = useState(false)
    const [selectedVenta, setSelectedVenta] = useState(null)

    // Form states
    const [formGasto, setFormGasto] = useState({ concepto: '', monto: '', categoria: 'alimento' })
    const [formVenta, setFormVenta] = useState({
        cantidad: '',
        peso_total: '',
        precio_kilo: 13000,
        monto_total: '',
        cliente: '',
        estado_pago: 'debe'
    })
    const [formMortalidad, setFormMortalidad] = useState({ cantidad: '', motivo: '' })
    const [formEditLote, setFormEditLote] = useState({})
    const [recentClients, setRecentClients] = useState([])

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        setLoading(true)
        const { data: prod } = await getProduccionById(id)
        if (prod) {
            setProduccion(prod)
            const { data: g } = await getGastosByProduccion(id)
            setGastos(g || [])
            const { data: i } = await getIngresosByProduccion(id)
            setIngresos(i || [])
            const { data: a } = await getAportesByProduccion(id)
            setAportes(a || [])

            // Cargar clientes recientes (todos los módulos)
            const { data: clients } = await getAllRecentClients(prod.user_id)
            setRecentClients(clients || [])
        }
        setLoading(false)
    }

    const handleAddGasto = async (e) => {
        e.preventDefault()
        const { error } = await createGasto({
            produccion_id: id,
            concepto: formGasto.concepto,
            monto: parseFloat(formGasto.monto),
            categoria: formGasto.categoria,
            user_id: produccion.user_id,
            fecha: new Date().toISOString().split('T')[0]
        })
        if (!error) {
            setShowGastoModal(false)
            setFormGasto({ concepto: '', monto: '', categoria: 'alimento' })
            loadData()
        }
    }

    const updateVentaCalculations = (changedField, value, currentForm) => {
        const peso = changedField === 'peso_total' ? parseFloat(value) : parseFloat(currentForm.peso_total)
        const precio = changedField === 'precio_kilo' ? parseFloat(value) : parseFloat(currentForm.precio_kilo)
        const monto = changedField === 'monto_total' ? parseFloat(value) : parseFloat(currentForm.monto_total)

        let updates = { [changedField]: value }

        if (changedField === 'peso_total' || changedField === 'precio_kilo') {
            if (!isNaN(peso) && !isNaN(precio)) {
                updates.monto_total = (peso * precio).toFixed(2)
            }
        } else if (changedField === 'monto_total') {
            if (!isNaN(monto) && !isNaN(precio) && precio > 0) {
                updates.peso_total = (monto / precio).toFixed(2)
            }
        }

        return { ...currentForm, ...updates }
    }

    const handleAddVenta = async (e) => {
        e.preventDefault()
        const peso = parseFloat(formVenta.peso_total || 0)
        const precio = parseFloat(formVenta.precio_kilo || 13000)
        const cantidad = parseInt(formVenta.cantidad || 0)
        const montoTotal = parseFloat(formVenta.monto_total) || (peso * precio)

        console.log('Intentando registrar venta:', {
            produccion_id: id,
            monto_total: montoTotal,
            cantidad_vendida: cantidad,
            peso_total: peso,
            precio_kilo: precio
        })

        const { error: errorIngreso } = await createIngreso({
            produccion_id: id,
            concepto: `Venta de pollos${formVenta.cliente ? ' - ' + formVenta.cliente : ''}`,
            monto_total: montoTotal,
            cantidad_vendida: cantidad,
            peso_total: peso,
            kilos_vendidos: peso,
            precio_kilo: precio,
            precio_por_kilo: precio, 
            cliente: formVenta.cliente || 'Consumidor Final',
            estado_pago: formVenta.estado_pago,
            user_id: produccion.user_id,
            fecha: new Date().toISOString().split('T')[0]
        })

        if (errorIngreso) {
            console.error('Error al registrar venta:', errorIngreso)
            alert('Error al registrar la venta: ' + errorIngreso.message)
            return
        }

        // Update population
        const nuevaCantidad = (produccion.cantidad_actual || 0) - cantidad
        const updates = { cantidad_actual: nuevaCantidad }

        if (nuevaCantidad <= 0) {
            updates.estado = 'finalizado'
        }

        const { error: errorUpdate } = await updateProduccion(id, updates)
        
        if (errorUpdate) {
            console.error('Error al actualizar población:', errorUpdate)
        }

        setShowVentaModal(false)
        setFormVenta({ cantidad: '', peso_total: '', precio_kilo: 13000, monto_total: '', cliente: '', estado_pago: 'debe' })
        loadData()
    }

    const handleMarkAsPaid = async (ingresoId) => {
        const { error } = await updateIngreso(ingresoId, { estado_pago: 'pagado' })
        if (!error) {
            loadData()
        }
    }

    const handleDeleteVenta = async (venta) => {
        if (!window.confirm('¿Estás seguro de eliminar esta venta? La población se ajustará automáticamente.')) return

        const { error } = await deleteIngreso(venta.id)

        if (!error) {
            // Restore population
            const nuevaCantidad = produccion.cantidad_actual + (parseInt(venta.cantidad_vendida) || 0)
            await updateProduccion(id, { cantidad_actual: nuevaCantidad })
            loadData()
        } else {
            alert('Error al eliminar venta: ' + error.message)
        }
    }

    const handleEditVenta = (venta) => {
        setSelectedVenta(venta)
        setFormVenta({
            cantidad: venta.cantidad_vendida || 0,
            peso_total: venta.peso_total || 0,
            precio_kilo: venta.precio_kilo || 13000,
            monto_total: venta.monto_total || 0,
            cliente: venta.cliente || '',
            estado_pago: venta.estado_pago || 'debe'
        })
        setShowEditVentaModal(true)
    }

    const handleUpdateVenta = async (e) => {
        e.preventDefault()
        const peso = parseFloat(formVenta.peso_total || 0)
        const precio = parseFloat(formVenta.precio_kilo || 13000)
        const cantidad = parseInt(formVenta.cantidad || 0)
        const montoTotal = parseFloat(formVenta.monto_total) || (peso * precio)

        const { error } = await updateIngreso(selectedVenta.id, {
            concepto: `Venta de pollos${formVenta.cliente ? ' - ' + formVenta.cliente : ''}`,
            monto_total: montoTotal,
            cantidad_vendida: cantidad,
            peso_total: peso,
            kilos_vendidos: peso,
            precio_kilo: precio,
            precio_por_kilo: precio,
            cliente: formVenta.cliente || 'Consumidor Final',
            estado_pago: formVenta.estado_pago
        })

        if (!error) {
            // Adjust population
            const diff = (parseInt(selectedVenta.cantidad_vendida) || 0) - cantidad
            const nuevaCantidad = produccion.cantidad_actual + diff
            await updateProduccion(id, { cantidad_actual: nuevaCantidad })

            setShowEditVentaModal(false)
            setSelectedVenta(null)
            loadData()
        } else {
            alert('Error al actualizar venta: ' + error.message)
        }
    }

    const handleAddMortalidad = async (e) => {
        e.preventDefault()
        const cantidad = parseInt(formMortalidad.cantidad || 0)

        // Add expense/record of mortality if desired, for now just update population
        const nuevaCantidad = produccion.cantidad_actual - cantidad
        const { error } = await updateProduccion(id, { cantidad_actual: nuevaCantidad })

        if (!error) {
            setShowMortalidadModal(false)
            setFormMortalidad({ cantidad: '', motivo: '' })
            loadData()
        }
    }

    const handleUpdateLote = async (e) => {
        e.preventDefault()
        const { error } = await updateProduccion(id, formEditLote)
        if (!error) {
            setShowEditLoteModal(false)
            loadData()
        }
    }

    if (loading) return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary animate-pulse">flutter_dash</span>
        </div>
    )

    if (!produccion) return <div className="p-8 text-center">Producción no encontrada</div>

    const hasInitialPurchaseExpense = gastos.some(g => g.categoria === 'pollitos' || g.concepto.toLowerCase().includes('compra inicial'))
    const initialCostVal = (!hasInitialPurchaseExpense && produccion.cantidad_inicial && produccion.precio_unitario)
        ? (parseFloat(produccion.cantidad_inicial) * parseFloat(produccion.precio_unitario))
        : 0

    const totalGastos = gastos.reduce((acc, g) => acc + (g.monto || 0), 0) + initialCostVal
    const totalIngresos = ingresos.reduce((acc, i) => acc + (i.monto_total || 0), 0)
    const totalAportes = aportes.reduce((acc, a) => acc + (a.monto || 0), 0)
    const totalPorCobrar = ingresos.filter(i => i.estado_pago === 'debe').reduce((acc, i) => acc + (i.monto_total || 0), 0)
    const balance = (totalIngresos + totalAportes - totalPorCobrar) - totalGastos


    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display max-w-7xl mx-auto bg-white dark:bg-[#0a1108] shadow-2xl relative">
            {/* Header */}
            <header className="bg-white dark:bg-[#0a1108] border-b border-[#dde6db] dark:border-[#2a3528] p-4 sticky top-0 z-40 safe-top">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/pollos')} className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                        arrow_back_ios
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-[#121811] dark:text-white leading-tight">
                            {produccion.nombre}
                        </h1>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#688961]">
                            Galpón: {produccion.galpon || 'N/A'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            setFormEditLote({ ...produccion })
                            setShowEditLoteModal(true)
                        }}
                        className="material-symbols-outlined text-gray-400 hover:text-primary transition-colors"
                    >
                        edit
                    </button>
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
                        <div className="bg-[#f1f4f0] dark:bg-[#1a2618] rounded-2xl p-4 border border-[#dde6db] dark:border-[#2a3528]">
                            <h3 className="font-bold text-[#121811] dark:text-white mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">analytics</span>
                                    Estado del Lote
                                </span>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${produccion.estado === 'activo' ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-500'}`}>
                                    {produccion.estado}
                                </span>
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white dark:bg-[#0a1108] p-3 rounded-xl border border-[#dde6db] dark:border-[#2a3528]">
                                    <p className="text-[10px] font-bold text-[#688961] uppercase">Población Actual</p>
                                    <p className="text-xl font-black text-primary">{produccion.cantidad_actual}</p>
                                    <p className="text-[9px] text-gray-500 mt-1">Inició con {produccion.cantidad_inicial}</p>
                                </div>
                                <div className="bg-white dark:bg-[#0a1108] p-3 rounded-xl border border-[#dde6db] dark:border-[#2a3528]">
                                    <p className="text-[10px] font-bold text-[#688961] uppercase">Bajas (Muertes)</p>
                                    <p className="text-xl font-black text-red-500">{produccion.cantidad_inicial - (produccion.cantidad_actual + ingresos.reduce((acc, i) => acc + (i.cantidad_vendida || 0), 0))}</p>
                                    <p className="text-[9px] text-gray-500 mt-1">Estimado no vendidas</p>
                                </div>
                            </div>

                            {produccion.estado === 'activo' && (
                                <button
                                    onClick={() => setShowMortalidadModal(true)}
                                    className="w-full mt-4 bg-white dark:bg-transparent border border-red-500/30 text-red-500 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">skull</span>
                                    Reportar Mortalidad
                                </button>
                            )}
                        </div>

                        <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
                            <h4 className="text-xs font-bold text-primary uppercase mb-2">Rentabilidad Estimada</h4>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-2xl font-black text-primary">{formatCurrency(balance)}</p>
                                    <p className="text-[10px] text-[#688961]">Utilidad neta a la fecha</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-lg font-black ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {totalGastos > 0 ? ((balance / totalGastos) * 100).toFixed(1) : 0}%
                                    </p>
                                    <p className="text-[10px] text-[#688961]">Margen</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'gastos' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="font-bold text-[#121811] dark:text-white">Inversiones y Costos</h3>
                            <button
                                onClick={() => setShowGastoModal(true)}
                                className="size-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                        </div>
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
                    </div>
                )}

                {activeTab === 'ventas' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="font-bold text-[#121811] dark:text-white">Ventas Realizadas</h3>
                            <button
                                onClick={() => setShowVentaModal(true)}
                                className="size-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                        </div>
                        <div className="space-y-3">
                            {ingresos.length === 0 ? (
                                <div className="text-center py-12 text-[#688961] bg-[#f1f4f0] dark:bg-[#1a2618] rounded-2xl border border-dashed border-[#dde6db] dark:border-[#2a3528]">
                                    No hay ventas registradas
                                </div>
                            ) : (
                                ingresos.map(i => (
                                    <div key={i.id} className="bg-white dark:bg-[#1a2618] p-4 rounded-xl border border-[#dde6db] dark:border-[#2a3528] flex justify-between items-center shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                                                <span className="material-symbols-outlined text-xl">shopping_bag</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-[#121811] dark:text-white text-sm">{i.peso_total || i.kilos_vendidos} Kg</p>
                                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${i.estado_pago === 'debe' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                        {i.estado_pago || 'Pagado'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-[#688961] uppercase font-bold">{formatDateShort(i.fecha)} • {i.cliente || 'Consumidor'}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    {i.estado_pago === 'debe' && (
                                                        <button
                                                            onClick={() => handleMarkAsPaid(i.id)}
                                                            className="text-[9px] font-bold text-primary underline underline-offset-2 flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                                            Pagar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleEditVenta(i)}
                                                        className="text-[9px] font-bold text-blue-500 underline underline-offset-2 flex items-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined text-[12px]">edit</span>
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteVenta(i)}
                                                        className="text-[9px] font-bold text-red-500 underline underline-offset-2 flex items-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined text-[12px]">delete</span>
                                                        Borrar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-green-600">{formatCurrency(i.monto_total)}</p>
                                            <p className="text-[9px] text-gray-500">${i.precio_kilo || 13}/kg</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            {showGastoModal && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-[#0a1108] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 border-x border-t border-[#dde6db] dark:border-[#2a3528]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-[#121811] dark:text-white">Nuevo Gasto</h3>
                            <button onClick={() => setShowGastoModal(false)} className="size-10 rounded-full bg-gray-100 dark:bg-[#1a2618] flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAddGasto} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Concepto</label>
                                <input
                                    type="text" required
                                    value={formGasto.concepto}
                                    onChange={e => setFormGasto({ ...formGasto, concepto: e.target.value })}
                                    className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary"
                                    placeholder="Ej: Bulto de alimento"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Categoría</label>
                                    <select
                                        value={formGasto.categoria}
                                        onChange={e => setFormGasto({ ...formGasto, categoria: e.target.value })}
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary"
                                    >
                                        <option value="alimento">Alimentación</option>
                                        <option value="medicina">Medicina</option>
                                        <option value="insumos">Insumos</option>
                                        <option value="otros">Otros</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Monto ($)</label>
                                    <input
                                        type="number" required
                                        value={formGasto.monto}
                                        onChange={e => setFormGasto({ ...formGasto, monto: e.target.value })}
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary font-bold"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-red-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-all mt-4">
                                REGISTRAR GASTO
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showVentaModal && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-[#0a1108] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 border-x border-t border-[#dde6db] dark:border-[#2a3528] max-h-[95vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-[#121811] dark:text-white">Nueva Venta</h3>
                            <button onClick={() => setShowVentaModal(false)} className="size-10 rounded-full bg-gray-100 dark:bg-[#1a2618] flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAddVenta} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Cliente</label>
                                <select
                                    value={formVenta.cliente}
                                    onChange={e => setFormVenta({ ...formVenta, cliente: e.target.value })}
                                    className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary"
                                >
                                    <option value="">Consumidor Final</option>
                                    {recentClients.map((client, idx) => (
                                        <option key={idx} value={client.nombre}>{client.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Cant. (Aves)</label>
                                    <input
                                        type="number" required
                                        value={formVenta.cantidad}
                                        onChange={e => setFormVenta({ ...formVenta, cantidad: e.target.value })}
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Peso Total (Kg)</label>
                                        <input
                                            type="number" step="0.01" required
                                            value={formVenta.weight || formVenta.peso_total}
                                            onChange={e => setFormVenta(prev => updateVentaCalculations('peso_total', e.target.value, prev))}
                                            className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary font-bold"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Precio por Kilo ($)</label>
                                        <input
                                            type="number"
                                            value={formVenta.precio_kilo}
                                            onChange={e => setFormVenta(prev => updateVentaCalculations('precio_kilo', e.target.value, prev))}
                                            className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary"
                                            placeholder="13000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Monto Total de la Venta ($)</label>
                                    <input
                                        type="number" step="0.01"
                                        value={formVenta.monto_total}
                                        onChange={e => setFormVenta(prev => updateVentaCalculations('monto_total', e.target.value, prev))}
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-lg focus:ring-2 ring-primary font-black text-primary"
                                        placeholder="0.00"
                                    />
                                    <p className="text-[9px] text-[#688961] mt-1 px-1">Puedes ingresar el peso o el monto total y el otro se calculará.</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Estado del Pago</label>
                                    <select
                                        value={formVenta.estado_pago}
                                        onChange={e => setFormVenta({ ...formVenta, estado_pago: e.target.value })}
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary"
                                    >
                                        <option value="pagado">Pagado (Completado)</option>
                                        <option value="debe">Debe (Pendiente)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl flex justify-between items-center text-primary font-black uppercase text-[10px]">
                                <span>Resumen de Operación</span>
                                <span>{formatCurrency(formVenta.monto_total || 0)}</span>
                            </div>
                            <button type="submit" className="w-full bg-primary text-black font-black py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
                                CONFIRMAR VENTA
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showEditVentaModal && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-[#0a1108] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 border-x border-t border-[#dde6db] dark:border-[#2a3528] max-h-[95vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-blue-500">Editar Venta</h3>
                            <button onClick={() => { setShowEditVentaModal(false); setSelectedVenta(null); }} className="size-10 rounded-full bg-gray-100 dark:bg-[#1a2618] flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateVenta} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Cliente</label>
                                <select
                                    value={formVenta.cliente}
                                    onChange={e => setFormVenta({ ...formVenta, cliente: e.target.value })}
                                    className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary"
                                >
                                    <option value="">Consumidor Final</option>
                                    {recentClients.map((client, idx) => (
                                        <option key={idx} value={client.nombre}>{client.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Cant. (Aves)</label>
                                    <input
                                        type="number" required
                                        value={formVenta.cantidad}
                                        onChange={e => setFormVenta({ ...formVenta, cantidad: e.target.value })}
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Peso Total (Kg)</label>
                                        <input
                                            type="number" step="0.01" required
                                            value={formVenta.peso_total}
                                            onChange={e => setFormVenta(prev => updateVentaCalculations('peso_total', e.target.value, prev))}
                                            className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Precio por Kilo ($)</label>
                                        <input
                                            type="number"
                                            value={formVenta.precio_kilo}
                                            onChange={e => setFormVenta(prev => updateVentaCalculations('precio_kilo', e.target.value, prev))}
                                            className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Monto Total ($)</label>
                                    <input
                                        type="number" step="0.01"
                                        value={formVenta.monto_total}
                                        onChange={e => setFormVenta(prev => updateVentaCalculations('monto_total', e.target.value, prev))}
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary font-bold text-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Estado</label>
                                    <select
                                        value={formVenta.estado_pago}
                                        onChange={e => setFormVenta({ ...formVenta, estado_pago: e.target.value })}
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary"
                                    >
                                        <option value="pagado">Pagado</option>
                                        <option value="debe">Debe</option>
                                    </select>
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl flex justify-between items-center text-blue-500 font-black uppercase text-[10px]">
                                <span>Resumen de Edición</span>
                                <span>{formatCurrency(formVenta.monto_total || 0)}</span>
                            </div>
                            <button type="submit" className="w-full bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                                GUARDAR CAMBIOS
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showMortalidadModal && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-[#0a1108] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 border-x border-t border-[#dde6db] dark:border-[#2a3528] max-h-[95vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-red-500">Reportar Mortalidad</h3>
                            <button onClick={() => setShowMortalidadModal(false)} className="size-10 rounded-full bg-gray-100 dark:bg-[#1a2618] flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAddMortalidad} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Cantidad de Bajas</label>
                                <input
                                    type="number" required
                                    value={formMortalidad.cantidad}
                                    onChange={e => setFormMortalidad({ ...formMortalidad, cantidad: e.target.value })}
                                    className="w-full bg-red-50 dark:bg-red-900/10 border-0 rounded-2xl p-4 text-lg font-black text-red-500 focus:ring-2 ring-red-500"
                                    placeholder="0"
                                />
                                <p className="text-[10px] text-gray-500 mt-2 px-1">Se descontarán de la población actual inmediatamente.</p>
                            </div>
                            <button type="submit" className="w-full bg-red-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-all mt-4">
                                CONFIRMAR BAJAS
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showEditLoteModal && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-[#0a1108] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 border-x border-t border-[#dde6db] dark:border-[#2a3528] max-h-[95vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-[#121811] dark:text-white">Editar Lote</h3>
                            <button onClick={() => setShowEditLoteModal(false)} className="size-10 rounded-full bg-gray-100 dark:bg-[#1a2618] flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateLote} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Nombre</label>
                                <input
                                    type="text" required
                                    value={formEditLote.nombre}
                                    onChange={e => setFormEditLote({ ...formEditLote, nombre: e.target.value })}
                                    className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Galpón</label>
                                <input
                                    type="text"
                                    value={formEditLote.galpon}
                                    onChange={e => setFormEditLote({ ...formEditLote, galpon: e.target.value })}
                                    className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Población Actual</label>
                                    <input
                                        type="number" required
                                        value={formEditLote.cantidad_actual}
                                        onChange={e => setFormEditLote({ ...formEditLote, cantidad_actual: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#688961] mb-2 px-1">Estado</label>
                                    <select
                                        value={formEditLote.estado}
                                        onChange={e => setFormEditLote({ ...formEditLote, estado: e.target.value })}
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-0 rounded-2xl p-4 text-sm focus:ring-2 ring-primary"
                                    >
                                        <option value="activo">Activo</option>
                                        <option value="finalizado">Finalizado</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-primary text-black font-black py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all mt-4">
                                GUARDAR CAMBIOS
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <BottomNavigation />
        </div>
    )
}

export default PollosDetalle
