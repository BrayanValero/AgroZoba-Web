import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVacaById, updateVaca, uploadVacaPhoto } from '../services/vacas'
import { useAuth } from '../context/AuthContext'
import { formatDateShort, calculateAge } from '../utils/formatters'
import BottomNavigation from '../components/BottomNavigation'

const VacasDetalle = () => {
    const { id } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [vaca, setVaca] = useState(null)
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

    if (loading) return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary animate-pulse">pets</span>
        </div>
    )
    if (!vaca) return <div className="p-8 text-center">Vaca no encontrada</div>

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display max-w-7xl mx-auto bg-white dark:bg-[#0a1108] shadow-2xl relative">
            {/* Header */}
            <header className="bg-white dark:bg-[#0a1108] border-b border-[#dde6db] dark:border-[#2a3528] p-4 sticky top-0 z-40 safe-top">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/vacas')} className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                        arrow_back_ios
                    </button>
                    <div className="flex-1">
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
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#688961]">
                            Código: {vaca.codigo || 'N/A'}
                        </p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 p-4 pb-32 overflow-y-auto">
                <div className="space-y-4">
                    {/* Photo Section */}
                    <div className="bg-[#f1f4f0] dark:bg-[#1a2618] rounded-3xl p-6 border border-[#dde6db] dark:border-[#2a3528] flex flex-col items-center shadow-sm">
                        <div className="relative group">
                            <div className="size-56 rounded-3xl bg-white dark:bg-[#0a1108] flex items-center justify-center overflow-hidden border-2 border-[#dde6db] dark:border-[#2a3528] shadow-inner">
                                {tempPreview || vaca.foto_url ? (
                                    <img src={tempPreview || vaca.foto_url} alt={vaca.nombre} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-[#688961] text-7xl opacity-50">pets</span>
                                )}
                            </div>
                            <label className="absolute -bottom-3 -right-3 size-12 bg-primary text-black rounded-2xl cursor-pointer shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-2 border-white dark:border-[#0a1108]">
                                <span className="material-symbols-outlined text-2xl font-bold">add_a_photo</span>
                                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                            </label>
                        </div>

                        {tempFile && (
                            <div className="mt-8 flex gap-3 w-full max-w-xs animate-in fade-in slide-in-from-bottom-2">
                                <button
                                    onClick={savePhoto}
                                    disabled={updatingPhoto}
                                    className="flex-1 bg-primary text-black font-black py-3 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    {updatingPhoto ? <span className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></span> : <span className="material-symbols-outlined text-sm font-bold">check</span>}
                                    {updatingPhoto ? 'GUARDANDO...' : 'GUARDAR FOTO'}
                                </button>
                                <button
                                    onClick={cancelPhoto}
                                    className="px-4 bg-white dark:bg-[#0a1108] text-gray-400 font-bold py-3 rounded-2xl text-xs border border-[#dde6db] dark:border-[#2a3528]"
                                >
                                    CANCELAR
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Animal Info Card */}
                    <div className="bg-white dark:bg-[#1a2618] rounded-3xl p-6 shadow-sm border border-[#dde6db] dark:border-[#2a3528]">
                        <h3 className="text-xs font-black text-[#688961] uppercase mb-6 flex items-center gap-2 tracking-widest">
                            <span className="material-symbols-outlined text-primary text-sm font-black">info</span>
                            Perfil del Animal
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-bold text-[#688961]">Estado</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                    vaca.estado === 'produccion' ? 'bg-green-100 text-green-700' :
                                    vaca.estado === 'seca' ? 'bg-orange-100 text-orange-700' :
                                    vaca.estado === 'enferma' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {vaca.estado}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-bold text-[#688961]">Raza</p>
                                <p className="font-bold text-[#121811] dark:text-white text-sm">
                                    {vaca.raza || 'No especificada'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-bold text-[#688961]">Edad Actual</p>
                                <p className="font-black text-primary text-lg">
                                    {calculateAge(vaca.fecha_nacimiento)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-bold text-[#688961]">Total Partos</p>
                                <p className="font-bold text-[#121811] dark:text-white text-sm">
                                    {vaca.partos || 0}
                                </p>
                            </div>
                            <div className="col-span-2 pt-2 space-y-3">
                                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/20">
                                    <p className="text-[10px] uppercase font-bold text-blue-400 mb-2">Esquema de Vacunación</p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                                        {vaca.vacunas || 'Sin registro de vacunas.'}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-[#0a1108] rounded-2xl border border-[#dde6db] dark:border-[#2a3528]">
                                    <p className="text-[10px] uppercase font-bold text-[#688961] mb-2">Notas Adicionales</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                                        {vaca.notes || vaca.notas || 'Sin observaciones.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal Editar Vaca */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
                    <div className="bg-white dark:bg-[#0a1108] rounded-t-3xl sm:rounded-3xl w-full max-w-lg border-x-2 border-t-2 sm:border-2 border-primary/20 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="p-6 border-b border-[#dde6db] dark:border-[#2a3528] flex justify-between items-center bg-[#f1f4f0] dark:bg-[#1a2618] rounded-t-3xl">
                            <div>
                                <h3 className="font-black text-xl text-[#121811] dark:text-white">EDITAR PERFIL</h3>
                                <p className="text-[10px] font-bold text-[#688961] uppercase tracking-wider">Modifica los datos de {vaca.nombre}</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="size-10 rounded-full bg-white dark:bg-[#0a1108] flex items-center justify-center shadow-sm border border-[#dde6db] dark:border-[#2a3528]">
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
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border border-[#dde6db] dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Código / Arete</label>
                                    <input
                                        type="text"
                                        value={editForm.codigo}
                                        onChange={(e) => setEditForm({ ...editForm, codigo: e.target.value })}
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border border-[#dde6db] dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
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
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border border-[#dde6db] dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                        placeholder="Ej: Holstein"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Estado</label>
                                    <select
                                        value={editForm.estado}
                                        onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border border-[#dde6db] dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
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
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border border-[#dde6db] dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Número de Partos</label>
                                    <input
                                        type="number"
                                        value={editForm.partos}
                                        onChange={(e) => setEditForm({ ...editForm, partos: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border border-[#dde6db] dark:border-[#2a3528] rounded-2xl p-3 text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Esquema de Vacunas</label>
                                <textarea
                                    value={editForm.vacunas}
                                    onChange={(e) => setEditForm({ ...editForm, vacunas: e.target.value })}
                                    className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border border-[#dde6db] dark:border-[#2a3528] rounded-2xl p-3 text-sm font-medium"
                                    rows="2"
                                    placeholder="Lista de vacunas aplicadas..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#688961] uppercase mb-1 ml-1">Notas</label>
                                <textarea
                                    value={editForm.notas}
                                    onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
                                    className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border border-[#dde6db] dark:border-[#2a3528] rounded-2xl p-3 text-sm font-medium"
                                    rows="2"
                                    placeholder="Observaciones adicionales..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary text-black font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-2"
                            >
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

export default VacasDetalle
