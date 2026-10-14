(function () {
    const CLAVE = 'gestion-stock-historial';
    const NS = 'http://www.w3.org/2000/svg';
    const DIAS_PERIODO = 7;
    const EJEMPLO = {
        pedidos: { actual: 46, antes: 38 },
        faltantes: { actual: 6, antes: 4 },
        inexistentes: { actual: 2, antes: 3 }
    };

    const contenedor = document.getElementById('crec-grafico');
    const lista = document.getElementById('crec-lista');
    const aviso = document.getElementById('crec-aviso');
    const avisoTexto = document.getElementById('crec-aviso-texto');
    const btnModo = document.getElementById('crec-modo');
    if (!contenedor || !lista || typeof productos === 'undefined') return;

    let forzarEjemplo = null; // null = automático: ejemplo mientras no haya datos para comparar

    /* ---------- Fechas e historial ---------- */
    function iso(fecha) { return fecha.toLocaleDateString('en-CA'); }
    function diasAtras(n) {
        const h = new Date();
        return iso(new Date(h.getFullYear(), h.getMonth(), h.getDate() - n));
    }

    function leerHistorial() {
        try {
            const g = localStorage.getItem(CLAVE);
            if (g) return JSON.parse(g);
        } catch (e) { /* sin almacenamiento disponible */ }
        return [];
    }

    function guardarHistorial(h) {
        try { localStorage.setItem(CLAVE, JSON.stringify(h)); } catch (e) { /* sin almacenamiento disponible */ }
    }

    // Una "foto" por día de cuántos productos faltan y cuántos no existen en stock
    function registrarHoy() {
        const hoy = diasAtras(0);
        const historial = leerHistorial().filter(function (x) { return x.fecha !== hoy; });
        historial.push({
            fecha: hoy,
            faltantes: productos.filter(function (p) { return estadoDe(p) === 'bajo'; }).length,
            inexistentes: productos.filter(function (p) { return estadoDe(p) === 'agotado'; }).length
        });
        historial.sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
        guardarHistorial(historial.slice(-90));
    }

    function referencia() {
        const hoy = diasAtras(0);
        const objetivo = diasAtras(DIAS_PERIODO);
        const previos = leerHistorial().filter(function (x) { return x.fecha < hoy; });
        if (!previos.length) return null;
        const hastaObjetivo = previos.filter(function (x) { return x.fecha <= objetivo; });
        return hastaObjetivo.length ? hastaObjetivo[hastaObjetivo.length - 1] : previos[0];
    }

    function contarPedidos(desde, hasta) {
        const v = window.finanzas ? window.finanzas.ventas() : [];
        return v.filter(function (x) { return x.fecha >= desde && x.fecha <= hasta; }).length;
    }

    /* ---------- Datos ---------- */
    function datosReales() {
        const ref = referencia();
        const pedidosActual = contarPedidos(diasAtras(DIAS_PERIODO - 1), diasAtras(0));
        const pedidosAntes = contarPedidos(diasAtras(DIAS_PERIODO * 2 - 1), diasAtras(DIAS_PERIODO));
        return {
            hayDatos: pedidosActual + pedidosAntes > 0 || ref !== null,
            pedidos: { actual: pedidosActual, antes: pedidosActual + pedidosAntes > 0 ? pedidosAntes : null },
            faltantes: {
                actual: productos.filter(function (p) { return estadoDe(p) === 'bajo'; }).length,
                antes: ref ? ref.faltantes : null
            },
            inexistentes: {
                actual: productos.filter(function (p) { return estadoDe(p) === 'agotado'; }).length,
                antes: ref ? ref.inexistentes : null
            }
        };
    }

    // 100 = igual que antes · 200 = el doble o más · 0 = desapareció
    function indice(actual, antes) {
        if (antes === null) return 100;
        if (antes === 0) return actual === 0 ? 100 : 200;
        return Math.max(0, Math.min(200, actual / antes * 100));
    }

    function cambio(actual, antes) {
        if (antes === null) return { texto: 'Sin datos previos', delta: 0, sin: true };
        if (antes === 0) return actual === 0 ? { texto: 'Sin cambios', delta: 0 } : { texto: 'Nuevo', delta: 1 };
        const pct = Math.round((actual - antes) / antes * 100);
        return { texto: (pct > 0 ? '+' : pct < 0 ? '−' : '') + Math.abs(pct) + '%', delta: pct };
    }

    /* ---------- Dibujo: anillo con el índice de cada rama ---------- */
    function svg(tag, atributos) {
        const n = document.createElementNS(NS, tag);
        Object.keys(atributos || {}).forEach(function (k) { n.setAttribute(k, atributos[k]); });
        return n;
    }

    const C0 = 90, RADIO = 64, GROSOR = 28, SEPARACION = 4;
    const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

    function dibujar(ramas) {
        const total = ramas.reduce(function (s, r) { return s + r.indice; }, 0);
        const promedio = Math.round(total / ramas.length);

        const g = svg('svg', { viewBox: '0 0 180 180', role: 'img', class: 'block h-auto w-full' });
        g.setAttribute('aria-label', 'Anillo del índice de crecimiento. Índice general ' + promedio + '. ' + ramas.map(function (r) {
            return r.nombre + ': índice ' + Math.round(r.indice) + ' (' + r.cambio.texto + ')';
        }).join('. ') + '. 100 significa sin cambios respecto del período anterior.');

        // Fondo del anillo
        g.appendChild(svg('circle', { cx: C0, cy: C0, r: RADIO, fill: 'none', stroke: 'var(--viz-gris-fondo)', 'stroke-width': GROSOR }));

        // Una porción por rama, proporcional a su índice
        let acumulado = 0;
        ramas.forEach(function (r) {
            const parte = total > 0 ? r.indice / total * CIRCUNFERENCIA : 0;
            const largo = Math.max(0, parte - SEPARACION);
            if (largo > 0) {
                g.appendChild(svg('circle', {
                    cx: C0, cy: C0, r: RADIO, fill: 'none', stroke: r.color, 'stroke-width': GROSOR,
                    'stroke-dasharray': largo.toFixed(2) + ' ' + (CIRCUNFERENCIA - largo).toFixed(2),
                    'stroke-dashoffset': (-(acumulado + SEPARACION / 2)).toFixed(2),
                    transform: 'rotate(-90 ' + C0 + ' ' + C0 + ')'
                }));
            }
            acumulado += parte;
        });

        // Centro: índice general
        const numero = svg('text', { x: C0, y: C0 + 2, 'text-anchor': 'middle', 'font-size': 32, 'font-weight': 700, fill: 'var(--texto)' });
        numero.textContent = promedio;
        g.appendChild(numero);
        const rotulo = svg('text', { x: C0, y: C0 + 21, 'text-anchor': 'middle', 'font-size': 10.5, fill: 'var(--texto-suave)' });
        rotulo.textContent = 'índice general';
        g.appendChild(rotulo);

        contenedor.replaceChildren(g);
    }

    function el(etiqueta, clases, texto) {
        const n = document.createElement(etiqueta);
        if (clases) n.className = clases;
        if (texto !== undefined) n.textContent = texto;
        return n;
    }

    function fila(r) {
        const li = el('li', 'flex items-center gap-3 py-2.5');
        const punto = el('span', 'size-3.5 shrink-0 rounded-full');
        punto.style.background = r.color;
        li.appendChild(punto);

        const info = el('div', 'min-w-0 flex-1');
        info.appendChild(el('p', 'text-sm font-semibold text-(--texto) sm:text-base', r.nombre));
        const antes = r.antes === null ? '' : ' (antes ' + r.antes + ')';
        info.appendChild(el('p', 'text-xs leading-snug text-(--texto-suave)', r.actual + ' ' + r.unidad + antes));
        li.appendChild(info);

        const c = r.cambio;
        let color = 'text-(--texto-suave)';
        if (!c.sin && c.delta !== 0) {
            const bueno = r.crecerEsBueno ? c.delta > 0 : c.delta < 0;
            color = bueno ? 'text-(--viz-verde-texto)' : 'text-(--viz-naranja-texto)';
        }
        const cifras = el('div', 'shrink-0 text-right');
        cifras.appendChild(el('p', 'text-lg font-bold leading-none text-(--texto) tabular-nums sm:text-xl', String(Math.round(r.indice))));
        cifras.appendChild(el('p', 'mt-1 text-xs font-semibold tabular-nums ' + color, c.texto));
        li.appendChild(cifras);
        return li;
    }

    function render() {
        const real = datosReales();
        const ejemplo = forzarEjemplo !== null ? forzarEjemplo : !real.hayDatos;
        const d = ejemplo ? EJEMPLO : real;

        const ramas = [
            { nombre: 'Pedidos', unidad: 'ventas en ' + DIAS_PERIODO + ' días', color: 'var(--viz-violeta)', crecerEsBueno: true, actual: d.pedidos.actual, antes: d.pedidos.antes },
            { nombre: 'Faltantes', unidad: 'productos con stock bajo', color: 'var(--viz-naranja)', crecerEsBueno: false, actual: d.faltantes.actual, antes: d.faltantes.antes },
            { nombre: 'Inexistentes', unidad: 'productos sin stock', color: 'var(--viz-gris)', crecerEsBueno: false, actual: d.inexistentes.actual, antes: d.inexistentes.antes }
        ].map(function (r) {
            r.indice = indice(r.actual, r.antes);
            r.cambio = cambio(r.actual, r.antes);
            return r;
        });

        dibujar(ramas);
        lista.replaceChildren(...ramas.map(fila));

        if (ejemplo) {
            aviso.className = 'mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--viz-naranja)/40 bg-(--viz-naranja-fondo) px-4 py-2.5 text-sm text-(--viz-naranja-texto)';
            avisoTexto.textContent = 'Estás viendo datos de ejemplo. Con tus ventas y el stock de varios días vas a ver tu propio crecimiento.';
            btnModo.textContent = 'Ver mis datos';
        } else {
            aviso.className = 'mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--borde) bg-(--fondo) px-4 py-2.5 text-sm text-(--texto-suave)';
            avisoTexto.textContent = 'Estás viendo tus datos reales. Las ramas de productos se comparan con la medición de días anteriores.';
            btnModo.textContent = 'Ver datos de ejemplo';
        }
    }

    btnModo.addEventListener('click', function () {
        const real = datosReales();
        const ejemploAhora = forzarEjemplo !== null ? forzarEjemplo : !real.hayDatos;
        forzarEjemplo = !ejemploAhora;
        render();
    });

    document.addEventListener('inventario:cambio', function () { registrarHoy(); render(); });
    document.addEventListener('finanzas:cambio', render);

    registrarHoy();
    render();
})();
