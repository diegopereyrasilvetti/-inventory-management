(function () {
    const CLAVE_VENTAS = 'gestion-stock-ventas';
    const CLAVE_GASTOS = 'gestion-stock-gastos';
    const MONEDA = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const campoFecha = document.getElementById('vta-fecha');
    const selectProducto = document.getElementById('vta-producto');
    const inputCantidad = document.getElementById('vta-cantidad-input');
    const btnAgregar = document.getElementById('vta-agregar');
    const listaCarrito = document.getElementById('vta-carrito');
    const carritoVacio = document.getElementById('vta-carrito-vacio');
    const totalVenta = document.getElementById('vta-total');
    const btnRegistrar = document.getElementById('vta-registrar');
    const formVenta = document.getElementById('vta-form');
    const mensajeVenta = document.getElementById('vta-mensaje');
    const formGasto = document.getElementById('gasto-form');
    const mensajeGasto = document.getElementById('gasto-mensaje');
    const listaVentas = document.getElementById('vta-lista');
    const listaVentasVacia = document.getElementById('vta-lista-vacia');
    const listaGastos = document.getElementById('gasto-lista');
    const listaGastosVacia = document.getElementById('gasto-lista-vacia');
    if (!formVenta || !formGasto) return;

    function leer(clave) {
        try {
            const guardado = localStorage.getItem(clave);
            if (guardado) return JSON.parse(guardado);
        } catch (e) { /* sin almacenamiento disponible */ }
        return [];
    }

    function guardar(clave, datos) {
        try {
            localStorage.setItem(clave, JSON.stringify(datos));
        } catch (e) { /* sin almacenamiento disponible */ }
    }

    let ventas = leer(CLAVE_VENTAS);
    let gastos = leer(CLAVE_GASTOS);
    let carrito = [];

    function hoy() {
        return new Date().toLocaleDateString('en-CA');
    }

    function horaActual() {
        return new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    function el(etiqueta, clases, texto) {
        const nodo = document.createElement(etiqueta);
        if (clases) nodo.className = clases;
        if (texto !== undefined) nodo.textContent = texto;
        return nodo;
    }

    function siguienteId(lista) {
        return lista.reduce(function (max, x) { return Math.max(max, x.id); }, 0) + 1;
    }

    function avisar(nodo, texto, ok) {
        nodo.textContent = texto;
        nodo.className = 'text-sm ' + (ok ? 'text-[#3f6b34]' : 'text-(--stock-agotado)');
        clearTimeout(nodo._t);
        nodo._t = setTimeout(function () { nodo.classList.add('hidden'); }, 3500);
    }

    function botonQuitar(etiqueta, accion, id) {
        const b = el('button', 'flex size-9 shrink-0 items-center justify-center rounded-full text-(--texto-suave) cursor-pointer transition hover:bg-(--stock-agotado)/10 hover:text-(--stock-agotado)');
        b.type = 'button';
        b.dataset.accion = accion;
        b.dataset.id = id;
        b.setAttribute('aria-label', etiqueta);
        b.appendChild(el('i', 'fa-regular fa-trash-can text-sm'));
        return b;
    }

    /* ---------- Productos disponibles (vienen del catálogo) ---------- */
    function productosConPrecio() {
        const catalogo = typeof window.obtenerCatalogo === 'function' ? window.obtenerCatalogo() : [];
        return catalogo.filter(function (p) { return typeof p.precio === 'number' && p.precio > 0; });
    }

    function refrescarProductos() {
        const lista = productosConPrecio();
        const anterior = selectProducto.value;
        selectProducto.replaceChildren();
        if (lista.length === 0) {
            const o = el('option', '', 'Cargá productos con precio en la sección Productos');
            o.value = '';
            selectProducto.appendChild(o);
            selectProducto.disabled = true;
            btnAgregar.disabled = true;
            return;
        }
        selectProducto.disabled = false;
        btnAgregar.disabled = false;
        lista.forEach(function (p) {
            const o = el('option', '', p.nombre + ' — ' + MONEDA.format(p.precio));
            o.value = p.sku;
            selectProducto.appendChild(o);
        });
        if (lista.some(function (p) { return p.sku === anterior; })) selectProducto.value = anterior;
    }

    /* ---------- Venta en curso ---------- */
    function totalCarrito() {
        return carrito.reduce(function (suma, it) { return suma + it.precio * it.cantidad; }, 0);
    }

    function renderCarrito() {
        listaCarrito.replaceChildren(...carrito.map(function (it) {
            const li = el('li', 'flex items-center gap-3 px-3 py-2.5');
            const info = el('div', 'min-w-0 flex-1');
            info.appendChild(el('p', 'truncate text-sm font-medium text-(--texto)', it.cantidad + ' × ' + it.nombre));
            info.appendChild(el('p', 'text-xs text-(--texto-suave)', MONEDA.format(it.precio) + ' c/u'));
            li.appendChild(info);
            li.appendChild(el('span', 'text-sm font-semibold text-(--texto)', MONEDA.format(it.precio * it.cantidad)));
            li.appendChild(botonQuitar('Quitar ' + it.nombre + ' de la venta', 'quitar-item', it.sku));
            return li;
        }));
        listaCarrito.classList.toggle('hidden', carrito.length === 0);
        carritoVacio.classList.toggle('hidden', carrito.length > 0);
        totalVenta.textContent = MONEDA.format(totalCarrito());
        btnRegistrar.disabled = carrito.length === 0;
    }

    btnAgregar.addEventListener('click', function () {
        const sku = selectProducto.value;
        const producto = productosConPrecio().find(function (p) { return p.sku === sku; });
        const cantidad = parseInt(inputCantidad.value, 10);
        if (!producto) return;
        if (!(cantidad >= 1)) {
            mensajeVenta.classList.remove('hidden');
            avisar(mensajeVenta, 'La cantidad debe ser 1 o más.', false);
            return;
        }
        const existente = carrito.find(function (it) { return it.sku === sku; });
        if (existente) {
            existente.cantidad += cantidad;
        } else {
            carrito.push({ sku: producto.sku, nombre: producto.nombre, precio: producto.precio, cantidad: cantidad });
        }
        inputCantidad.value = 1;
        renderCarrito();
    });

    listaCarrito.addEventListener('click', function (e) {
        const b = e.target.closest('button[data-accion="quitar-item"]');
        if (!b) return;
        carrito = carrito.filter(function (it) { return it.sku !== b.dataset.id; });
        renderCarrito();
    });

    formVenta.addEventListener('submit', function (e) {
        e.preventDefault();
        if (carrito.length === 0) return;
        const metodo = formVenta.querySelector('input[name="vta-metodo"]:checked').value;
        const venta = {
            id: siguienteId(ventas),
            fecha: campoFecha.value || hoy(),
            hora: horaActual(),
            items: carrito.map(function (it) { return Object.assign({}, it); }),
            metodo: metodo,
            total: totalCarrito()
        };
        ventas.push(venta);
        guardar(CLAVE_VENTAS, ventas);
        carrito = [];
        renderCarrito();
        renderDia();
        mensajeVenta.classList.remove('hidden');
        avisar(mensajeVenta, 'Venta registrada: ' + MONEDA.format(venta.total) + ' (' + metodo + ').', true);
    });

    /* ---------- Gastos ---------- */
    formGasto.addEventListener('submit', function (e) {
        e.preventDefault();
        const monto = parseFloat(document.getElementById('gasto-monto').value);
        if (!(monto > 0)) {
            mensajeGasto.classList.remove('hidden');
            avisar(mensajeGasto, 'Ingresá un monto mayor a 0.', false);
            return;
        }
        gastos.push({
            id: siguienteId(gastos),
            fecha: campoFecha.value || hoy(),
            categoria: document.getElementById('gasto-categoria').value,
            detalle: document.getElementById('gasto-detalle').value.trim(),
            monto: monto
        });
        guardar(CLAVE_GASTOS, gastos);
        formGasto.reset();
        renderDia();
        mensajeGasto.classList.remove('hidden');
        avisar(mensajeGasto, 'Gasto registrado: ' + MONEDA.format(monto) + '.', true);
    });

    /* ---------- Detalle del día ---------- */
    function renderDia() {
        const dia = campoFecha.value || hoy();
        const deDia = ventas.filter(function (v) { return v.fecha === dia; });
        const gastosDia = gastos.filter(function (g) { return g.fecha === dia; });
        const ingresos = deDia.reduce(function (s, v) { return s + v.total; }, 0);
        const totalGastos = gastosDia.reduce(function (s, g) { return s + g.monto; }, 0);
        const balance = ingresos - totalGastos;

        document.getElementById('vta-ingresos').textContent = MONEDA.format(ingresos);
        document.getElementById('vta-cantidad').textContent = deDia.length;
        document.getElementById('vta-ticket').textContent = MONEDA.format(deDia.length ? ingresos / deDia.length : 0);
        document.getElementById('vta-gastos').textContent = MONEDA.format(totalGastos);
        const nodoBalance = document.getElementById('vta-balance');
        nodoBalance.textContent = MONEDA.format(balance);
        nodoBalance.className = 'mt-1.5 text-xl font-bold sm:text-2xl ' + (balance > 0 ? 'text-[#3f6b34]' : (balance < 0 ? 'text-[#9a3a28]' : 'text-(--texto)'));

        listaVentas.replaceChildren(...deDia.slice().reverse().map(function (v) {
            const li = el('li', 'flex items-start gap-3 py-3');
            const info = el('div', 'min-w-0 flex-1');
            const resumen = v.items.map(function (it) { return it.cantidad + ' × ' + it.nombre; }).join(', ');
            info.appendChild(el('p', 'text-sm font-medium text-(--texto)', resumen));
            const meta = el('p', 'mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-(--texto-suave)');
            meta.appendChild(el('span', '', v.hora + ' h'));
            meta.appendChild(el('span', 'rounded-full bg-(--fondo) px-2 py-0.5 font-medium ring-1 ring-(--borde)', v.metodo));
            info.appendChild(meta);
            li.appendChild(info);
            li.appendChild(el('span', 'text-sm font-semibold text-(--texto)', MONEDA.format(v.total)));
            li.appendChild(botonQuitar('Eliminar venta de las ' + v.hora, 'borrar-venta', v.id));
            return li;
        }));
        listaVentasVacia.classList.toggle('hidden', deDia.length > 0);

        listaGastos.replaceChildren(...gastosDia.slice().reverse().map(function (g) {
            const li = el('li', 'flex items-start gap-3 py-3');
            const info = el('div', 'min-w-0 flex-1');
            info.appendChild(el('p', 'text-sm font-medium text-(--texto)', g.categoria));
            if (g.detalle) info.appendChild(el('p', 'mt-0.5 text-xs text-(--texto-suave)', g.detalle));
            li.appendChild(info);
            li.appendChild(el('span', 'text-sm font-semibold text-[#9a3a28]', '− ' + MONEDA.format(g.monto)));
            li.appendChild(botonQuitar('Eliminar gasto ' + g.categoria, 'borrar-gasto', g.id));
            return li;
        }));
        listaGastosVacia.classList.toggle('hidden', gastosDia.length > 0);
    }

    listaVentas.addEventListener('click', function (e) {
        const b = e.target.closest('button[data-accion="borrar-venta"]');
        if (!b || !window.confirm('¿Eliminar esta venta?')) return;
        ventas = ventas.filter(function (v) { return v.id !== Number(b.dataset.id); });
        guardar(CLAVE_VENTAS, ventas);
        renderDia();
    });

    listaGastos.addEventListener('click', function (e) {
        const b = e.target.closest('button[data-accion="borrar-gasto"]');
        if (!b || !window.confirm('¿Eliminar este gasto?')) return;
        gastos = gastos.filter(function (g) { return g.id !== Number(b.dataset.id); });
        guardar(CLAVE_GASTOS, gastos);
        renderDia();
    });

    campoFecha.addEventListener('change', function () {
        if (!campoFecha.value) campoFecha.value = hoy();
        renderDia();
    });

    window.addEventListener('hashchange', function () {
        if (location.hash === '#ventas') refrescarProductos();
    });

    campoFecha.value = hoy();
    refrescarProductos();
    renderCarrito();
    renderDia();
})();
