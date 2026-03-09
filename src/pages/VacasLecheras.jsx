import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getVacas, createVaca, deleteVaca, createProduccion } from '../services/vacas'
import { getAllRecentClients } from '../services/clients'
import { formatCurrency } from '../utils/formatters'
import BottomNavigation from '../components/BottomNavigation'

const VacasLecheras = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [vacas, setVacas] = useState([])
    const [loading, setLoading] = useState(true)
    const [showFormVaca, setShowFormVaca] = useState(false)
    const [showFormProduccion, setShowFormProduccion] = useState(false)
    const [selectedVaca, setSelectedVaca] = useState(null)
    const [filtroEstado, setFiltroEstado] = useState('todas')
    const [recentClients, setRecentClients] = useState([])

    const [formVaca, setFormVaca] = useState({
        nombre: '',
        estado: 'produccion'
    })

    const [formProduccion, setFormProduccion] = useState({
        litros: '',
        precio_por_litro: 3500,
        estado_pago: 'pagado',
        cliente: ''
    })

    useEffect(() => {
        loadVacas()
        loadClients()
    }, [user])

    const loadClients = async () => {
        if (!user) return
        const { data } = await getAllRecentClients(user.id)
        setRecentClients(data || [])
    }

    const loadVacas = async () => {
        if (!user) return
        setLoading(true)
        const { data } = await getVacas(user.id)
        setVacas(data || [])
        setLoading(false)
    }

    const handleSubmitVaca = async (e) => {
        e.preventDefault()
        const { error } = await createVaca({
            ...formVaca,
            user_id: user.id
        })

        if (!error) {
            setShowFormVaca(false)
            setFormVaca({
                nombre: '',
                estado: 'produccion'
            })
            loadVacas()
        }
    }

    const handleSubmitProduccion = async (e) => {
        e.preventDefault()
        const montoTotal = formProduccion.litros * formProduccion.precio_por_litro

        const { error } = await createProduccion({
            vaca_id: selectedVaca.id,
            litros: parseFloat(formProduccion.litros),
            precio_por_litro: parseFloat(formProduccion.precio_por_litro),
            monto_total: montoTotal,
            estado_pago: formProduccion.estado_pago,
            cliente: formProduccion.cliente || null,
            concepto: 'Venta de Leche',
            user_id: user.id,
            fecha: new Date().toISOString().split('T')[0]
        })

        if (!error) {
            setShowFormProduccion(false)
            setFormProduccion({
                litros: '',
                precio_por_litro: 3500,
                estado_pago: 'pagado',
                cliente: ''
            })
            setSelectedVaca(null)
            loadVacas()
            loadClients()
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta vaca del inventario?')) {
            await deleteVaca(id)
            loadVacas()
        }
    }

    const calcularTotalProduccion = () => {
        if (!formProduccion.litros || !formProduccion.precio_por_litro) return 0
        return formProduccion.litros * formProduccion.precio_por_litro
    }

    const vacasFiltradas = vacas.filter(vaca => {
        if (filtroEstado === 'todas') return true
        return vaca.estado === filtroEstado
    })

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'produccion': return 'bg-green-500'
            case 'seca': return 'bg-amber-500'
            case 'enferma': return 'bg-red-500 animate-pulse'
            default: return 'bg-gray-400'
        }
    }

    const getEstadoTexto = (estado) => {
        switch (estado) {
            case 'produccion': return 'Producción'
            case 'seca': return 'Seca'
            case 'enferma': return 'Enferma'
            case 'vendida': return 'Vendida'
            default: return estado
        }
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen">
            <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden max-w-7xl mx-auto bg-white dark:bg-background-dark shadow-xl">
                {/* TopAppBar */}
                <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 ios-blur border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center p-4 pb-2 justify-between">
                        <Link to="/" className="text-gray-900 dark:text-white flex size-12 shrink-0 items-center">
                            <span className="material-symbols-outlined">arrow_back_ios</span>
                        </Link>
                        <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
                            Vacas Lecheras
                        </h2>
                        <div className="flex w-12 items-center justify-end">
                            <button
                                onClick={() => setShowFormVaca(true)}
                                className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary text-black transition-transform active:scale-95"
                            >
                                <span className="material-symbols-outlined text-black">add</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* SearchBar */}
                <div className="px-4 py-4">
                    <label className="flex flex-col min-w-40 h-12 w-full">
                        <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="text-gray-400 flex bg-gray-50 dark:bg-gray-900 items-center justify-center pl-4 rounded-l-xl border-r-0">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border-none bg-gray-50 dark:bg-gray-900 h-full placeholder:text-gray-400 px-4 pl-2 text-base font-medium"
                                placeholder="Buscar por Nombre o ID"
                            />
                        </div>
                    </label>
                </div>

                {/* Chips / Filters */}
                <div className="flex gap-3 px-4 pb-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setFiltroEstado('todas')}
                        className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-sm ${filtroEstado === 'todas' ? 'bg-primary text-black' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'}`}
                    >
                        <p className="text-sm font-bold leading-normal">Todas</p>
                    </button>
                    <button
                        onClick={() => setFiltroEstado('produccion')}
                        className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-sm ${filtroEstado === 'produccion' ? 'bg-primary text-black' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'}`}
                    >
                        <p className="text-sm font-medium leading-normal">Producción</p>
                    </button>
                    <button
                        onClick={() => setFiltroEstado('seca')}
                        className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-sm ${filtroEstado === 'seca' ? 'bg-primary text-black' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'}`}
                    >
                        <p className="text-sm font-medium leading-normal">Secas</p>
                    </button>
                    <button
                        onClick={() => setFiltroEstado('enferma')}
                        className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-sm ${filtroEstado === 'enferma' ? 'bg-primary text-black' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'}`}
                    >
                        <p className="text-sm font-medium leading-normal">Enfermas</p>
                    </button>
                </div>

                {/* Inventory List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 pb-24">
                    {loading ? (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-4xl text-primary animate-pulse">pets</span>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Cargando inventario...</p>
                        </div>
                    ) : vacasFiltradas.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-6xl text-gray-400 opacity-50">pets</span>
                            <p className="text-gray-900 dark:text-white font-bold mt-4">No hay vacas registradas</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                                {filtroEstado === 'todas' ? 'Añade tu primera vaca al inventario' : `No hay vacas en estado: ${getEstadoTexto(filtroEstado)}`}
                            </p>
                        </div>
                    ) : (
                        vacasFiltradas.map((vaca) => (
                            <div
                                key={vaca.id}
                                onClick={() => navigate(`/vacas/${vaca.id}`)}
                                className="flex items-stretch justify-between gap-4 rounded-xl bg-white dark:bg-gray-900 p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow active:bg-gray-50 dark:active:bg-gray-800 mb-3 cursor-pointer"
                            >
                                <div className="flex flex-[2_2_0px] flex-col justify-between">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-primary font-bold text-xs uppercase tracking-widest">ID: {vaca.codigo || 'N/A'}</p>
                                            <span className={`flex h-2 w-2 rounded-full ${getEstadoColor(vaca.estado)}`}></span>
                                        </div>
                                        <p className="text-gray-900 dark:text-white text-lg font-bold leading-tight">{vaca.nombre}</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                            Estado: <span className={vaca.estado === 'enferma' ? 'text-red-600 font-bold' : vaca.estado === 'produccion' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>{getEstadoTexto(vaca.estado)}</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(vaca.id);
                                            }}
                                            className="flex items-center justify-center px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold"
                                        >
                                            Eliminar
                                        </button>
                                        {vaca.estado === 'produccion' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedVaca(vaca)
                                                    setShowFormProduccion(true)
                                                }}
                                                className="flex items-center justify-center px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold gap-1"
                                            >
                                                <span className="material-symbols-outlined text-xs">shopping_basket</span>
                                                Vender Leche
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className="w-32 h-32 bg-center bg-no-repeat bg-cover rounded-xl shrink-0"
                                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDKADJC-8BogGBeeOOptFZFia1aYoaH2-CqhfiKIx33V5C2i3lz-VRbaD_zaCyBLFDs3YH1PPkYmPisivzed5k3VxlNTA8N4D-O5wujtL_qtw6zaXAQBc-6MwoiTWxar92FmiD_X7OT6tEdX8pTkvRhYwqiYsviCFp9vakHICNE5feyiFiCUxuHUxskjVFLC9q2pjG6r9TELy__9yH1QozwZBGeH-grwUYbxU_ze10E5sfOMhPfeiJm_iczqFhlp10eDagnWYsdJIXh")' }}
                                ></div>
                            </div>
                        ))
                    )}
                </div>

                {/* Form Modal: Nueva Vaca */}
                {showFormVaca && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nueva Vaca</h3>
                                <button onClick={() => setShowFormVaca(false)}>
                                    <span className="material-symbols-outlined text-gray-400">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmitVaca} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Nombre</label>
                                    <input
                                        type="text"
                                        value={formVaca.nombre}
                                        onChange={(e) => setFormVaca({ ...formVaca, nombre: e.target.value })}
                                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-white"
                                        placeholder="Ej: Lola"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Estado</label>
                                    <select
                                        value={formVaca.estado}
                                        onChange={(e) => setFormVaca({ ...formVaca, estado: e.target.value })}
                                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-white"
                                    >
                                        <option value="produccion">Producción</option>
                                        <option value="seca">Seca</option>
                                        <option value="enferma">Enferma</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-opacity-90 transition-all"
                                >
                                    Agregar Vaca
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Form Modal: Registrar Producción */}
                {showFormProduccion && selectedVaca && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Venta de Leche</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Vaca: {selectedVaca.nombre}</p>
                                </div>
                                <button onClick={() => {
                                    setShowFormProduccion(false)
                                    setSelectedVaca(null)
                                }}>
                                    <span className="material-symbols-outlined text-gray-400">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmitProduccion} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Litros Vendidos</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formProduccion.litros}
                                        onChange={(e) => setFormProduccion({ ...formProduccion, litros: e.target.value })}
                                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-lg font-bold text-gray-900 dark:text-white"
                                        placeholder="0.0"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Precio por Litro</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formProduccion.precio_por_litro}
                                        onChange={(e) => setFormProduccion({ ...formProduccion, precio_por_litro: e.target.value })}
                                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-lg font-bold text-gray-900 dark:text-white"
                                        placeholder="$0.00"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Estado de Pago</label>
                                    <select
                                        value={formProduccion.estado_pago}
                                        onChange={(e) => setFormProduccion({ ...formProduccion, estado_pago: e.target.value })}
                                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-white"
                                    >
                                        <option value="pagado">Pagado (Caja)</option>
                                        <option value="debe">Crédito (Debe)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Cliente</label>
                                    <select
                                        value={formProduccion.cliente}
                                        onChange={(e) => setFormProduccion({ ...formProduccion, cliente: e.target.value })}
                                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-white"
                                    >
                                        <option value="">Consumidor Final</option>
                                        {recentClients.map((client, idx) => (
                                            <option key={idx} value={client.nombre}>{client.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Total</p>
                                        <p className="text-2xl font-black text-primary">{formatCurrency(calcularTotalProduccion())}</p>
                                    </div>
                                    <button
                                        type="submit"
                                        className="bg-primary text-black font-bold px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all"
                                    >
                                        Registrar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                <div className="h-20"></div>
                <BottomNavigation />
            </div>
        </div>
    )
}

export default VacasLecheras
