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

export const getAllRecentClients = async (userId) => {
    try {
        const { data, error } = await getClientes(userId)
        if (error) throw error

        return { data: data || [], error: null }
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

/**
 * Obtener deudas de todos los clientes
 */
export const getClientDebts = async (userId) => {
    try {
        // Obtenemos los clientes para cruzar los nombres/IDs
        const { data: clientesData } = await getClientes(userId);
        const clientes = clientesData || [];

        // Hacemos peticiones para 'debe' en los 3 módulos. Usamos captura de errores
        // por si alguna tabla aún no tiene las columnas actualizadas en Supabase.
        const promises = [
            supabase.from('ventas_gallinas').select('cliente, monto_total, concepto, fecha').eq('user_id', userId).eq('estado_pago', 'debe'),
            supabase.from('ingresos_pollos').select('cliente, monto_total, concepto, fecha').eq('user_id', userId).eq('estado_pago', 'debe'),
            supabase.from('produccion_leche').select('cliente, monto_total, fecha').eq('user_id', userId).eq('estado_pago', 'debe'),
        ];

        const [huevosRes, pollosRes, lecheRes] = await Promise.all(promises);

        const deudasMap = {};

        // Función de utilidad para procesar resultados
        const procesarDeudas = (res, moduloDefault) => {
            if (res.error || !res.data) return;
            res.data.forEach(item => {
                if (!item.cliente) return;
                const clienteUpper = item.cliente.toUpperCase();

                if (!deudasMap[clienteUpper]) {
                    deudasMap[clienteUpper] = {
                        nombre: item.cliente,
                        totalDeuda: 0,
                        detalles: []
                    };
                }

                deudasMap[clienteUpper].totalDeuda += parseFloat(item.monto_total || 0);
                deudasMap[clienteUpper].detalles.push({
                    modulo: moduloDefault,
                    concepto: item.concepto || `Venta de ${moduloDefault}`,
                    monto: parseFloat(item.monto_total || 0),
                    fecha: item.fecha
                });
            });
        };

        procesarDeudas(huevosRes, 'Huevos');
        procesarDeudas(pollosRes, 'Pollos');
        procesarDeudas(lecheRes, 'Leche');

        // Cruzar con los clientes existentes para mostrar incluso los que no deben (opcional)
        // o mapear los nombres correctos.
        const result = Object.values(deudasMap).sort((a, b) => b.totalDeuda - a.totalDeuda);

        return { data: result, error: null };
    } catch (error) {
        console.error('Error fetching client debts:', error)
        return { data: [], error }
    }
}
