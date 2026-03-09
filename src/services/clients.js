import { supabase } from './supabase'

/**
 * Obtener todos los clientes (desde la nueva tabla `clientes`)
 */
export const getClientes = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('user_id', userId)
            .order('nombre', { ascending: true })

        return { data, error }
    } catch (error) {
        console.error('Error fetching clients:', error)
        return { data: [], error }
    }
}

/**
 * Función por compatibilidad hacia atrás
 * Ahora devuelve solo un array de nombres de clientes para los autocompletes viejos
 * o podemos devolver los objetos completos si la vista lo soporta.
 * Para no romper, sigue devolviendo arreglo de strings.
 */
export const getAllRecentClients = async (userId) => {
    try {
        const { data, error } = await getClientes(userId)
        if (error) throw error

        // Devolvemos solo los nombres para compatibilidad, 
        // aunque lo ideal será cambiar los selectores a usar ID -> Nombre.
        // Dado el requerimiento, la migración pide que sigan guardándose como string en la DB transaccional
        const uniqueNames = data.map(c => c.nombre)
        return { data: uniqueNames, error: null }
    } catch (error) {
        console.error('Error fetching all clients (names):', error)
        return { data: [], error }
    }
}

export const createCliente = async (clienteData) => {
    try {
        const { data, error } = await supabase
            .from('clientes')
            .insert([clienteData])
            .select()
        return { data, error }
    } catch (error) {
        console.error('Error creating client:', error)
        return { data: null, error }
    }
}

export const updateCliente = async (id, clienteData) => {
    try {
        const { data, error } = await supabase
            .from('clientes')
            .update(clienteData)
            .eq('id', id)
            .select()
        return { data, error }
    } catch (error) {
        console.error('Error updating client:', error)
        return { data: null, error }
    }
}

export const deleteCliente = async (id) => {
    try {
        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id)
        return { error }
    } catch (error) {
        console.error('Error deleting client:', error)
        return { error }
    }
}
