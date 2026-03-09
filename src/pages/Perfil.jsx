import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNavigation from '../components/BottomNavigation'

const Perfil = () => {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col">
            {/* Top Navigation */}
            <nav className="bg-white dark:bg-background-dark border-b border-gray-100 dark:border-white/10 px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
                <h1 className="text-lg font-bold text-[#121811] dark:text-white flex-1 text-center pr-8">
                    Mi Perfil
                </h1>
            </nav>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 pb-24">
                {/* Profile Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4">
                        <div
                            className="bg-center bg-no-repeat bg-cover aspect-square rounded-full size-24 border-4 border-white dark:border-[#1a2e16] shadow-md"
                            style={{ backgroundImage: 'url("/logo.jpg")' }}
                        ></div>
                        <div className="absolute bottom-0 right-0 bg-primary text-[#132210] rounded-full p-1.5 border-2 border-white dark:border-[#1a2e16]">
                            <span className="material-symbols-outlined text-sm">edit</span>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-[#121811] dark:text-white mb-1">
                        {user?.email?.split('@')[0] || 'Usuario'}
                    </h2>
                    <p className="text-[#688961] dark:text-gray-400 text-sm">
                        {user?.email}
                    </p>
                </div>

                {/* Account Settings Section */}
                <div className="space-y-4 mb-8">
                    <h3 className="text-sm font-bold text-[#121811] dark:text-white uppercase tracking-wider mb-3 pl-1">
                        Cuenta
                    </h3>

                    <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5">
                        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                                    <span className="material-symbols-outlined">person</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#121811] dark:text-white">Información Personal</p>
                                    <p className="text-xs text-[#688961] dark:text-gray-400">Actualizar datos</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                        </button>

                        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg text-purple-600 dark:text-purple-400">
                                    <span className="material-symbols-outlined">lock</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#121811] dark:text-white">Seguridad</p>
                                    <p className="text-xs text-[#688961] dark:text-gray-400">Cambiar contraseña</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* App Settings Section */}
                <div className="space-y-4 mb-8">
                    <h3 className="text-sm font-bold text-[#121811] dark:text-white uppercase tracking-wider mb-3 pl-1">
                        Aplicación
                    </h3>

                    <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5">
                        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg text-orange-600 dark:text-orange-400">
                                    <span className="material-symbols-outlined">notifications</span>
                                </div>
                                <p className="text-sm font-semibold text-[#121811] dark:text-white">Notificaciones</p>
                            </div>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-primary" />
                                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></label>
                            </div>
                        </button>

                        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                                    <span className="material-symbols-outlined">help</span>
                                </div>
                                <p className="text-sm font-semibold text-[#121811] dark:text-white">Ayuda y Soporte</p>
                            </div>
                            <span className="material-symbols-outlined text-gray-400">open_in_new</span>
                        </button>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleSignOut}
                    className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold py-4 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-2 hover:bg-red-100 text-sm transition-colors"
                >
                    <span className="material-symbols-outlined">logout</span>
                    Cerrar Sesión
                </button>

                <p className="text-center text-xs text-gray-400 mt-6">
                    Versión 1.0.0
                </p>
            </main>

            <BottomNavigation />
        </div>
    )
}

export default Perfil
