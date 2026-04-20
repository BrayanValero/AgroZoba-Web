import { supabase } from './supabase'
// import { isDemo, demoService } from './demoStore'

/**
 * Obtener todos los lotes de gallinas del usuario
 */
export const getLotes = async (userId) => {
    // if (isDemo()) return demoService.getAll('lotes_gallinas', userId)

    try {
        const { data, error } = await supabase
            .from('lotes_gallinas')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error fetching lotes:', error)
        return { data: null, error }
    }
}

/**
 * Obtener un lote por ID
 */
export const getLoteById = async (id) => {
    // if (isDemo()) return demoService.getById('lotes_gallinas', id)

    try {
        const { data, error } = await supabase
            .from('lotes_gallinas')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error fetching lote:', error)
        return { data: null, error }
    }
}

/**
 * Crear nuevo lote de gallinas
 */
export const createLote = async (loteData) => {
    // if (isDemo()) return demoService.create('lotes_gallinas', loteData)

    try {
        const { data, error } = await supabase
            .from('lotes_gallinas')
            .insert([loteData])
            .select()
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error creating lote:', error)
        return { data: null, error }
    }
}

/**
 * Actualizar lote existente
 */
export const updateLote = async (id, updates) => {
    // if (isDemo()) return demoService.update('lotes_gallinas', id, updates)

    try {
        const { data, error } = await supabase
            .from('lotes_gallinas')
            .update({ ...updates, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error updating lote:', error)
        return { data: null, error }
    }
}

/**
 * Eliminar lote
 */
export const deleteLote = async (id) => {
    // if (isDemo()) return demoService.delete('lotes_gallinas', id)

    try {
        const { error } = await supabase
            .from('lotes_gallinas')
            .delete()
            .eq('id', id)

        if (error) throw error
        return { error: null }
    } catch (error) {
        console.error('Error deleting lote:', error)
        return { error }
    }
}

/**
 * Obtener gastos de un lote
 */
export const getGastosByLote = async (loteId) => {
    // if (isDemo()) return demoService.getByForeignKey('gastos_gallinas', 'lote_id', loteId)

    try {
        const { data, error } = await supabase
            .from('gastos_gallinas')
            .select('*')
            .eq('lote_id', loteId)
            .order('fecha', { ascending: false })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error fetching gastos:', error)
        return { data: null, error }
    }
}

/**
 * Crear gasto para un lote
 */
export const createGasto = async (gastoData) => {
    // if (isDemo()) return demoService.create('gastos_gallinas', gastoData)

    try {
        const { data, error } = await supabase
            .from('gastos_gallinas')
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
 * Actualizar gasto existente
 */
export const updateGasto = async (id, updates) => {
    try {
        const { data, error } = await supabase
            .from('gastos_gallinas')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error updating gasto:', error)
        return { data: null, error }
    }
}

/**
 * Eliminar gasto
 */
export const deleteGasto = async (id) => {
    try {
        const { error } = await supabase
            .from('gastos_gallinas')
            .delete()
            .eq('id', id)

        if (error) throw error
        return { error: null }
    } catch (error) {
        console.error('Error deleting gasto:', error)
        return { error }
    }
}

/**
 * Obtener ventas de un lote
 */
export const getVentasByLote = async (loteId) => {
    // if (isDemo()) return demoService.getByForeignKey('ventas_gallinas', 'lote_id', loteId)

    try {
        const { data, error } = await supabase
            .from('ventas_gallinas')
            .select('*')
            .eq('lote_id', loteId)
            .order('fecha', { ascending: false })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error fetching ventas:', error)
        return { data: null, error }
    }
}

/**
 * Registrar venta de huevos
 */
export const createVenta = async (ventaData) => {
    // if (isDemo()) return demoService.create('ventas_gallinas', ventaData)

    try {
        const { data, error } = await supabase
            .from('ventas_gallinas')
            .insert([ventaData])
            .select()
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error creating venta:', error)
        return { data: null, error }
    }
}

/**
 * Eliminar venta de huevos
 */
export const deleteVenta = async (id) => {
    try {
        const { error } = await supabase
            .from('ventas_gallinas')
            .delete()
            .eq('id', id)

        if (error) throw error
        return { error: null }
    } catch (error) {
        console.error('Error deleting venta:', error)
        return { error }
    }
}

/**
 * Obtener aportes de un lote
 */
export const getAportesByLote = async (loteId) => {
    try {
        const { data, error } = await supabase
            .from('aportes_gallinas')
            .select('*')
            .eq('lote_id', loteId)
            .order('fecha', { ascending: false })

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error fetching aportes:', error)
        return { data: null, error }
    }
}

/**
 * Crear aporte para un lote
 */
export const createAporte = async (aporteData) => {
    try {
        const { data, error } = await supabase
            .from('aportes_gallinas')
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
 * Actualizar venta de huevos
 */
export const updateVenta = async (id, updates) => {
    try {
        const { data, error } = await supabase
            .from('ventas_gallinas')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { data, error: null }
    } catch (error) {
        console.error('Error updating venta:', error)
        return { data: null, error }
    }
}

/**
 * Calcular rentabilidad de un lote
 */
export const calcularRentabilidad = async (loteId) => {
    try {
        const { data: gastos } = await getGastosByLote(loteId)
        const { data: ventas } = await getVentasByLote(loteId)
        const { data: aportes } = await getAportesByLote(loteId)

        const totalGastos = gastos?.reduce((acc, g) => acc + (g.monto || 0), 0) || 0
        const totalVentas = ventas?.reduce((acc, v) => acc + (v.monto_total || 0), 0) || 0
        const totalAportes = aportes?.reduce((acc, a) => acc + (a.monto || 0), 0) || 0

        const balance = (totalVentas + totalAportes) - totalGastos
        const rentabilidad = totalVentas - totalGastos
        const porcentaje = totalGastos > 0 ? ((rentabilidad / totalGastos) * 100) : 0

        return {
            totalGastos,
            totalVentas,
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
