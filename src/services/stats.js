import { supabase } from './supabase'
// import { isDemo, demoService } from './demoStore'

export const getDashboardStats = async (userId, startDate = null, endDate = null) => {
    const date = new Date()
    const firstDay = startDate || new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]

    try {
        let queryIP = supabase.from('ingresos_pollos').select('monto_total, estado_pago').eq('user_id', userId).gte('fecha', firstDay)
        let queryVG = supabase.from('ventas_gallinas').select('monto_total, estado_pago').eq('user_id', userId).gte('fecha', firstDay)
        let queryPL = supabase.from('produccion_leche').select('monto_total, estado_pago').eq('user_id', userId).gte('fecha', firstDay)
        let queryGP = supabase.from('gastos_pollos').select('monto').eq('user_id', userId).gte('fecha', firstDay)
        let queryGG = supabase.from('gastos_gallinas').select('monto').eq('user_id', userId).gte('fecha', firstDay)
        let queryGV = supabase.from('gastos_vacas').select('monto').eq('user_id', userId).gte('fecha', firstDay)
        let queryAP = supabase.from('aportes_pollos').select('monto').eq('user_id', userId).gte('fecha', firstDay)
        let queryAG = supabase.from('aportes_gallinas').select('monto').eq('user_id', userId).gte('fecha', firstDay)
        let queryAV = supabase.from('aportes_vacas').select('monto').eq('user_id', userId).gte('fecha', firstDay)

        if (endDate) {
            queryIP = queryIP.lte('fecha', endDate)
            queryVG = queryVG.lte('fecha', endDate)
            queryPL = queryPL.lte('fecha', endDate)
            queryGP = queryGP.lte('fecha', endDate)
            queryGG = queryGG.lte('fecha', endDate)
            queryGV = queryGV.lte('fecha', endDate)
            queryAP = queryAP.lte('fecha', endDate)
            queryAG = queryAG.lte('fecha', endDate)
            queryAV = queryAV.lte('fecha', endDate)
        }

        const [
            { data: ingresosPollos },
            { data: ventasGallinas },
            { data: produccionLeche },
            { data: gastosPollos },
            { data: gastosGallinas },
            { data: gastosVacas },
            { data: aportesPollos },
            { data: aportesGallinas },
            { data: aportesVacas }
        ] = await Promise.all([queryIP, queryVG, queryPL, queryGP, queryGG, queryGV, queryAP, queryAG, queryAV])

        const totalIngresos =
            (ingresosPollos?.reduce((acc, i) => acc + (i.monto_total || 0), 0) || 0) +
            (ventasGallinas?.reduce((acc, v) => acc + (v.monto_total || 0), 0) || 0) +
            (produccionLeche?.reduce((acc, p) => acc + (p.monto_total || 0), 0) || 0)

        const totalPorCobrar =
            (ingresosPollos?.filter(i => i.estado_pago === 'debe').reduce((acc, i) => acc + (i.monto_total || 0), 0) || 0) +
            (ventasGallinas?.filter(v => v.estado_pago === 'debe').reduce((acc, v) => acc + (v.monto_total || 0), 0) || 0) +
            (produccionLeche?.filter(p => p.estado_pago === 'debe').reduce((acc, p) => acc + (p.monto_total || 0), 0) || 0)

        const totalGastos =
            (gastosPollos?.reduce((acc, g) => acc + (g.monto || 0), 0) || 0) +
            (gastosGallinas?.reduce((acc, g) => acc + (g.monto || 0), 0) || 0) +
            (gastosVacas?.reduce((acc, g) => acc + (g.monto || 0), 0) || 0)

        const totalAportes =
            (aportesPollos?.reduce((acc, a) => acc + (a.monto || 0), 0) || 0) +
            (aportesGallinas?.reduce((acc, a) => acc + (a.monto || 0), 0) || 0) +
            (aportesVacas?.reduce((acc, a) => acc + (a.monto || 0), 0) || 0)

        return {
            ingresos: totalIngresos,
            gastos: totalGastos,
            aportes: totalAportes,
            porCobrar: totalPorCobrar,
            balance: (totalIngresos - totalPorCobrar + totalAportes) - totalGastos
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return { ingresos: 0, gastos: 0, porCobrar: 0, balance: 0 }
    }
}

export const getFinancialMovements = async (userId, startDate, endDate = null) => {
    try {
        // Select only necessary columns to reduce payload size
        const gastosCols = 'id, monto, fecha, concepto, categoria'
        const aportesCols = 'id, monto, fecha, concepto, socios'

        let ingresosPollosQuery = supabase.from('ingresos_pollos').select('id, monto_total, fecha, estado_pago, cliente').eq('user_id', userId).gte('fecha', startDate)
        let ventasGallinasQuery = supabase.from('ventas_gallinas').select('id, monto_total, fecha, estado_pago, cliente').eq('user_id', userId).gte('fecha', startDate)
        let produccionLecheQuery = supabase.from('produccion_leche').select('id, monto_total, fecha, estado_pago, cliente').eq('user_id', userId).gte('fecha', startDate)
        let gastosPollosQuery = supabase.from('gastos_pollos').select(gastosCols).eq('user_id', userId).gte('fecha', startDate)
        let gastosGallinasQuery = supabase.from('gastos_gallinas').select(gastosCols).eq('user_id', userId).gte('fecha', startDate)
        let gastosVacasQuery = supabase.from('gastos_vacas').select(gastosCols).eq('user_id', userId).gte('fecha', startDate)
        let aportesPollosQuery = supabase.from('aportes_pollos').select(aportesCols).eq('user_id', userId).gte('fecha', startDate)
        let aportesGallinasQuery = supabase.from('aportes_gallinas').select(aportesCols).eq('user_id', userId).gte('fecha', startDate)
        let aportesVacasQuery = supabase.from('aportes_vacas').select(aportesCols).eq('user_id', userId).gte('fecha', startDate)

        if (endDate) {
            ingresosPollosQuery = ingresosPollosQuery.lte('fecha', endDate)
            ventasGallinasQuery = ventasGallinasQuery.lte('fecha', endDate)
            produccionLecheQuery = produccionLecheQuery.lte('fecha', endDate)
            gastosPollosQuery = gastosPollosQuery.lte('fecha', endDate)
            gastosGallinasQuery = gastosGallinasQuery.lte('fecha', endDate)
            gastosVacasQuery = gastosVacasQuery.lte('fecha', endDate)
            aportesPollosQuery = aportesPollosQuery.lte('fecha', endDate)
            aportesGallinasQuery = aportesGallinasQuery.lte('fecha', endDate)
            aportesVacasQuery = aportesVacasQuery.lte('fecha', endDate)
        }

        const [
            { data: ingresosPollos },
            { data: ventasGallinas },
            { data: produccionLeche },
            { data: gastosPollos },
            { data: gastosGallinas },
            { data: gastosVacas },
            { data: aportesPollos },
            { data: aportesGallinas },
            { data: aportesVacas }
        ] = await Promise.all([
            ingresosPollosQuery,
            ventasGallinasQuery,
            produccionLecheQuery,
            gastosPollosQuery,
            gastosGallinasQuery,
            gastosVacasQuery,
            aportesPollosQuery,
            aportesGallinasQuery,
            aportesVacasQuery
        ])

        const todosMovimientos = [
            ...(ingresosPollos?.map(i => ({ tipo: 'ingreso', concepto: `Venta de Pollos${i.cliente ? ' - ' + i.cliente : ''}`, monto: i.monto_total, fecha: i.fecha, modulo: 'Pollos', estado_pago: i.estado_pago || 'pagado' })) || []),
            ...(ventasGallinas?.map(v => ({ tipo: 'ingreso', concepto: `Venta de Huevos${v.cliente ? ' - ' + v.cliente : ''}`, monto: v.monto_total, fecha: v.fecha, modulo: 'Gallinas', estado_pago: v.estado_pago || 'pagado' })) || []),
            ...(produccionLeche?.map(p => ({ tipo: 'ingreso', concepto: `Venta de Leche${p.cliente ? ' - ' + p.cliente : ''}`, monto: p.monto_total, fecha: p.fecha, modulo: 'Vacas', estado_pago: p.estado_pago || 'pagado' })) || []),
            ...(gastosPollos?.map(g => ({ tipo: 'gasto', concepto: g.concepto, monto: g.monto, fecha: g.fecha, modulo: 'Pollos', categoria: g.categoria })) || []),
            ...(gastosGallinas?.map(g => ({ tipo: 'gasto', concepto: g.concepto, monto: g.monto, fecha: g.fecha, modulo: 'Gallinas', categoria: g.categoria })) || []),
            ...(gastosVacas?.map(g => ({ tipo: 'gasto', concepto: g.concepto, monto: g.monto, fecha: g.fecha, modulo: 'Vacas', categoria: g.categoria })) || []),
            ...(aportesPollos?.map(a => ({ tipo: 'aporte', concepto: a.concepto, monto: a.monto, fecha: a.fecha, modulo: 'Pollos', socios: a.socios })) || []),
            ...(aportesGallinas?.map(a => ({ tipo: 'aporte', concepto: a.concepto, monto: a.monto, fecha: a.fecha, modulo: 'Gallinas', socios: a.socios })) || []),
            ...(aportesVacas?.map(a => ({ tipo: 'aporte', concepto: a.concepto, monto: a.monto, fecha: a.fecha, modulo: 'Vacas', socios: a.socios })) || [])
        ]

        todosMovimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        return todosMovimientos
    } catch (error) {
        console.error('Error fetching financial movements:', error)
        return []
    }
}

export const getInventoryStats = async (userId) => {
    /* if (isDemo()) {
        const { data: pollos } = await demoService.getAll('producciones_pollos', userId)
        const { data: gallinas } = await demoService.getAll('lotes_gallinas', userId)
        const { data: vacas } = await demoService.getAll('inventario_vacas', userId)

        return {
            totalPollos: pollos?.filter(p => p.estado === 'activo').reduce((acc, curr) => acc + Number(curr.cantidad_actual || 0), 0) || 0,
            totalGallinas: gallinas?.reduce((acc, curr) => acc + Number(curr.poblacion_actual || 0), 0) || 0,
            totalVacas: vacas?.length || 0
        }
    } */

    try {
        const { data: pollos } = await supabase.from('producciones_pollos').select('cantidad_actual').eq('user_id', userId).eq('estado', 'activo')
        const totalPollos = pollos?.reduce((acc, curr) => acc + (curr.cantidad_actual || 0), 0) || 0

        const { data: gallinas } = await supabase.from('lotes_gallinas').select('poblacion_actual').eq('user_id', userId)
        const totalGallinas = gallinas?.reduce((acc, curr) => acc + (curr.poblacion_actual || 0), 0) || 0

        const { count: totalVacas } = await supabase.from('inventario_vacas').select('*', { count: 'exact', head: true }).eq('user_id', userId)

        return {
            totalPollos,
            totalGallinas,
            totalVacas: totalVacas || 0
        }
    } catch (error) {
        console.error('Error inventory stats:', error)
        return { totalPollos: 0, totalGallinas: 0, totalVacas: 0 }
    }
}

export const getProductionHistory = async (userId, days = 30) => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    try {
        // Huevos
        const { data: huevos } = await supabase
            .from('ventas_gallinas')
            .select('fecha, cantidad, unidad_medida')
            .gte('fecha', startDateStr)
            .order('fecha', { ascending: true })

        // Leche
        const { data: leche } = await supabase
            .from('produccion_leche')
            .select('fecha, litros')
            .eq('user_id', userId)
            .gte('fecha', startDateStr)
            .order('fecha', { ascending: true })

        // Agrupar por fecha
        const historyMap = {}

        // Llenar con fechas vacías para continuidad
        for (let i = 0; i <= days; i++) {
            const d = new Date(startDate)
            d.setDate(startDate.getDate() + i)
            const dateStr = d.toISOString().split('T')[0]
            // Formato corto para gráfica DD/MM
            const shortDate = `${d.getDate()}/${d.getMonth() + 1}`

            historyMap[dateStr] = {
                fecha: dateStr,
                shortDate,
                huevos: 0,
                leche: 0
            }
        }

        huevos?.forEach(h => {
            if (historyMap[h.fecha]) {
                const qty = h.unidad_medida === 'carton' ? Number(h.cantidad) * 30 : Number(h.cantidad)
                historyMap[h.fecha].huevos += qty
            }
        })

        leche?.forEach(l => {
            if (historyMap[l.fecha]) {
                historyMap[l.fecha].leche += Number(l.litros)
            }
        })

        return Object.values(historyMap).sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

    } catch (error) {
        console.error('Error fetching history:', error)
        return []
    }
}

export const getFinancialHistory = async (userId, days = 30) => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    try {
        // Fetch all financial data in one go (could be optimized but fine for now)
        const [
            { data: ingresosPollos },
            { data: ventasGallinas },
            { data: produccionLeche },
            { data: gastosPollos },
            { data: gastosGallinas },
            { data: gastosVacas },
            { data: aportesPollos },
            { data: aportesGallinas },
            { data: aportesVacas }
        ] = await Promise.all([
            supabase.from('ingresos_pollos').select('monto_total, fecha').eq('user_id', userId).gte('fecha', startDateStr),
            supabase.from('ventas_gallinas').select('monto_total, fecha').eq('user_id', userId).gte('fecha', startDateStr),
            supabase.from('produccion_leche').select('monto_total, fecha').eq('user_id', userId).gte('fecha', startDateStr),
            supabase.from('gastos_pollos').select('monto, fecha').eq('user_id', userId).gte('fecha', startDateStr),
            supabase.from('gastos_gallinas').select('monto, fecha').eq('user_id', userId).gte('fecha', startDateStr),
            supabase.from('gastos_vacas').select('monto, fecha').eq('user_id', userId).gte('fecha', startDateStr),
            supabase.from('aportes_pollos').select('monto, fecha').eq('user_id', userId).gte('fecha', startDateStr),
            supabase.from('aportes_gallinas').select('monto, fecha').eq('user_id', userId).gte('fecha', startDateStr),
            supabase.from('aportes_vacas').select('monto, fecha').eq('user_id', userId).gte('fecha', startDateStr)
        ])

        const historyMap = {}

        // Initialize dates
        for (let i = 0; i <= days; i++) {
            const d = new Date(startDate)
            d.setDate(startDate.getDate() + i)
            const dateStr = d.toISOString().split('T')[0]
            const shortDate = `${d.getDate()}/${d.getMonth() + 1}`

            historyMap[dateStr] = {
                fecha: dateStr,
                shortDate,
                ingresos: 0,
                gastos: 0
            }
        }

        // Helper to aggregate
        const aggregate = (items, key, field) => {
            items?.forEach(item => {
                if (historyMap[item.fecha]) {
                    historyMap[item.fecha][key] += Number(item[field] || 0)
                }
            })
        }

        aggregate(ingresosPollos, 'ingresos', 'monto_total')
        aggregate(ventasGallinas, 'ingresos', 'monto_total')
        aggregate(produccionLeche, 'ingresos', 'monto_total')

        aggregate(gastosPollos, 'gastos', 'monto')
        aggregate(gastosGallinas, 'gastos', 'monto')
        aggregate(gastosVacas, 'gastos', 'monto')

        aggregate(aportesPollos, 'ingresos', 'monto') // Aportes are treated as inflow
        aggregate(aportesGallinas, 'ingresos', 'monto')
        aggregate(aportesVacas, 'ingresos', 'monto')

        return Object.values(historyMap).sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

    } catch (error) {
        console.error('Error fetching financial history:', error)
        return []
    }
}
