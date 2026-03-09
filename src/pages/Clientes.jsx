import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getClientes, createCliente, updateCliente, deleteCliente } from '../services/clients'
import BottomNavigation from '../components/BottomNavigation'

const Clientes = () => {
    const { user } = useAuth()
    const [clientes, setClientes] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)

    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        direccion: '',
        notas: ''
    })

    useEffect(() => {
        loadClientes()
    }, [user])

    const loadClientes = async () => {
        if (!user) return
        setLoading(true)
        const { data } = await getClientes(user.id)
        setClientes(data || [])
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (editingId) {
            const { error } = await updateCliente(editingId, { ...formData, user_id: user.id })
            if (!error) {
                closeForm()
                loadClientes()
            }
        } else {
            const { error } = await createCliente({ ...formData, user_id: user.id })
            if (!error) {
                closeForm()
                loadClientes()
            }
        }
    }

    const handleEdit = (cliente) => {
        setFormData({
            nombre: cliente.nombre,
            telefono: cliente.telefono || '',
            direccion: cliente.direccion || '',
            notas: cliente.notas || ''
        })
        setEditingId(cliente.id)
        setShowForm(true)
    }

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
            await deleteCliente(id)
            loadClientes()
        }
    }

    const closeForm = () => {
        setShowForm(false)
        setEditingId(null)
        setFormData({ nombre: '', telefono: '', direccion: '', notas: '' })
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen text-[#121811] dark:text-white pb-24">
            <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden max-w-7xl mx-auto bg-white dark:bg-[#0a1108] shadow-2xl">
                {/* TopAppBar */}
                <div className="flex items-center bg-white dark:bg-[#0a1108] p-4 pb-2 justify-between sticky top-0 z-50 border-b border-[#dde6db] dark:border-[#2a3528]">
                    <Link to="/" className="text-[#121811] dark:text-white flex size-12 shrink-0 items-center cursor-pointer">
                        <span className="material-symbols-outlined text-2xl">arrow_back_ios</span>
                    </Link>
                    <div className="flex flex-col items-center flex-1 text-center">
                        <h2 className="text-[#121811] dark:text-white text-lg font-bold leading-tight">Clientes</h2>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#688961]">Directorio</span>
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

                <div className="p-4 flex-1">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-primary py-12">
                            <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
                        </div>
                    ) : clientes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <div className="bg-[#f1f4f0] dark:bg-[#1a2618] p-6 rounded-full mb-4">
                                <span className="material-symbols-outlined text-5xl text-primary">groups</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-[#121811] dark:text-white">Sin clientes</h3>
                            <p className="text-[#688961] text-sm mt-2">Añade tu primer cliente al directorio</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {clientes.map((cliente) => (
                                <div
                                    key={cliente.id}
                                    className="bg-white dark:bg-[#1a2618] rounded-2xl p-5 border border-[#dde6db] dark:border-[#2a3528] shadow-sm flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-[#121811] dark:text-white text-lg flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">person</span>
                                                {cliente.nombre}
                                            </h3>
                                        </div>
                                        <div className="space-y-2 text-sm text-[#688961] dark:text-gray-400">
                                            {cliente.telefono && (
                                                <p className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[16px]">call</span>
                                                    {cliente.telefono}
                                                </p>
                                            )}
                                            {cliente.direccion && (
                                                <p className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                                                    {cliente.direccion}
                                                </p>
                                            )}
                                            {cliente.notas && (
                                                <p className="flex items-start gap-2 italic mt-2 text-xs">
                                                    <span className="material-symbols-outlined text-[16px]">notes</span>
                                                    {cliente.notas}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#dde6db] dark:border-[#2a3528]">
                                        <button
                                            onClick={() => handleEdit(cliente)}
                                            className="p-2 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 text-sm font-semibold"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cliente.id)}
                                            className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1 text-sm font-semibold"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal Nuevo/Editar Cliente */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                        <div className="bg-white dark:bg-[#0a1108] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 border-x border-t border-[#dde6db] dark:border-[#2a3528]">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-xl text-[#121811] dark:text-white">
                                        {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
                                    </h3>
                                    <p className="text-sm text-[#688961]">
                                        {editingId ? 'Ajusta los detalles del cliente' : 'Añade información de contacto'}
                                    </p>
                                </div>
                                <button
                                    onClick={closeForm}
                                    className="bg-gray-100 dark:bg-[#1a2618] p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-[#2a3528] transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Nombre completo</label>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-none outline-none focus:ring-2 focus:ring-primary rounded-xl p-4 text-[#121811] dark:text-white placeholder:text-gray-400"
                                        placeholder="Ej: Juan Pérez"
                                        required
                                    />
                                </div>
                                {editingId && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Teléfono</label>
                                            <input
                                                type="tel"
                                                value={formData.telefono}
                                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                                className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-none outline-none focus:ring-2 focus:ring-primary rounded-xl p-4 text-[#121811] dark:text-white placeholder:text-gray-400"
                                                placeholder="Ej: 300 000 0000"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Dirección</label>
                                            <input
                                                type="text"
                                                value={formData.direccion}
                                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                                className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-none outline-none focus:ring-2 focus:ring-primary rounded-xl p-4 text-[#121811] dark:text-white placeholder:text-gray-400"
                                                placeholder="Ej: Calle 123 #45-67"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#688961] uppercase mb-2">Notas (opcional)</label>
                                            <textarea
                                                value={formData.notas}
                                                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                                className="w-full bg-[#f1f4f0] dark:bg-[#1a2618] border-none outline-none focus:ring-2 focus:ring-primary rounded-xl p-4 text-[#121811] dark:text-white placeholder:text-gray-400 min-h-[80px]"
                                                placeholder="Preferencias especiales, historial..."
                                            ></textarea>
                                        </div>
                                    </>
                                )}

                                <button
                                    type="submit"
                                    className="w-full bg-primary text-[#121811] font-bold text-lg p-4 rounded-xl shadow-lg shadow-primary/30 mt-6 transition-transform active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">{editingId ? 'save' : 'add_circle'}</span>
                                    {editingId ? 'Guardar Cambios' : 'Añadir Cliente'}
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

export default Clientes
