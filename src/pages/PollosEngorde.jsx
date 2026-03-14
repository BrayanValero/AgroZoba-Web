import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProducciones, createProduccion, updateProduccion, deleteProduccion, createGasto, createIngreso, createAporte } from '../services/pollos'
import { getAllRecentClients } from '../services/clients'
import { formatCurrency, formatDateShort } from '../utils/formatters'
import BottomNavigation from '../components/BottomNavigation'

const PollosEngorde = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [producciones, setProducciones] = useState([])
    const [loading, setLoading] = useState(true)

    // UI States
    const [showForm, setShowForm] = useState(false)
    const [showFormGasto, setShowFormGasto] = useState(false)
    const [showFormVenta, setShowFormVenta] = useState(false)
    const [showFormAporte, setShowFormAporte] = useState(false)
    const [selectedProduccion, setSelectedProduccion] = useState(null)

    // Forms
    const [formData, setFormData] = useState({
        nombre: '',
        galpon: '',
        cantidad_inicial: '',
        precio_unitario: '',
        fecha_inicio: new Date().toISOString().split('T')[0]
    })

    const [formGasto, setFormGasto] = useState({
        concepto: '',
        monto: '',
        categoria: 'alimento'
    })

    const [formVenta, setFormVenta] = useState({
        concepto: 'Venta de pollos',
        cantidad: '',
        peso_total: '',
        precio_kilo: 13000,
        cliente: '',
        estado_pago: 'debe',
        monto_total: ''
    })

    const [formAporte, setFormAporte] = useState({
        concepto: '',
        monto: '',
        socios: 'Brayan, Zory'
    })

    const [recentClients, setRecentClients] = useState([])

    useEffect(() => {
        loadProducciones()
    }, [user])

    const loadProducciones = async () => {
        if (!user) return
        setLoading(true)
        const { data } = await getProducciones(user.id)
        setProducciones(data || [])

        // Cargar clientes recientes (todos los módulos)
        const { data: clients } = await getAllRecentClients(user.id)
        setRecentClients(clients || [])

        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // 1. Crear la Producción
        const { data: newProduccion, error } = await createProduccion({
            nombre: formData.nombre,
            galpon: formData.galpon,
            cantidad_inicial: parseInt(formData.cantidad_inicial),
            // precio_unitario removed as it doesn't exist in DB
            fecha_inicio: formData.fecha_inicio,
            user_id: user.id,
            cantidad_actual: parseInt(formData.cantidad_inicial),
            estado: 'activo'
        })

        if (!error && newProduccion) {
            if (formData.precio_unitario && parseFloat(formData.precio_unitario) > 0) {
                // 2. Calcular costo total de pollos
                const costoTotal = parseFloat(formData.cantidad_inicial || 0) * parseFloat(formData.precio_unitario)

                // 3. Crear Gasto Automático
                try {
                    await createGasto({
                        produccion_id: newProduccion.id,
                        concepto: 'Compra inicial de pollos',
                        monto: costoTotal,
                        categoria: 'pollitos',
                        user_id: user.id,
                        fecha: formData.fecha_inicio
                    })
                } catch (err) {
                    console.error('Error al crear gasto automático:', err)
                }
            }

            setShowForm(false)
            setFormData({
                nombre: '',
                galpon: '',
                cantidad_inicial: '',
                precio_unitario: '',
                fecha_inicio: new Date().toISOString().split('T')[0]
            })
            loadProducciones()
        }
    }

    const handleSubmitGasto = async (e) => {
        e.preventDefault()
        const { error } = await createGasto({
            produccion_id: selectedProduccion.id,
            concepto: formGasto.concepto,
            monto: parseFloat(formGasto.monto),
            categoria: formGasto.categoria,
            user_id: user.id,
            fecha: new Date().toISOString().split('T')[0]
        })

        if (!error) {
            setShowFormGasto(false)
            setFormGasto({ concepto: '', monto: '', categoria: 'alimento' })
            setSelectedProduccion(null)
            loadProducciones()
        }
    }

    const handleSubmitAporte = async (e) => {
        e.preventDefault()
        const { error } = await createAporte({
            produccion_id: selectedProduccion.id,
            concepto: formAporte.concepto,
            monto: parseFloat(formAporte.monto),
            socios: formAporte.socios,
            user_id: user.id,
            fecha: new Date().toISOString().split('T')[0]
        })

        if (!error) {
            setShowFormAporte(false)
            setFormAporte({ concepto: '', monto: '', socios: 'Brayan, Zory' })
            setSelectedProduccion(null)
            loadProducciones()
        }
    }

    const handleSubmitVenta = async (e) => {
        e.preventDefault()

        // Priorizar cálculo por peso si existe, sino por unidad (legacy)
        let montoTotal = 0
        const peso = parseFloat(formVenta.peso_total || 0)
        // Usar precio del form o fallback a 13000
        const precio = parseFloat(formVenta.precio_kilo || 13000)
        const cantidad = parseInt(formVenta.cantidad || 0)

        if (peso > 0) {
            montoTotal = peso * precio
        } else {
            // Fallback o lógica antigua si no usan peso
            montoTotal = cantidad * 13000 // Asumiendo precio por unidad o el mismo precio/kilo como aproximación si no hay peso
        }

        const { error } = await createIngreso({
            produccion_id: selectedProduccion.id,
            concepto: `Venta de pollos${formVenta.cliente ? ' - ' + formVenta.cliente : ''}`,
            monto_total: montoTotal,
            cantidad_vendida: cantidad,
            peso_total: peso,
            kilos_vendidos: peso, // Compatibilidad
            precio_kilo: precio,
            precio_por_kilo: precio, // Compatibilidad
            cliente: formVenta.cliente || 'Consumidor Final',
            estado_pago: formVenta.estado_pago,
            fecha: new Date().toISOString().split('T')[0],
            user_id: user.id
        })

        if (!error) {
            // Actualizar cantidad actual del lote
            const nuevaCantidad = selectedProduccion.cantidad_actual - cantidad
            const updates = { cantidad_actual: nuevaCantidad }

            // Auto-finalizar si se vendieron todos
            if (nuevaCantidad <= 0) {
                updates.estado = 'finalizado'
            }

            await updateProduccion(selectedProduccion.id, updates)

            setShowFormVenta(false)
            setFormVenta({
                concepto: 'Venta de pollos',
                cantidad: '',
                peso_total: '',
                precio_kilo: 13000,
                cliente: '',
                estado_pago: 'debe',
                monto_total: ''
            })
            setSelectedProduccion(null)
            loadProducciones()
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta producción?')) {
            await deleteProduccion(id)
            loadProducciones()
        }
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen text-[#121811] dark:text-white">
            <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden max-w-7xl mx-auto bg-white dark:bg-[#0a1108] shadow-2xl">
                {/* TopAppBar */}
                <div className="flex items-center bg-white dark:bg-[#0a1108] p-4 pb-2 justify-between sticky top-0 z-50 border-b border-[#dde6db] dark:border-[#2a3528]">
                    <Link to="/" className="text-[#121811] dark:text-white flex size-12 shrink-0 items-center cursor-pointer">
                        <span className="material-symbols-outlined text-2xl">arrow_back_ios</span>
                    </Link>
                    <div className="flex flex-col items-center">
                        <h2 className="text-[#121811] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Pollos de Engorde</h2>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#688961]">Gestión de Lotes</span>
                    </div>
                    <div className="flex w-12 items-center justify-end">
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center justify-center overflow-hidden rounded-lg h-12 bg-transparent text-primary"
                        >
                            <span className="material-symbols-outlined">add_circle</span>
                        </button>
                    </div>
                </div>

                {/* Lista de Producciones */}
                <div className="flex-1 p-4 pb-24">
                    {loading ? (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-4xl text-primary animate-pulse">flutter_dash</span>
                            <p className="text-[#688961] mt-2">Cargando producciones...</p>
                        </div>
                    ) : producciones.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-6xl text-[#688961] opacity-50">flutter_dash</span>
                            <p className="text-[#121811] dark:text-white font-bold mt-4">No hay producciones registradas</p>
                            <p className="text-[#688961] text-sm mt-2">Crea tu primera producción de pollos</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {producciones.map((prod) => (
                                <div
                                    key={prod.id}
                                    onClick={() => navigate(`/pollos/${prod.id}`)}
                                    className="bg-[#f1f4f0] dark:bg-[#1a2618] rounded-xl p-5 border border-[#dde6db] dark:border-[#2a3528] shadow-sm cursor-pointer active:scale-[0.98] transition-all"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-[#121811] dark:text-white text-lg font-bold">{prod.nombre}</h3>
                                            <p className="text-[#688961] text-sm">{prod.galpon || 'Sin galpón asignado'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`flex size-2 rounded-full ${prod.estado === 'activo' ? 'bg-primary' : 'bg-gray-400'}`}></span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(prod.id);
                                                }}
                                                className="text-red-500 hover:text-red-600 ml-2"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="bg-white dark:bg-[#0a1108] p-2 rounded-lg border border-[#dde6db] dark:border-[#2a3528]">
                                            <p className="text-[#688961] text-[10px] uppercase font-bold text-center">Cant. Actual</p>
                                            <p className="text-[#121811] dark:text-white font-bold text-center text-xs">{prod.cantidad_actual || prod.cantidad_inicial}</p>
                                        </div>
                                        <div className="bg-[#f1f4f0] dark:bg-[#1a2618] p-2 rounded-lg border border-[#dde6db] dark:border-[#2a3528]">
                                            <p className="text-red-500 text-[10px] uppercase font-bold text-center">Inversión Pollo</p>
                                            <p className="text-red-600 font-bold text-center text-xs">
                                                {prod.cantidad_inicial && prod.precio_unitario ? formatCurrency(prod.cantidad_inicial * prod.precio_unitario) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedProduccion(prod);
                                                setShowFormVenta(true);
                                            }}
                                            className="flex-1 bg-primary text-black font-bold py-2 px-3 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-1"
                                            disabled={prod.estado !== 'activo'}
                                        >
                                            <span className="material-symbols-outlined text-sm">shopping_basket</span>
                                            <span className="text-sm">Venta</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedProduccion(prod);
                                                setShowFormGasto(true);
                                            }}
                                            className="flex-1 bg-[#dde6db] dark:bg-[#2a3528] text-[#121811] dark:text-white font-bold py-2 px-3 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-1"
                                            disabled={prod.estado !== 'activo'}
                                        >
                                            <span className="material-symbols-outlined text-sm">receipt_long</span>
                                            <span className="text-sm">Gasto</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedProduccion(prod);
                                                setShowFormAporte(true);
                                            }}
                                            className="flex-1 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-bold py-2 px-3 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-1"
                                            disabled={prod.estado !== 'activo'}
                                        >
                                            <span className="material-symbols-outlined text-sm">potted_plant</span>
                                            <span className="text-sm">Aporte</span>
                                        </button>
                                    </div>

                                    {prod.estado === 'activo' && (
                                        <div className="mt-3">
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`¿Estás seguro de finalizar el lote "${prod.nombre}"? Ya no podrás registrarle más ventas ni gastos.`)) {
                                                        await updateProduccion(prod.id, { estado: 'finalizado' });
                                                        loadProducciones();
                                                    }
                                                }}
                                                className="w-full border-2 border-red-500 text-red-500 font-bold py-2 px-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">flag</span>
                                                <span className="text-sm">Finalizar Lote</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Form Modal: Nueva Produccion */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#1a2618] rounded-2xl p-6 max-w-md w-full border-2 border-primary/30">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-[#121811] dark:text-white">Nuevo Lote de Pollos</h3>
                                <button onClick={() => setShowForm(false)}>
                                    <span className="material-symbols-outlined text-gray-400">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Nombre del Lote</label>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-[#121811] dark:text-white"
                                        placeholder="Ej: Lote A-24"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Cantidad Pollos</label>
                                        <input
                                            type="number"
                                            value={formData.cantidad_inicial}
                                            onChange={(e) => setFormData({ ...formData, cantidad_inicial: e.target.value })}
                                            className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-[#121811] dark:text-white"
                                            placeholder="500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Precio Compra/Unid.</label>
                                        <input
                                            type="number"
                                            value={formData.precio_unitario}
                                            onChange={(e) => setFormData({ ...formData, precio_unitario: e.target.value })}
                                            className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-[#121811] dark:text-white"
                                            placeholder="$0.00"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="bg-primary/10 p-3 rounded-lg flex justify-between items-center mt-6">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Costo Inicial:</span>
                                    <span className="text-xl font-black text-primary">
                                        {formatCurrency((formData.cantidad_inicial && formData.precio_unitario)
                                            ? formData.cantidad_inicial * formData.precio_unitario
                                            : 0)}
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary text-black font-black px-6 py-3 rounded-lg shadow-md hover:bg-opacity-90 transition-all mt-4"
                                >
                                    Crear Lote
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Form Modal: Nuevo Gasto */}
                {showFormGasto && selectedProduccion && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#1a2618] rounded-2xl p-6 max-w-md w-full border-2 border-red-200 dark:border-red-900/30">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-lg text-[#121811] dark:text-white">Registrar Gasto</h3>
                                    <p className="text-xs text-[#688961]">{selectedProduccion.nombre}</p>
                                </div>
                                <button onClick={() => {
                                    setShowFormGasto(false)
                                    setSelectedProduccion(null)
                                }}>
                                    <span className="material-symbols-outlined text-gray-400">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmitGasto} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Concepto</label>
                                    <input
                                        type="text"
                                        value={formGasto.concepto}
                                        onChange={(e) => setFormGasto({ ...formGasto, concepto: e.target.value })}
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-[#121811] dark:text-white"
                                        placeholder="Ej: Alimento balanceado"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Categoría</label>
                                    <select
                                        value={formGasto.categoria}
                                        onChange={(e) => setFormGasto({ ...formGasto, categoria: e.target.value })}
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-[#121811] dark:text-white"
                                    >
                                        <option value="alimento">Alimentación</option>
                                        <option value="medicina">Medicina</option>
                                        <option value="insumos">Insumos</option>
                                        <option value="pollitos">Compra Pollitos</option>
                                        <option value="otros">Otros</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Monto</label>
                                    <input
                                        type="number"
                                        value={formGasto.monto}
                                        onChange={(e) => setFormGasto({ ...formGasto, monto: e.target.value })}
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-lg font-bold text-[#121811] dark:text-white"
                                        placeholder="$0.00"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-red-500 text-white font-black px-6 py-3 rounded-lg shadow-md hover:bg-opacity-90 transition-all"
                                >
                                    Registrar Gasto
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Form Modal: Registrar Venta */}
                {showFormVenta && selectedProduccion && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#1a2618] rounded-2xl p-6 max-w-md w-full border-2 border-primary/30">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-lg text-[#121811] dark:text-white">Registrar Ingreso</h3>
                                    <p className="text-xs text-[#688961]">{selectedProduccion.nombre}</p>
                                </div>
                                <button onClick={() => {
                                    setShowFormVenta(false)
                                    setSelectedProduccion(null)
                                }}>
                                    <span className="material-symbols-outlined text-gray-400">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmitVenta} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Cliente</label>
                                        <input
                                            type="text"
                                            value={formVenta.cliente}
                                            onChange={(e) => setFormVenta({ ...formVenta, cliente: e.target.value })}
                                            className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-[#121811] dark:text-white"
                                            placeholder="Nombre del cliente"
                                            list="clients-list"
                                        />
                                        <datalist id="clients-list">
                                            {recentClients.map(c => <option key={c.id || c.nombre} value={c.nombre} />)}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Cant. (Aves)</label>
                                        <input
                                            type="number"
                                            value={formVenta.cantidad}
                                            onChange={(e) => setFormVenta({ ...formVenta, cantidad: e.target.value })}
                                            className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-[#121811] dark:text-white"
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Peso Total (Kg)</label>
                                        <input
                                            type="number"
                                            value={formVenta.peso_total}
                                            onChange={(e) => setFormVenta({ ...formVenta, peso_total: e.target.value })}
                                            className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-[#121811] dark:text-white"
                                            placeholder="0.00"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Precio / Kilo</label>
                                        <input
                                            type="number"
                                            value={formVenta.precio_kilo}
                                            onChange={(e) => setFormVenta({ ...formVenta, precio_kilo: e.target.value })}
                                            className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-[#121811] dark:text-white"
                                            placeholder="13.00"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Estado Pago</label>
                                        <select
                                            value={formVenta.estado_pago}
                                            onChange={(e) => setFormVenta({ ...formVenta, estado_pago: e.target.value })}
                                            className={`w-full border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 font-bold ${formVenta.estado_pago === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                        >
                                            <option value="pagado">Pagado</option>
                                            <option value="debe">Debe (Crédito)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-[#dde6db] dark:border-[#2a3528] flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-bold text-[#688961] uppercase">Total Venta</p>
                                        <p className="text-2xl font-black text-primary">
                                            {formatCurrency((formVenta.peso_total && formVenta.precio_kilo) ? formVenta.peso_total * formVenta.precio_kilo : 0)}
                                        </p>
                                    </div>
                                    <button
                                        type="submit"
                                        className="bg-primary text-black font-black px-6 py-2 rounded-lg shadow-md hover:bg-opacity-90 transition-all"
                                    >
                                        Registrar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Form Modal: Nuevo Aporte */}
                {showFormAporte && selectedProduccion && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#1a2618] rounded-2xl p-6 max-w-md w-full border-2 border-orange-200 dark:border-orange-900/30">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-lg text-[#121811] dark:text-white">Registrar Aporte</h3>
                                    <p className="text-xs text-[#688961]">{selectedProduccion.nombre}</p>
                                </div>
                                <button onClick={() => {
                                    setShowFormAporte(false)
                                    setSelectedProduccion(null)
                                }}>
                                    <span className="material-symbols-outlined text-gray-400">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmitAporte} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Concepto</label>
                                    <input
                                        type="text"
                                        value={formAporte.concepto}
                                        onChange={(e) => setFormAporte({ ...formAporte, concepto: e.target.value })}
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-[#121811] dark:text-white"
                                        placeholder="Ej: Aporte capital para granos"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Monto</label>
                                    <input
                                        type="number"
                                        value={formAporte.monto}
                                        onChange={(e) => setFormAporte({ ...formAporte, monto: e.target.value })}
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-lg font-bold text-[#121811] dark:text-white"
                                        placeholder="$0.00"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Socio(s) que aportan</label>
                                    <input
                                        type="text"
                                        value={formAporte.socios}
                                        onChange={(e) => setFormAporte({ ...formAporte, socios: e.target.value })}
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-[#121811] dark:text-white"
                                        placeholder="Ej: Socio A, Socio B"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-orange-500 text-white font-black px-6 py-3 rounded-lg shadow-md hover:bg-opacity-90 transition-all"
                                >
                                    Registrar Aporte
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Bottom safe area */}
                <div className="h-8 bg-white dark:bg-[#0a1108]"></div>

                <BottomNavigation />
            </div>
        </div>
    )
}

export default PollosEngorde
