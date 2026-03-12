import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getVacas, createVaca, deleteVaca, createProduccion, createGasto, uploadVacaPhoto } from '../services/vacas'
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
    const [showFormGasto, setShowFormGasto] = useState(false)
    const [selectedVaca, setSelectedVaca] = useState(null)
    const [filtroEstado, setFiltroEstado] = useState('todas')
    const [recentClients, setRecentClients] = useState([])

    const [formVaca, setFormVaca] = useState({
        nombre: '',
        estado: 'produccion',
        codigo: ''
    })
    const [vacaFile, setVacaFile] = useState(null)
    const [vacaPreview, setVacaPreview] = useState(null)
    const [isSaving, setIsSaving] = useState(false)

    const [formProduccion, setFormProduccion] = useState({
        litros: '',
        precio_por_litro: 3500,
        estado_pago: 'pagado',
        cliente: ''
    })

    const [formGasto, setFormGasto] = useState({
        concepto: '',
        monto: '',
        categoria: 'alimento'
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
        setIsSaving(true)
        
        let foto_url = null
        if (vacaFile) {
            const { data, error: uploadError } = await uploadVacaPhoto(vacaFile, user.id)
            if (uploadError) {
                if (uploadError.message?.includes('Bucket not found')) {
                    alert('Error: No se encontró el contenedor "vacas" en Supabase. Por favor, créalo en la sección Storage de tu panel de Supabase.')
                } else {
                    alert('Error al subir la imagen: ' + uploadError.message)
                }
                setIsSaving(false)
                return
            }
            foto_url = data
        }

        const { error } = await createVaca({
            ...formVaca,
            foto_url,
            user_id: user.id
        })

        if (!error) {
            setShowFormVaca(false)
            setFormVaca({
                nombre: '',
                codigo: '',
                estado: 'produccion',
                fecha_nacimiento: '',
                raza: '',
                partos: 0,
                vacunas: '',
                notas: ''
            })
            setVacaFile(null)
            setVacaPreview(null)
            loadVacas()
        }
        setIsSaving(false)
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setVacaFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setVacaPreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmitProduccion = async (e) => {
        e.preventDefault()
        const montoTotal = formProduccion.litros * formProduccion.precio_por_litro

        const { error } = await createProduccion({
            vaca_id: selectedVaca?.id || null,
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

    const handleSubmitGasto = async (e) => {
        e.preventDefault()
        const { error } = await createGasto({
            vaca_id: selectedVaca?.id || null,
            concepto: formGasto.concepto,
            monto: parseFloat(formGasto.monto),
            categoria: formGasto.categoria,
            user_id: user.id,
            fecha: new Date().toISOString().split('T')[0]
        })

        if (!error) {
            setShowFormGasto(false)
            setFormGasto({ concepto: '', monto: '', categoria: 'alimento' })
            setSelectedVaca(null)
            loadVacas()
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
                            Gestión de Vacas
                        </h2>
                        <div className="flex w-12 items-center justify-end">
                        </div>
                    </div>
                </header>

                {/* New Action Bar (Premium) */}
                <div className="px-4 pt-6 grid grid-cols-3 gap-4">
                    <button
                        onClick={() => {
                            setSelectedVaca(null)
                            setShowFormProduccion(true)
                        }}
                        className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-100 dark:border-blue-800 transition-all active:scale-95 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 group"
                    >
                        <div className="size-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/40 group-hover:rotate-6 transition-transform">
                            <span className="material-symbols-outlined text-3xl">water_drop</span>
                        </div>
                        <span className="text-[11px] font-black text-blue-800 dark:text-blue-300 uppercase tracking-tight text-center leading-none">Vender<br/>Leche</span>
                    </button>
                    <button
                        onClick={() => {
                            setSelectedVaca(null)
                            setShowFormGasto(true)
                        }}
                        className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-800 transition-all active:scale-95 hover:shadow-xl hover:border-red-300 dark:hover:border-red-700 group"
                    >
                        <div className="size-14 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-500/40 group-hover:-rotate-6 transition-transform">
                            <span className="material-symbols-outlined text-3xl">payments</span>
                        </div>
                        <span className="text-[11px] font-black text-red-800 dark:text-red-300 uppercase tracking-tight text-center leading-none">Registrar<br/>Gasto</span>
                    </button>
                    <button
                        onClick={() => setShowFormVaca(true)}
                        className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-primary/10 dark:bg-primary/5 border-2 border-primary/20 dark:border-primary/10 transition-all active:scale-95 hover:shadow-xl hover:border-primary/40 group"
                    >
                        <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-black shadow-xl shadow-primary/40 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-3xl font-bold">add</span>
                        </div>
                        <span className="text-[11px] font-black text-primary-dark dark:text-primary uppercase tracking-tight text-center leading-none">Añadir<br/>Vaca</span>
                    </button>
                </div>

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
                                    </div>
                                </div>
                                <div
                                    className="w-32 h-32 bg-center bg-no-repeat bg-cover rounded-xl shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden"
                                >
                                    {vaca.foto_url ? (
                                        <img src={vaca.foto_url} alt={vaca.nombre} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400 text-4xl">pets</span>
                                    )}
                                </div>
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
                            <form onSubmit={handleSubmitVaca} className="space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar pr-1">
                                <div className="flex flex-col items-center mb-6">
                                    <p className="text-xs font-bold text-[#688961] uppercase mb-3 text-center">Foto de la Vaca</p>
                                    <label className="relative cursor-pointer group">
                                        <div className="size-32 rounded-3xl border-4 border-dashed border-primary/30 dark:border-primary/20 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 hover:border-primary hover:bg-primary/5 transition-all shadow-inner">
                                            {vacaPreview ? (
                                                <img src={vacaPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="material-symbols-outlined text-gray-400 text-4xl group-hover:text-primary group-hover:scale-110 transition-all">add_a_photo</span>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase group-hover:text-primary transition-colors">Seleccionar</span>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Nombre</label>
                                        <input
                                            type="text"
                                            value={formVaca.nombre}
                                            onChange={(e) => setFormVaca({ ...formVaca, nombre: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                            placeholder="Ej: Mariposa"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Código / Arete</label>
                                        <input
                                            type="text"
                                            value={formVaca.codigo}
                                            onChange={(e) => setFormVaca({ ...formVaca, codigo: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                            placeholder="V-001"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Raza</label>
                                        <input
                                            type="text"
                                            value={formVaca.raza}
                                            onChange={(e) => setFormVaca({ ...formVaca, raza: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                            placeholder="Ej: Gyr"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Estado</label>
                                        <select
                                            value={formVaca.estado}
                                            onChange={(e) => setFormVaca({ ...formVaca, estado: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                        >
                                            <option value="produccion">En Producción</option>
                                            <option value="seca">Seca</option>
                                            <option value="enferma">Enferma</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Fecha Nacimiento</label>
                                        <input
                                            type="date"
                                            value={formVaca.fecha_nacimiento}
                                            onChange={(e) => setFormVaca({ ...formVaca, fecha_nacimiento: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Número de Partos</label>
                                        <input
                                            type="number"
                                            value={formVaca.partos}
                                            onChange={(e) => setFormVaca({ ...formVaca, partos: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Esquema de Vacunas</label>
                                    <textarea
                                        value={formVaca.vacunas}
                                        onChange={(e) => setFormVaca({ ...formVaca, vacunas: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-medium"
                                        rows="2"
                                        placeholder="Pesta, Aftosa, Carbon..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Notas</label>
                                    <textarea
                                        value={formVaca.notas}
                                        onChange={(e) => setFormVaca({ ...formVaca, notas: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-medium"
                                        rows="2"
                                        placeholder="Características especiales..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSaving && <span className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>}
                                    {isSaving ? 'Guardando...' : 'Agregar Vaca'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Form Modal: Registrar Producción */}
                {showFormProduccion && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Venta de Leche</h3>
                                    {selectedVaca && <p className="text-sm text-gray-600 dark:text-gray-400">Vaca: {selectedVaca.nombre}</p>}
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

                {/* Modal Nuevo Gasto */}
                {showFormGasto && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#1a2618] rounded-2xl p-6 max-w-md w-full border-2 border-primary/30">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-lg text-[#121811] dark:text-white">Nuevo Gasto</h3>
                                    {selectedVaca && <p className="text-sm text-gray-600 dark:text-gray-400">Vaca: {selectedVaca.nombre}</p>}
                                </div>
                                <button onClick={() => {
                                    setShowFormGasto(false)
                                    setSelectedVaca(null)
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
                                        placeholder="Ej: Alimento concentrado"
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
                                        <option value="alimento">Alimento</option>
                                        <option value="medicina">Medicina/Vitaminas</option>
                                        <option value="mano_obra">Mano de Obra</option>
                                        <option value="servicios">Servicios</option>
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
                                    className="w-full bg-primary text-black font-black px-6 py-3 rounded-lg shadow-md hover:bg-opacity-90 transition-all"
                                >
                                    Registrar Gasto
                                </button>
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
