import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getLotes, createLote, deleteLote, createVenta, createGasto, createAporte } from '../services/gallinas'
import { getAllRecentClients } from '../services/clients'
import { formatCurrency } from '../utils/formatters'
import BottomNavigation from '../components/BottomNavigation'

const GallinasPosura = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [lotes, setLotes] = useState([])
    const [loading, setLoading] = useState(true)
    const [showFormLote, setShowFormLote] = useState(false)
    const [showFormVenta, setShowFormVenta] = useState(false)
    const [showFormAporte, setShowFormAporte] = useState(false)
    const [showFormGasto, setShowFormGasto] = useState(false)
    const [selectedLote, setSelectedLote] = useState(null)
    const [unidadMedida, setUnidadMedida] = useState('carton')
    const [recentClients, setRecentClients] = useState([])

    const [formLote, setFormLote] = useState({
        nombre: 'Lote Único',
        raza: '',
        poblacion_inicial: '',
        precio_unitario: '',
        edad_inicial: '',
        fecha_inicio: new Date().toISOString().split('T')[0]
    })

    const [formVenta, setFormVenta] = useState({
        cantidad: '',
        precio_unitario: 13000,
        estado_pago: 'debe',
        cliente: ''
    })

    const [formGasto, setFormGasto] = useState({
        concepto: '',
        monto: '',
        categoria: 'alimento'
    })

    const [formAporte, setFormAporte] = useState({
        concepto: '',
        monto: '',
        socios: 'Brayan, Zory'
    })

    useEffect(() => {
        loadLotes()
        loadClients()
    }, [user])

    const loadClients = async () => {
        if (!user) return
        const { data } = await getAllRecentClients(user.id)
        setRecentClients(data || [])
    }

    const loadLotes = async () => {
        if (!user) return
        setLoading(true)
        const { data } = await getLotes(user.id)
        setLotes(data || [])
        
        // Si hay al menos un lote, seleccionarlo por defecto para operaciones rápidas
        if (data && data.length > 0) {
            setSelectedLote(data[0])
        }
        
        setLoading(false)
    }

    const handleSubmitLote = async (e) => {
        e.preventDefault()

        const loteData = {
            nombre: formLote.nombre || 'Lote Principal',
            raza: formLote.raza || 'No especificada',
            poblacion_inicial: parseInt(formLote.poblacion_inicial),
            poblacion_actual: parseInt(formLote.poblacion_inicial),
            fecha_inicio: formLote.fecha_inicio || new Date().toISOString().split('T')[0],
            user_id: user.id,
            edad_semanas: parseInt(formLote.edad_inicial) || 0
        }

        const { data: newLote, error } = await createLote(loteData)

        if (!error && newLote) {
            if (formLote.precio_unitario && parseFloat(formLote.precio_unitario) > 0) {
                const montoTotal = parseInt(formLote.poblacion_inicial) * parseFloat(formLote.precio_unitario)
                try {
                    await createGasto({
                        lote_id: newLote.id,
                        concepto: 'Compra inicial de aves',
                        monto: montoTotal,
                        categoria: 'aves',
                        user_id: user.id,
                        fecha: formLote.fecha_inicio
                    })
                } catch (err) {
                    console.error('Error al crear gasto inicial:', err)
                }
            }

            setShowFormLote(false)
            setFormLote({
                nombre: 'Lote Único',
                raza: '',
                poblacion_inicial: '',
                precio_unitario: '',
                edad_inicial: '',
                fecha_inicio: new Date().toISOString().split('T')[0]
            })
            loadLotes()
        }
    }

    const calcularEdadActual = (fechaInicio, edadInicialSem) => {
        if (!fechaInicio) return 0
        const [year, month, day] = fechaInicio.split('-').map(Number)
        const inicio = new Date(year, month - 1, day)
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)

        const diffTime = hoy - inicio
        if (diffTime < 0) return parseInt(edadInicialSem) || 0

        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7))
        return (parseInt(edadInicialSem) || 0) + diffWeeks
    }

    const handleSubmitVenta = async (e) => {
        e.preventDefault()
        const targetLote = selectedLote || lotes[0]
        if (!targetLote) return

        const montoTotal = formVenta.cantidad * formVenta.precio_unitario

        const { error } = await createVenta({
            lote_id: targetLote.id,
            unidad_medida: unidadMedida,
            cantidad: parseInt(formVenta.cantidad),
            precio_unitario: parseFloat(formVenta.precio_unitario),
            monto_total: montoTotal,
            estado_pago: formVenta.estado_pago,
            concepto: `Venta de huevos (${unidadMedida === 'carton' ? 'Cartones' : 'Unidades'})`,
            cliente: formVenta.cliente || null,
            user_id: user.id,
            fecha: new Date().toISOString().split('T')[0]
        })

        if (!error) {
            setShowFormVenta(false)
            setFormVenta({
                cantidad: '',
                precio_unitario: unidadMedida === 'carton' ? 13000 : 400,
                estado_pago: 'debe',
                cliente: ''
            })
            loadLotes()
            loadClients()
        }
    }

    const handleSubmitGasto = async (e) => {
        e.preventDefault()
        const targetLote = selectedLote || lotes[0]
        if (!targetLote) return

        const { error } = await createGasto({
            lote_id: targetLote.id,
            concepto: formGasto.concepto,
            monto: parseFloat(formGasto.monto),
            categoria: formGasto.categoria,
            user_id: user.id,
            fecha: new Date().toISOString().split('T')[0]
        })

        if (!error) {
            setShowFormGasto(false)
            setFormGasto({ concepto: '', monto: '', categoria: 'alimento' })
            loadLotes()
        }
    }

    const handleSubmitAporte = async (e) => {
        e.preventDefault()
        const targetLote = selectedLote || lotes[0]
        if (!targetLote) return

        const { error } = await createAporte({
            lote_id: targetLote.id,
            concepto: formAporte.concepto,
            monto: parseFloat(formAporte.monto),
            socios: formAporte.socios,
            user_id: user.id,
            fecha: new Date().toISOString().split('T')[0]
        })

        if (!error) {
            alert('Aporte registrado correctamente')
            setShowFormAporte(false)
            setFormAporte({ concepto: '', monto: '', socios: 'Brayan, Zory' })
            loadLotes()
        } else {
            alert('Error al registrar aporte: ' + error.message)
        }
    }

    const calcularTotal = () => {
        if (!formVenta.cantidad || !formVenta.precio_unitario) return 0
        return formVenta.cantidad * formVenta.precio_unitario
    }

    const lotePrincipal = lotes[0]

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen">
            <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden max-w-7xl mx-auto bg-white dark:bg-[#0a1108] shadow-xl">
                {/* TopAppBar */}
                <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 ios-blur border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center p-4 pb-2 justify-between">
                        <Link to="/" className="text-gray-900 dark:text-white flex size-12 shrink-0 items-center">
                            <span className="material-symbols-outlined">arrow_back_ios</span>
                        </Link>
                        <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
                            Gallinas de Postura
                        </h2>
                        <div className="flex w-12 items-center justify-end">
                            {!lotePrincipal && (
                                <button onClick={() => setShowFormLote(true)} className="text-primary">
                                    <span className="material-symbols-outlined">add_circle</span>
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Premium Action Bar */}
                <div className="px-4 pt-6 grid grid-cols-3 gap-4">
                    <button
                        onClick={() => setShowFormVenta(true)}
                        disabled={!lotePrincipal}
                        className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-100 dark:border-blue-800 transition-all active:scale-95 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 group disabled:opacity-50"
                    >
                        <div className="size-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/40 group-hover:rotate-6 transition-transform">
                            <span className="material-symbols-outlined text-3xl">egg</span>
                        </div>
                        <span className="text-[11px] font-black text-blue-800 dark:text-blue-300 uppercase tracking-tight text-center leading-none">Vender<br/>Huevos</span>
                    </button>
                    <button
                        onClick={() => setShowFormGasto(true)}
                        disabled={!lotePrincipal}
                        className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-800 transition-all active:scale-95 hover:shadow-xl hover:border-red-300 dark:hover:border-red-700 group disabled:opacity-50"
                    >
                        <div className="size-14 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-500/40 group-hover:-rotate-6 transition-transform">
                            <span className="material-symbols-outlined text-3xl">payments</span>
                        </div>
                        <span className="text-[11px] font-black text-red-800 dark:text-red-300 uppercase tracking-tight text-center leading-none">Registrar<br/>Gasto</span>
                    </button>
                    <button
                        onClick={() => {
                            if (lotePrincipal) {
                                navigate(`/gallinas/${lotePrincipal.id}`)
                            } else {
                                setShowFormLote(true)
                            }
                        }}
                        className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-primary/10 dark:bg-primary/5 border-2 border-primary/20 dark:border-primary/10 transition-all active:scale-95 hover:shadow-xl hover:border-primary/40 group"
                    >
                        <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-black shadow-xl shadow-primary/40 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-3xl font-bold">
                                {lotePrincipal ? 'visibility' : 'add'}
                            </span>
                        </div>
                        <span className="text-[11px] font-black text-primary-dark dark:text-primary uppercase tracking-tight text-center leading-none">
                            {lotePrincipal ? 'Ver\nDetalles' : 'Nuevo\nLote'}
                        </span>
                    </button>
                    <button
                        onClick={() => setShowFormAporte(true)}
                        disabled={!lotePrincipal}
                        className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-100 dark:border-orange-800 transition-all active:scale-95 hover:shadow-xl hover:border-orange-300 dark:hover:border-orange-700 group col-span-3 disabled:opacity-50"
                    >
                        <div className="size-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/40 group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-2xl">potted_plant</span>
                        </div>
                        <span className="text-[11px] font-black text-orange-800 dark:text-orange-300 uppercase tracking-tight text-center leading-none">Registrar Aporte de Capital</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 pb-24">
                    {loading ? (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-4xl text-primary animate-pulse">egg</span>
                            <p className="text-[#688961] mt-2">Cargando...</p>
                        </div>
                    ) : !lotePrincipal ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-6xl text-gray-300">egg</span>
                            <p className="text-gray-500 font-bold mt-4">No hay lote activo</p>
                            <button onClick={() => setShowFormLote(true)} className="mt-4 text-primary font-bold">Crear Lote Principal</button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Lote Info Card */}
                            <div className="bg-[#f1f4f0] dark:bg-[#1a2618] rounded-3xl p-6 border border-[#dde6db] dark:border-[#2a3528] shadow-sm">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-[#121811] dark:text-white uppercase tracking-tighter">{lotePrincipal.nombre}</h3>
                                        <p className="text-[#688961] text-xs font-bold uppercase">{lotePrincipal.raza || 'Sin raza'}</p>
                                    </div>
                                    <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase">Activo</div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white dark:bg-[#0a1108] p-4 rounded-2xl border border-[#dde6db] dark:border-[#2a3528] flex flex-col items-center">
                                        <p className="text-[#688961] text-[9px] uppercase font-bold mb-1">Gallinas</p>
                                        <p className="text-[#121811] dark:text-white font-black text-lg">{lotePrincipal.poblacion_actual}</p>
                                    </div>
                                    <div className="bg-white dark:bg-[#0a1108] p-4 rounded-2xl border border-[#dde6db] dark:border-[#2a3528] flex flex-col items-center">
                                        <p className="text-[#688961] text-[9px] uppercase font-bold mb-1">Prod. Hoy</p>
                                        <p className="text-primary font-black text-lg">{lotePrincipal.porcentaje_produccion || 0}%</p>
                                    </div>
                                    <div className="bg-white dark:bg-[#0a1108] p-4 rounded-2xl border border-[#dde6db] dark:border-[#2a3528] flex flex-col items-center">
                                        <p className="text-[#688961] text-[9px] uppercase font-bold mb-1">Edad Sem.</p>
                                        <p className="text-[#121811] dark:text-white font-black text-lg">
                                            {calcularEdadActual(lotePrincipal.fecha_inicio, lotePrincipal.edad_semanas)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modals are consolidated here */}
                {/* Nuevo Lote */}
                {showFormLote && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#1a2618] rounded-2xl p-6 max-w-md w-full border-2 border-primary/30">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-[#121811] dark:text-white">Nuevo Lote de Gallinas</h3>
                                <button onClick={() => setShowFormLote(false)}>
                                    <span className="material-symbols-outlined text-gray-400">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmitLote} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Cantidad Inicial</label>
                                    <input
                                        type="number"
                                        value={formLote.poblacion_inicial}
                                        onChange={(e) => setFormLote({ ...formLote, poblacion_inicial: e.target.value })}
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-2xl font-black text-[#121811] dark:text-white"
                                        placeholder="Ej: 1200"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Edad Inicial (Sem)</label>
                                        <input
                                            type="number"
                                            value={formLote.edad_inicial}
                                            onChange={(e) => setFormLote({ ...formLote, edad_inicial: e.target.value })}
                                            className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-sm"
                                            placeholder="18"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Precio Compra</label>
                                        <input
                                            type="number"
                                            value={formLote.precio_unitario}
                                            onChange={(e) => setFormLote({ ...formLote, precio_unitario: e.target.value })}
                                            className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-sm"
                                            placeholder="$0.00"
                                        />
                                    </div>
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

                {/* Nueva Venta */}
                {showFormVenta && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#1a2618] rounded-2xl p-6 max-w-md w-full border-2 border-primary/30">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-[#121811] dark:text-white">Nueva Venta</h3>
                                <button onClick={() => setShowFormVenta(false)}>
                                    <span className="material-symbols-outlined text-gray-400">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleSubmitVenta} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Unidad de Medida</label>
                                    <div className="flex bg-[#dde6db] dark:bg-[#2a3528] p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUnidadMedida('carton')
                                                setFormVenta({ ...formVenta, precio_unitario: 13000 })
                                            }}
                                            className={`flex-1 py-2 text-sm font-bold rounded-md ${unidadMedida === 'carton' ? 'bg-white dark:bg-primary dark:text-black shadow-sm' : 'text-[#688961] dark:text-gray-400'}`}
                                        >
                                            Cartón (30)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUnidadMedida('unidad')
                                                setFormVenta({ ...formVenta, precio_unitario: 400 })
                                            }}
                                            className={`flex-1 py-2 text-sm font-bold rounded-md ${unidadMedida === 'unidad' ? 'bg-white dark:bg-primary dark:text-black shadow-sm' : 'text-[#688961] dark:text-gray-400'}`}
                                        >
                                            Unidad
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Cliente</label>
                                    <input
                                        type="text"
                                        list="clientes-list"
                                        value={formVenta.cliente}
                                        onChange={(e) => setFormVenta({ ...formVenta, cliente: e.target.value })}
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-sm"
                                        placeholder="Consumidor Final"
                                    />
                                    <datalist id="clientes-list">
                                        {recentClients.map((c, i) => <option key={i} value={c.nombre} />)}
                                    </datalist>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Cantidad</label>
                                        <input
                                            type="number"
                                            value={formVenta.cantidad}
                                            onChange={(e) => setFormVenta({ ...formVenta, cantidad: e.target.value })}
                                            className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-lg font-bold"
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Precio/Unit</label>
                                        <input
                                            type="number"
                                            value={formVenta.precio_unitario}
                                            onChange={(e) => setFormVenta({ ...formVenta, precio_unitario: e.target.value })}
                                            className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-lg font-bold"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[#dde6db] dark:border-[#2a3528] flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-bold text-[#688961] uppercase">Total Venta</p>
                                        <p className="text-2xl font-black text-primary">{formatCurrency(calcularTotal())}</p>
                                    </div>
                                    <button
                                        type="submit"
                                        className="bg-primary text-black font-black px-6 py-2 rounded-lg shadow-md hover:bg-opacity-90 transition-all"
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Nuevo Gasto */}
                {showFormGasto && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#1a2618] rounded-2xl p-6 max-w-md w-full border-2 border-red-200 dark:border-red-900/30">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-[#121811] dark:text-white">Registrar Gasto</h3>
                                <button onClick={() => setShowFormGasto(false)}>
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
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3"
                                        placeholder="Ej: Alimento concentrado"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Monto</label>
                                    <input
                                        type="number"
                                        value={formGasto.monto}
                                        onChange={(e) => setFormGasto({ ...formGasto, monto: e.target.value })}
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-lg font-bold"
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

                {/* Nuevo Aporte */}
                {showFormAporte && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#1a2618] rounded-2xl p-6 max-w-md w-full border-2 border-orange-200 dark:border-orange-900/30">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-[#121811] dark:text-white">Registrar Aporte</h3>
                                <button onClick={() => setShowFormAporte(false)}>
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
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Monto</label>
                                    <input
                                        type="number"
                                        value={formAporte.monto}
                                        onChange={(e) => setFormAporte({ ...formAporte, monto: e.target.value })}
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-lg font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Socios</label>
                                    <input
                                        type="text"
                                        value={formAporte.socios}
                                        onChange={(e) => setFormAporte({ ...formAporte, socios: e.target.value })}
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3"
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

                <BottomNavigation />
            </div>
        </div>
    )
}

export default GallinasPosura
