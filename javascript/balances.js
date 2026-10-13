(function () {
    const MONEDA = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const CATEGORIA_COSTO = 'Mercadería y proveedores';
    const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const COLOR_INGRESOS = 'bg-(--viz-violeta)';
    const COLOR_PICO = 'bg-(--viz-azul)';
    const COLOR_EGRESOS = 'bg-(--viz-naranja)';

    const selectPeriodo = document.getElementById('bal-periodo');
    const grafico = document.getElementById('bal-grafico');
    const etiquetas = document.getElementById('bal-etiquetas');
    const tabla = document.getElementById('bal-tabla');
    const aviso = document.getElementById('bal-aviso');
    const avisoTexto = document.getElementById('bal-aviso-texto');
    const btnModo = document.getElementById('bal-modo');
    const form = document.getElementById('bal-form');
    const mensaje = document.getElementById('bal-mensaje');
    const campoFecha = document.getElementById('bal-fecha');
    if (!selectPeriodo || !grafico || !form) return;

    let forzarEjemplo = null; // null = automático: ejemplo si todavía no hay datos propios

    /* ---------- Utilidades ---------- */
    function iso(fecha) {
        return fecha.toLocaleDateString('en-CA');
    }

    function mayuscula(texto) {
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    function compacto(n) {
        if (n >= 1000000) return '$' + String(+(n / 1000000).toFixed(2)).replace('.', ',') + ' M';
        if (n >= 1000) return '$' + String(+(n / 1000).toFixed(1)).replace('.', ',') + ' k';
        return '$' + Math.round(n);
    }

    function el(etiqueta, clases, texto) {
        const nodo = document.createElement(etiqueta);
        if (clases) nodo.className = clases;
        if (texto !== undefined) nodo.textContent = texto;
        return nodo;
    }

    function dia(mapa, fecha) {
        if (!mapa[fecha]) mapa[fecha] = { ing: 0, costo: 0, otros: 0 };
        return mapa[fecha];
    }

    /* ---------- Datos ---------- */
    function datosReales() {
        const mapa = {};
        if (!window.finanzas) return mapa;
        window.finanzas.ventas().forEach(function (v) { dia(mapa, v.fecha).ing += v.total; });
        window.finanzas.gastos().forEach(function (g) {
            const d = dia(mapa, g.fecha);
            if (g.categoria === CATEGORIA_COSTO) d.costo += g.monto; else d.otros += g.monto;
        });
        return mapa;
    }

    let cacheEjemplo = null;
    function datosEjemplo() {
        const hoy = new Date();
        const clave = iso(hoy);
        if (cacheEjemplo && cacheEjemplo.clave === clave) return cacheEjemplo.mapa;
        const mapa = {};
        for (let atras = 0; atras < 366; atras++) {
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - atras);
            const crecimiento = 1 + ((365 - atras) / 365) * 0.9;
            const r1 = Math.abs(Math.sin(atras * 12.9898) * 43758.5453) % 1;
            const r2 = Math.abs(Math.sin(atras * 78.233) * 12345.6789) % 1;
            const r3 = Math.abs(Math.sin(atras * 39.346) * 98765.4321) % 1;
            // Picos de ejemplo: dos meses de temporada alta y un par de días con ventas muy altas
            const mesesAtras = (hoy.getFullYear() * 12 + hoy.getMonth()) - (fecha.getFullYear() * 12 + fecha.getMonth());
            let pico = 1;
            if (mesesAtras === 3) pico = 2.1;
            else if (mesesAtras === 1) pico = 1.8;
            if (atras === 2) pico = Math.max(pico, 2.6);
            else if (atras === 9) pico = Math.max(pico, 2.2);
            const ing = Math.round((18000 * crecimiento * pico * (0.7 + 0.6 * r1)) / 1000) * 1000;
            mapa[iso(fecha)] = {
                ing: ing,
                costo: Math.round(ing * (0.53 + 0.06 * r2) / 100) * 100,
                otros: Math.round(3500 * (0.8 + 0.4 * r3) / 100) * 100
            };
        }
        cacheEjemplo = { clave: clave, mapa: mapa };
        return mapa;
    }

    function usarEjemplo(real) {
        if (forzarEjemplo !== null) return forzarEjemplo;
        return Object.keys(real).length === 0;
    }

    /* ---------- Períodos ---------- */
    function periodos(tipo) {
        const hoy = new Date();
        const lista = [];
        if (tipo === 'semana') {
            for (let i = 6; i >= 0; i--) {
                const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
                lista.push({
                    etiqueta: DIAS[d.getDay()] + ' ' + d.getDate(),
                    titulo: mayuscula(d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })),
                    desde: iso(d), hasta: iso(d)
                });
            }
        } else if (tipo === 'mes') {
            const y = hoy.getFullYear();
            const m = hoy.getMonth();
            const ultimo = new Date(y, m + 1, 0).getDate();
            [[1, 7], [8, 14], [15, 21], [22, 28], [29, ultimo]].forEach(function (r) {
                if (r[0] > ultimo) return;
                const hasta = Math.min(r[1], ultimo);
                lista.push({
                    etiqueta: r[0] === hasta ? String(r[0]) : r[0] + '–' + hasta,
                    titulo: 'Del ' + r[0] + ' al ' + hasta + ' de ' + MESES[m],
                    desde: iso(new Date(y, m, r[0])), hasta: iso(new Date(y, m, hasta))
                });
            });
        } else {
            const cantidad = tipo === 'anio' ? 12 : 6;
            for (let i = cantidad - 1; i >= 0; i--) {
                const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
                lista.push({
                    etiqueta: MESES[d.getMonth()],
                    titulo: mayuscula(d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })),
                    desde: iso(d), hasta: iso(new Date(d.getFullYear(), d.getMonth() + 1, 0))
                });
            }
        }
        return lista;
    }

    function sumar(lista, mapa) {
        const claves = Object.keys(mapa);
        lista.forEach(function (p) {
            p.ing = 0; p.costo = 0; p.otros = 0;
            claves.forEach(function (k) {
                if (k >= p.desde && k <= p.hasta) {
                    p.ing += mapa[k].ing; p.costo += mapa[k].costo; p.otros += mapa[k].otros;
                }
            });
            p.egr = p.costo + p.otros;
            p.gan = p.ing - p.egr;
        });
        return lista;
    }

    /* ---------- Dibujo ---------- */
    function colorGanancia(valor) {
        return valor > 0 ? 'text-(--viz-verde-texto)' : (valor < 0 ? 'text-(--viz-naranja-texto)' : 'text-(--texto)');
    }

    function escala(max) {
        if (max <= 0) return { tope: 1, pasos: 4 };
        const exp = Math.pow(10, Math.floor(Math.log10(max)));
        const f = max / exp;
        const nf = f <= 1 ? 1 : (f <= 2 ? 2 : (f <= 2.5 ? 2.5 : (f <= 5 ? 5 : 10)));
        // pasos que dan valores redondos en el eje ($500 k, $1 M, $1,5 M…)
        return { tope: nf * exp, pasos: (nf === 1 || nf === 2) ? 4 : 5 };
    }

    function dibujarGrafico(lista) {
        const max = lista.reduce(function (m, p) { return Math.max(m, p.ing, p.egr); }, 0);
        const esc = escala(max);
        const tope = esc.tope;
        const columnas = 'repeat(' + lista.length + ', minmax(0, 1fr))';
        const angostas = lista.length > 8;
        const nodos = [];

        for (let t = 0; t <= esc.pasos; t++) {
            const altura = (t / esc.pasos) * 100;
            const linea = el('div', 'absolute inset-x-0 border-t ' + (t === 0 ? 'border-(--texto-suave)/40' : 'border-dashed border-(--borde)'));
            linea.style.bottom = altura + '%';
            nodos.push(linea);
            const rotulo = el('span', 'absolute right-full mr-2 whitespace-nowrap text-[11px] text-(--texto-suave)', compacto(tope * t / esc.pasos));
            rotulo.style.bottom = altura + '%';
            rotulo.style.transform = 'translateY(50%)';
            nodos.push(rotulo);
        }

        const barras = el('div', 'absolute inset-0 grid items-end');
        barras.style.gridTemplateColumns = columnas;
        const iPico = max > 0 ? lista.reduce(function (im, p, i) { return p.ing > lista[im].ing ? i : im; }, 0) : -1;
        lista.forEach(function (p, i) {
            const col = el('div', 'flex h-full items-end justify-center gap-0.5 sm:gap-1');
            col.title = p.titulo + ': ingresos ' + MONEDA.format(p.ing) + ', egresos ' + MONEDA.format(p.egr);
            [[p.ing, i === iPico && p.ing > 0 ? COLOR_PICO : COLOR_INGRESOS], [p.egr, COLOR_EGRESOS]].forEach(function (par) {
                const barra = el('div', (angostas ? 'w-1.5 sm:w-3 ' : 'w-2.5 sm:w-4 ') + 'rounded-t ' + par[1]);
                barra.style.height = par[0] > 0 ? 'max(' + (par[0] / tope * 100) + '%, 2px)' : '0';
                col.appendChild(barra);
            });
            barras.appendChild(col);
        });
        nodos.push(barras);

        if (max === 0) {
            nodos.push(el('p', 'absolute inset-0 flex items-center justify-center text-center text-sm text-(--texto-suave)', 'Todavía no hay movimientos en este período.'));
        }
        grafico.replaceChildren(...nodos);

        etiquetas.style.gridTemplateColumns = columnas;
        etiquetas.replaceChildren(...lista.map(function (p) {
            return el('span', 'truncate text-center text-[10px] text-(--texto-suave) sm:text-xs', p.etiqueta);
        }));
        grafico.setAttribute('aria-label', 'Gráfico de barras de ingresos y gastos. ' + lista.map(function (p) {
            return p.titulo + ': ingresos ' + MONEDA.format(p.ing) + ', egresos ' + MONEDA.format(p.egr);
        }).join('. '));
    }

    function dibujarTabla(lista, totales) {
        tabla.replaceChildren(...lista.map(function (p) {
            const tr = el('tr', 'border-b border-(--borde)');
            tr.appendChild(el('th', 'py-2.5 pr-3 font-medium text-(--texto)', p.titulo));
            tr.appendChild(el('td', 'py-2.5 pr-3 text-right text-(--texto)', MONEDA.format(p.ing)));
            tr.appendChild(el('td', 'py-2.5 pr-3 text-right text-(--texto)', MONEDA.format(p.egr)));
            tr.appendChild(el('td', 'py-2.5 text-right font-semibold ' + colorGanancia(p.gan), MONEDA.format(p.gan)));
            tr.firstChild.setAttribute('scope', 'row');
            tr.firstChild.className += ' text-left';
            return tr;
        }));
        document.getElementById('bal-t-ing').textContent = MONEDA.format(totales.ing);
        document.getElementById('bal-t-egr').textContent = MONEDA.format(totales.egr);
        const gan = document.getElementById('bal-t-gan');
        gan.textContent = MONEDA.format(totales.gan);
        gan.className = 'py-3 text-right ' + colorGanancia(totales.gan);
    }

    function render() {
        const real = datosReales();
        const ejemplo = usarEjemplo(real);
        const lista = sumar(periodos(selectPeriodo.value), ejemplo ? datosEjemplo() : real);

        const totales = lista.reduce(function (t, p) {
            t.ing += p.ing; t.costo += p.costo; t.otros += p.otros; return t;
        }, { ing: 0, costo: 0, otros: 0 });
        totales.egr = totales.costo + totales.otros;
        totales.gan = totales.ing - totales.egr;

        document.getElementById('bal-ingresos').textContent = MONEDA.format(totales.ing);
        document.getElementById('bal-costo').textContent = MONEDA.format(totales.costo);
        document.getElementById('bal-otros').textContent = MONEDA.format(totales.otros);
        const ganancia = document.getElementById('bal-ganancia');
        ganancia.textContent = MONEDA.format(totales.gan);
        ganancia.className = 'mt-1.5 text-xl font-bold sm:text-2xl ' + colorGanancia(totales.gan);

        const margen = totales.ing > 0 ? totales.gan / totales.ing * 100 : null;
        const textoMargen = document.getElementById('bal-margen');
        textoMargen.textContent = margen === null ? '—' : margen.toFixed(1).replace('.', ',') + '%';
        textoMargen.className = 'text-xl font-bold ' + (margen !== null && margen < 0 ? 'text-(--viz-naranja-texto)' : 'text-(--texto)');
        const ancho = margen === null ? 0 : Math.max(0, Math.min(100, margen));
        document.getElementById('bal-barra-relleno').style.width = ancho + '%';
        document.getElementById('bal-barra').setAttribute('aria-valuenow', String(Math.round(ancho)));

        dibujarGrafico(lista);
        dibujarTabla(lista, totales);

        if (ejemplo) {
            aviso.className = 'mx-5 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--viz-naranja)/40 bg-(--viz-naranja-fondo) px-4 py-2.5 text-sm text-(--viz-naranja-texto) sm:mx-6';
            avisoTexto.textContent = 'Estás viendo datos de ejemplo. Registrá ventas y gastos para ver tus propios números.';
            btnModo.textContent = 'Ver mis datos';
        } else {
            aviso.className = 'mx-5 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--borde) bg-(--fondo) px-4 py-2.5 text-sm text-(--texto-suave) sm:mx-6';
            avisoTexto.textContent = 'Estás viendo tus ventas y gastos registrados.';
            btnModo.textContent = 'Ver datos de ejemplo';
        }
        btnModo.className = 'rounded-full border border-current/40 px-4 py-2 text-xs font-semibold cursor-pointer transition hover:bg-black/5';
    }

    /* ---------- Eventos ---------- */
    selectPeriodo.addEventListener('change', render);

    btnModo.addEventListener('click', function () {
        forzarEjemplo = !usarEjemplo(datosReales());
        render();
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const monto = parseFloat(document.getElementById('bal-monto').value);
        let texto = '';
        let bien = false;
        if (!window.finanzas) {
            texto = 'No se pudo registrar el gasto. Recargá la página.';
        } else if (!(monto > 0)) {
            texto = 'Ingresá un monto mayor a 0.';
        } else {
            window.finanzas.agregarGasto({
                fecha: campoFecha.value || iso(new Date()),
                categoria: document.getElementById('bal-tipo').value,
                detalle: document.getElementById('bal-detalle').value.trim(),
                monto: monto
            });
            forzarEjemplo = false;
            form.reset();
            campoFecha.value = iso(new Date());
            texto = 'Gasto registrado: ' + MONEDA.format(monto) + '.';
            bien = true;
            render();
        }
        mensaje.textContent = texto;
        mensaje.className = 'text-sm ' + (bien ? 'text-(--viz-verde-texto)' : 'text-(--stock-agotado)');
        clearTimeout(mensaje._t);
        mensaje._t = setTimeout(function () { mensaje.classList.add('hidden'); }, 3500);
    });

    document.addEventListener('finanzas:cambio', render);
    window.addEventListener('hashchange', function () {
        if (location.hash === '#balances') render();
    });

    campoFecha.value = iso(new Date());
    render();
})();
