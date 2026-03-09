import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getLotes, createLote, deleteLote, createVenta, createGasto } from '../services/gallinas'
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
    const [selectedLote, setSelectedLote] = useState(null)
    const [unidadMedida, setUnidadMedida] = useState('carton')
    const [recentClients, setRecentClients] = useState([])

    const [formLote, setFormLote] = useState({
        nombre: '',
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
        setLoading(false)
    }

    const handleSubmitLote = async (e) => {
        e.preventDefault()

        const loteData = {
            nombre: 'Lote Principal',
            raza: 'No especificada',
            poblacion_inicial: parseInt(formLote.poblacion_inicial),
            poblacion_actual: parseInt(formLote.poblacion_inicial),
            fecha_inicio: formLote.fecha_inicio || new Date().toISOString().split('T')[0],
            user_id: user.id,
            edad_semanas: 0
        }

        const { data: newLote, error } = await createLote(loteData)

        if (!error && newLote) {
            // Registrar gasto automático si hay precio
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
                nombre: '',
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
        const montoTotal = formVenta.cantidad * formVenta.precio_unitario

        const { error } = await createVenta({
            lote_id: selectedLote.id,
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
            setSelectedLote(null)
            loadLotes()
            loadClients()
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este lote?')) {
            await deleteLote(id)
            loadLotes()
        }
    }

    const calcularTotal = () => {
        if (!formVenta.cantidad || !formVenta.precio_unitario) return 0
        return formVenta.cantidad * formVenta.precio_unitario
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
                        <h2 className="text-[#121811] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Gallinas de Postura</h2>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#688961]">Gestión de Lotes</span>
                    </div>
                    <div className="flex w-12 items-center justify-end">
                        {lotes.length === 0 && (
                            <button
                                onClick={() => setShowFormLote(true)}
                                className="flex items-center justify-center overflow-hidden rounded-lg h-12 bg-transparent text-primary"
                            >
                                <span className="material-symbols-outlined">add_circle</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Lista de Lotes */}
                <div className="flex-1 p-4 pb-24">
                    {loading ? (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-4xl text-primary animate-pulse">egg</span>
                            <p className="text-[#688961] mt-2">Cargando lotes...</p>
                        </div>
                    ) : lotes.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-6xl text-[#688961] opacity-50">egg</span>
                            <p className="text-[#121811] dark:text-white font-bold mt-4">No hay lotes registrados</p>
                            <p className="text-[#688961] text-sm mt-2">Crea tu primer lote de gallinas</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {lotes.map((lote) => (
                                <div
                                    key={lote.id}
                                    onClick={() => navigate(`/gallinas/${lote.id}`)}
                                    className="bg-[#f1f4f0] dark:bg-[#1a2618] rounded-xl p-5 border border-[#dde6db] dark:border-[#2a3528] shadow-sm cursor-pointer active:scale-[0.98] transition-all"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-[#121811] dark:text-white text-lg font-bold">{lote.nombre}</h3>
                                            <p className="text-[#688961] text-sm">{lote.raza || 'Sin raza especificada'}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(lote.id);
                                            }}
                                            className="text-red-500 hover:text-red-600"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className="bg-white dark:bg-[#0a1108] p-2 rounded-lg">
                                            <p className="text-[#688961] text-xs">Población</p>
                                            <p className="text-[#121811] dark:text-white font-bold">{lote.poblacion_actual || lote.poblacion_inicial}</p>
                                        </div>
                                        <div className="bg-white dark:bg-[#0a1108] p-2 rounded-lg">
                                            <p className="text-[#688961] text-xs">Producción</p>
                                            <p className="text-[#121811] dark:text-white font-bold">{lote.porcentaje_produccion || 0}%</p>
                                        </div>
                                        <div className="bg-white dark:bg-[#0a1108] p-2 rounded-lg">
                                            <p className="text-[#688961] text-xs">Edad (Sem)</p>
                                            <p className="text-[#121811] dark:text-white font-bold">
                                                {calcularEdadActual(lote.fecha_inicio, lote.edad_semanas)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedLote(lote);
                                                setShowFormVenta(true);
                                            }}
                                            className="flex-1 bg-primary text-black font-bold py-2 px-3 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">shopping_basket</span>
                                            <span className="text-sm">Venta</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                /* Logic for Gasto modal if any, or navigate */
                                                navigate(`/gallinas/${lote.id}`)
                                            }}
                                            className="flex-1 bg-[#dde6db] dark:bg-[#2a3528] text-[#121811] dark:text-white font-bold py-2 px-3 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">visibility</span>
                                            <span className="text-sm">Detalles</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Form Modal: Nuevo Lote */}
                {showFormLote && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#1a2618] rounded-2xl p-6 max-w-md w-full border-2 border-primary/30">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-[#121811] dark:text-white">Nuevo Lote</h3>
                                <button onClick={() => setShowFormLote(false)}>
                                    <span className="material-symbols-outlined text-gray-400">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmitLote} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Gallinas en Producción</label>
                                    <input
                                        type="number"
                                        value={formLote.poblacion_inicial}
                                        onChange={(e) => setFormLote({ ...formLote, poblacion_inicial: e.target.value })}
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-2xl font-black text-[#121811] dark:text-white mb-8"
                                        placeholder="Ej: 1200"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-primary text-black font-black px-6 py-3 rounded-lg shadow-md hover:bg-opacity-90 transition-all"
                                >
                                    Crear Lote
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Form Modal: Nueva Venta */}
                {showFormVenta && selectedLote && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#1a2618] rounded-2xl p-6 max-w-md w-full border-2 border-primary/30">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-[#121811] dark:text-white">Nueva Venta</h3>
                                <button onClick={() => {
                                    setShowFormVenta(false)
                                    setSelectedLote(null)
                                }}>
                                    <span className="material-symbols-outlined text-gray-400">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleSubmitVenta} className="space-y-4">
                                {/* Segmented Control */}
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
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Estado de Pago</label>
                                    <select
                                        value={formVenta.estado_pago}
                                        onChange={(e) => setFormVenta({ ...formVenta, estado_pago: e.target.value })}
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-[#121811] dark:text-white mb-2"
                                    >
                                        <option value="pagado">Pagado (Caja)</option>
                                        <option value="debe">Crédito (Debe)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Cliente (Opcional)</label>
                                    <select
                                        value={formVenta.cliente}
                                        onChange={(e) => setFormVenta({ ...formVenta, cliente: e.target.value })}
                                        className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-[#121811] dark:text-white"
                                    >
                                        <option value="">Consumidor Final</option>
                                        {recentClients.map((client, idx) => (
                                            <option key={idx} value={client.nombre}>{client.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Cantidad</label>
                                        <input
                                            type="number"
                                            value={formVenta.cantidad}
                                            onChange={(e) => setFormVenta({ ...formVenta, cantidad: e.target.value })}
                                            className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-lg font-bold text-[#121811] dark:text-white"
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
                                            className="w-full bg-white dark:bg-[#0a1108] border border-[#dde6db] dark:border-[#2a3528] rounded-lg p-3 text-lg font-bold text-[#121811] dark:text-white"
                                            placeholder="$0.00"
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

                {/* Bottom safe area */}
                <div className="h-20"></div>
                <BottomNavigation />
            </div>
        </div >
    )
}

export default GallinasPosura
