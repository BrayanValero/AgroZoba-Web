import { supabase } from './supabase'
// import { isDemo, demoService } from './demoStore'

/**
 * Obtener todas las producciones de pollos del usuario
 */
export const getProducciones = async (userId) => {
    // if (isDemo()) return demoService.getAll('producciones_pollos', userId)

    try {
        const { data, error } = await supabase
            .from('producciones_pollos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        return { data: null, error }
    }
}

/**
 * Obtener una producción por ID
 */
export const getProduccionById = async (id) => {
    // if (isDemo()) return demoService.getById('producciones_pollos', id)

    try {
        const { data, error } = await supabase
            .from('producciones_pollos')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error fetching produccion:', error)
        return { data: null, error }
    }
}

/**
 * Crear nueva producción de pollos
 */
export const createProduccion = async (produccionData) => {
    // if (isDemo()) return demoService.create('producciones_pollos', produccionData)

    try {
        const { data, error } = await supabase
            .from('producciones_pollos')
            .insert([produccionData])
            .select()
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error creating produccion:', error)
        return { data: null, error }
    }
}

/**
 * Actualizar producción existente
 */
export const updateProduccion = async (id, updates) => {
    // if (isDemo()) return demoService.update('producciones_pollos', id, updates)

    try {
        const { data, error } = await supabase
            .from('producciones_pollos')
            .update({ ...updates, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error updating produccion:', error)
        return { data: null, error }
    }
}

/**
 * Eliminar producción
 */
export const deleteProduccion = async (id) => {
    // if (isDemo()) return demoService.delete('producciones_pollos', id)

    try {
        const { error } = await supabase
            .from('producciones_pollos')
            .delete()
            .eq('id', id)

        if (error) throw error
        return { error: null }
    } catch (error) {
        console.error('Error deleting produccion:', error)
        return { error }
    }
}

/**
 * Obtener gastos de una producción
 */
export const getGastosByProduccion = async (produccionId) => {
    // if (isDemo()) return demoService.getByForeignKey('gastos_pollos', 'produccion_id', produccionId)

    try {
        const { data, error } = await supabase
            .from('gastos_pollos')
            .select('*')
            .eq('produccion_id', produccionId)
            .order('fecha', { ascending: false })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error fetching gastos:', error)
        return { data: null, error }
    }
}

/**
 * Crear gasto para una producción
 */
export const createGasto = async (gastoData) => {
    // if (isDemo()) return demoService.create('gastos_pollos', gastoData)

    try {
        const { data, error } = await supabase
            .from('gastos_pollos')
            .insert([gastoData])
            .select()
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error creating gasto:', error)
        return { data: null, error }
    }
}

/**
 * Obtener ingresos de una producción
 */
export const getIngresosByProduccion = async (produccionId) => {
    // if (isDemo()) return demoService.getByForeignKey('ingresos_pollos', 'produccion_id', produccionId)

    try {
        const { data, error } = await supabase
            .from('ingresos_pollos')
            .select('*')
            .eq('produccion_id', produccionId)
            .order('fecha', { ascending: false })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error fetching ingresos:', error)
        return { data: null, error }
    }
}

/**
 * Crear ingreso para una producción
 */
export const createIngreso = async (ingresoData) => {
    // if (isDemo()) return demoService.create('ingresos_pollos', ingresoData)

    try {
        const { data, error } = await supabase
            .from('ingresos_pollos')
            .insert([ingresoData])
            .select()
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error creating ingreso:', error)
        return { data: null, error }
    }
}

/**
 * Obtener aportes de una producción
 */
export const getAportesByProduccion = async (produccionId) => {
    try {
        const { data, error } = await supabase
            .from('aportes_pollos')
            .select('*')
            .eq('produccion_id', produccionId)
            .order('fecha', { ascending: false })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error fetching aportes:', error)
        return { data: null, error }
    }
}

/**
 * Crear aporte para una producción
 */
export const createAporte = async (aporteData) => {
    try {
        const { data, error } = await supabase
            .from('aportes_pollos')
            .insert([aporteData])
            .select()
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error creating aporte:', error)
        return { data: null, error }
    }
}

/**
 * Actualizar ingreso/venta de pollos
 */
export const updateIngreso = async (id, updates) => {
    try {
        const { data, error } = await supabase
            .from('ingresos_pollos')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error updating ingreso:', error)
        return { data: null, error }
    }
}

/**
 * Calcular rentabilidad de una producción
 */
export const calcularRentabilidad = async (produccionId) => {
    try {
        const { data: gastos } = await getGastosByProduccion(produccionId)
        const { data: ingresos } = await getIngresosByProduccion(produccionId)
        const { data: aportes } = await getAportesByProduccion(produccionId)

        const totalGastos = gastos?.reduce((acc, g) => acc + (g.monto || 0), 0) || 0
        const totalIngresos = ingresos?.reduce((acc, i) => acc + (i.monto_total || 0), 0) || 0
        const totalAportes = aportes?.reduce((acc, a) => acc + (a.monto || 0), 0) || 0
        
        const balance = (totalIngresos + totalAportes) - totalGastos
        const rentabilidad = totalIngresos - totalGastos
        const porcentaje = totalGastos > 0 ? ((rentabilidad / totalGastos) * 100) : 0

        return {
            totalGastos,
            totalIngresos,
            totalAportes,
            balance,
            rentabilidad,
            porcentaje
        }
    } catch (error) {
        console.error('Error calculating rentabilidad:', error)
        return null
    }
}

/**
 * Obtener clientes recientes (únicos)
 */
export const getRecentClients = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('ingresos_pollos')
            .select('cliente')
            .eq('user_id', userId)
            .not('cliente', 'is', null)
            .order('fecha', { ascending: false })

        if (error) throw error

        const uniqueClients = [...new Set(data.map(i => i.cliente))]
            .filter(name => name && name !== 'Consumidor Final')
            .slice(0, 10)

        return { data: uniqueClients, error: null }
    } catch (error) {
        console.error('Error fetching clients:', error)
        return { data: [], error }
    }
}
