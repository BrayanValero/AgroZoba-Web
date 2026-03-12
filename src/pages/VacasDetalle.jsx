import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVacaById, getGastosByVaca, getProduccionLecheByVaca, updateProduccionLeche, updateVaca, uploadVacaPhoto } from '../services/vacas'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDateShort, calculateAge } from '../utils/formatters'
import BottomNavigation from '../components/BottomNavigation'

const VacasDetalle = () => {
    const { id } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [vaca, setVaca] = useState(null)
    const [gastos, setGastos] = useState([])
    const [produccion, setProduccion] = useState([])
    const [activeTab, setActiveTab] = useState('resumen')
    const [loading, setLoading] = useState(true)
    const [updatingPhoto, setUpdatingPhoto] = useState(false)
    const [tempFile, setTempFile] = useState(null)
    const [tempPreview, setTempPreview] = useState(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editForm, setEditForm] = useState({
        nombre: '',
        codigo: '',
        estado: '',
        raza: '',
        fecha_nacimiento: '',
        partos: 0,
        vacunas: '',
        notas: ''
    })

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        setLoading(true)
        const { data: v } = await getVacaById(id)
        if (v) {
            setVaca(v)
            setEditForm({
                nombre: v.nombre || '',
                codigo: v.codigo || '',
                estado: v.estado || 'produccion',
                raza: v.raza || '',
                fecha_nacimiento: v.fecha_nacimiento || '',
                partos: v.partos || 0,
                vacunas: v.vacunas || '',
                notas: v.notas || ''
            })
            const { data: g } = await getGastosByVaca(id)
            setGastos(g || [])
            const { data: p } = await getProduccionLecheByVaca(id)
            setProduccion(p || [])
        }
        setLoading(false)
    }

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0]
        if (file) {
            setTempFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setTempPreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const savePhoto = async () => {
        if (!tempFile) return
        setUpdatingPhoto(true)
        try {
            const { data: photoUrl, error: uploadError } = await uploadVacaPhoto(tempFile, user.id)
            if (uploadError) throw uploadError

            const { error: updateError } = await updateVaca(id, { foto_url: photoUrl })
            if (updateError) throw updateError

            setVaca(prev => ({ ...prev, foto_url: photoUrl }))
            setTempFile(null)
            setTempPreview(null)
        } catch (error) {
            if (error.message?.includes('Bucket not found')) {
                alert('Error: No se encontró el contenedor "vacas" en Supabase. Debes crearlo en la sección Storage de tu panel de Supabase.')
            } else {
                alert('Error al actualizar la foto: ' + error.message)
            }
            console.error(error)
        } finally {
            setUpdatingPhoto(false)
        }
    }

    const cancelPhoto = () => {
        setTempFile(null)
        setTempPreview(null)
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        const { error } = await updateVaca(id, editForm)
        if (!error) {
            setShowEditModal(false)
            loadData()
        } else {
            alert('Error al actualizar la vaca')
        }
    }

    if (loading) return <div className="p-8 text-center">Cargando...</div>
    if (!vaca) return <div className="p-8 text-center">Vaca no encontrada</div>

    const totalGastos = gastos.reduce((acc, g) => acc + (g.monto || 0), 0)
    const totalLeche = produccion.reduce((acc, p) => acc + (p.litros || 0), 0)
    const totalVentas = produccion.reduce((acc, p) => acc + (p.monto_total || 0), 0)
    const totalPorCobrar = produccion.filter(p => p.estado_pago === 'debe').reduce((acc, p) => acc + (p.monto_total || 0), 0)
    const balance = (totalVentas - totalPorCobrar) - totalGastos

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
            {/* Header */}
            <header className="bg-white dark:bg-white/5 border-b border-gray-100 dark:border-white/10 p-4 sticky top-0 z-10 safe-top">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/vacas')} className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                        arrow_back
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-[#121811] dark:text-white leading-tight">
                                {vaca.nombre}
                            </h1>
                            <button 
                                onClick={() => setShowEditModal(true)}
                                className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Código: {vaca.codigo || 'N/A'}
                        </p>
                    </div>
                </div>
            </header>

            {/* Quick Stats Header */}
            <div className="bg-white dark:bg-white/5 p-4 border-b border-gray-100 dark:border-white/10 grid grid-cols-4 divide-x divide-gray-100 dark:divide-white/10">
                <div className="px-1 text-center">
                    <p className="text-[9px] uppercase text-gray-500 font-bold">Gastos</p>
                    <p className="text-xs font-bold text-red-500">{formatCurrency(totalGastos)}</p>
                </div>
                <div className="px-1 text-center">
                    <p className="text-[9px] uppercase text-gray-500 font-bold">Ventas</p>
                    <p className="text-xs font-bold text-green-600">{formatCurrency(totalVentas)}</p>
                </div>
                <div className="px-1 text-center">
                    <p className="text-[9px] uppercase text-gray-500 font-bold">Por Cobrar</p>
                    <p className="text-xs font-bold text-orange-500">{formatCurrency(totalPorCobrar)}</p>
                </div>
                <div className="px-1 text-center">
                    <p className="text-[9px] uppercase text-gray-500 font-bold">Balance</p>
                    <p className={`text-xs font-bold ${balance >= 0 ? 'text-primary' : 'text-red-500'}`}>
                        {formatCurrency(balance)}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-white/5">
                <button
                    onClick={() => setActiveTab('resumen')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'resumen' ? 'border-primary text-primary' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
                >
                    Resumen
                </button>
                <button
                    onClick={() => setActiveTab('gastos')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'gastos' ? 'border-primary text-primary' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
                >
                    Gastos
                </button>
                <button
                    onClick={() => setActiveTab('ventas')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ventas' ? 'border-primary text-primary' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
                >
                    Producción
                </button>
            </div>

            {/* Content */}
            <main className="flex-1 p-4 pb-24 overflow-y-auto">
                {activeTab === 'resumen' && (
                    <div className="space-y-4">
                        {/* Photo Section */}
                        <div className="bg-white dark:bg-white/5 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col items-center">
                            <div className="relative group">
                                <div className="size-48 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                                    {tempPreview || vaca.foto_url ? (
                                        <img src={tempPreview || vaca.foto_url} alt={vaca.nombre} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400 text-6xl">pets</span>
                                    )}
                                </div>
                                <label className="absolute bottom-3 right-3 p-2 bg-primary dark:bg-primary text-black rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform flex items-center justify-center">
                                    <span className="material-symbols-outlined text-xl">add_a_photo</span>
                                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                </label>
                            </div>

                            {tempFile && (
                                <div className="mt-4 flex gap-2 w-full max-w-xs">
                                    <button
                                        onClick={savePhoto}
                                        disabled={updatingPhoto}
                                        className="flex-1 bg-primary text-black font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2"
                                    >
                                        {updatingPhoto ? <span className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></span> : <span className="material-symbols-outlined text-sm">check</span>}
                                        {updatingPhoto ? 'Guardando...' : 'Guardar Foto'}
                                    </button>
                                    <button
                                        onClick={cancelPhoto}
                                        className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold py-2 rounded-xl text-sm"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-white/5 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5">
                            <h3 className="font-bold text-[#121811] dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">info</span>
                                Información General
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-gray-50 dark:border-white/5 pb-2">
                                    <span className="text-gray-500">Estado</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                        vaca.estado === 'produccion' ? 'bg-green-100 text-green-700' :
                                        vaca.estado === 'seca' ? 'bg-orange-100 text-orange-700' :
                                        vaca.estado === 'enferma' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {vaca.estado}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-50 dark:border-white/5 pb-2">
                                    <span className="text-gray-500">Raza</span>
                                    <span className="font-bold text-[#121811] dark:text-white">
                                        {vaca.raza || 'No especificada'}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-50 dark:border-white/5 pb-2">
                                    <span className="text-gray-500">Edad</span>
                                    <span className="font-bold text-primary">
                                        {calculateAge(vaca.fecha_nacimiento)}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-50 dark:border-white/5 pb-2">
                                    <span className="text-gray-500">Partos</span>
                                    <span className="font-bold text-[#121811] dark:text-white">
                                        {vaca.partos || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-50 dark:border-white/5 pb-2">
                                    <span className="text-gray-500">Fecha Nacimiento</span>
                                    <span className="font-medium text-[#121811] dark:text-white">
                                        {vaca.fecha_nacimiento ? formatDateShort(vaca.fecha_nacimiento) : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-50 dark:border-white/5 pb-2">
                                    <span className="text-gray-500">Total Leche Producida</span>
                                    <span className="font-medium text-[#121811] dark:text-white">{totalLeche} L</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Esquema de Vacunas</span>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl border border-blue-100 dark:border-blue-800">
                                        {vaca.vacunas || 'Sin registro de vacunas.'}
                                    </p>
                                </div>
                                <div className="space-y-1 pt-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Notas Adicionales</span>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 p-2 rounded-xl">
                                        {vaca.notas || 'Sin notas adicionales.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Editar Vaca */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
                        <div className="bg-white dark:bg-[#0a1108] rounded-t-3xl sm:rounded-3xl w-full max-w-lg border-x-2 border-t-2 sm:border-2 border-primary/20 shadow-2xl animate-slide-up">
                            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5 rounded-t-3xl">
                                <div>
                                    <h3 className="font-black text-xl text-[#121811] dark:text-white">Editar Perfil</h3>
                                    <p className="text-xs text-gray-500">Modifica los datos de {vaca.nombre}</p>
                                </div>
                                <button onClick={() => setShowEditModal(false)} className="size-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-gray-400">close</span>
                                </button>
                            </div>
                            
                            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Nombre</label>
                                        <input
                                            type="text"
                                            value={editForm.nombre}
                                            onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Código / Arete</label>
                                        <input
                                            type="text"
                                            value={editForm.codigo}
                                            onChange={(e) => setEditForm({ ...editForm, codigo: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Raza</label>
                                        <input
                                            type="text"
                                            value={editForm.raza}
                                            onChange={(e) => setEditForm({ ...editForm, raza: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                            placeholder="Ej: Holstein"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Estado</label>
                                        <select
                                            value={editForm.estado}
                                            onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                        >
                                            <option value="produccion">En Producción</option>
                                            <option value="seca">Seca</option>
                                            <option value="enferma">Enferma</option>
                                            <option value="vendida">Vendida</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Fecha Nacimiento</label>
                                        <input
                                            type="date"
                                            value={editForm.fecha_nacimiento}
                                            onChange={(e) => setEditForm({ ...editForm, fecha_nacimiento: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Número de Partos</label>
                                        <input
                                            type="number"
                                            value={editForm.partos}
                                            onChange={(e) => setEditForm({ ...editForm, partos: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Esquema de Vacunas</label>
                                    <textarea
                                        value={editForm.vacunas}
                                        onChange={(e) => setEditForm({ ...editForm, vacunas: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-medium"
                                        rows="2"
                                        placeholder="Lista de vacunas aplicadas..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Notas</label>
                                    <textarea
                                        value={editForm.notas}
                                        onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-[#1a2618] border border-gray-100 dark:border-[#2a3528] rounded-2xl p-3 text-sm font-medium"
                                        rows="2"
                                        placeholder="Observaciones adicionales..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary text-black font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-2"
                                >
                                    Guardar Cambios
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'gastos' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-[#121811] dark:text-white">Historial de Gastos</h3>
                        </div>
                        {gastos.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">No hay gastos registrados</div>
                        ) : (
                            gastos.map(g => (
                                <div key={g.id} className="bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                            <span className="material-symbols-outlined text-xl">payments</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#121811] dark:text-white">{g.concepto}</p>
                                            <p className="text-xs text-gray-500">{formatDateShort(g.fecha)} - {g.categoria}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-[#121811] dark:text-white">{formatCurrency(g.monto)}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'ventas' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-[#121811] dark:text-white">Historial de Producción</h3>
                        {produccion.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">No hay registros de producción</div>
                        ) : (
                            produccion.map(p => (
                                <div key={p.id} className="bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                                            <span className="material-symbols-outlined text-xl">water_drop</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-[#121811] dark:text-white">{p.litros} Litros</p>
                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${p.estado_pago === 'debe' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                    {p.estado_pago || 'Pagado'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[#688961] uppercase font-bold">{formatDateShort(p.fecha)}</p>
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
            </main>



            <BottomNavigation />
        </div>
    )
}

export default VacasDetalle
