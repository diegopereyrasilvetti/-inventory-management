const btnMenu = document.getElementById('btn-menu');
const menuMovil = document.getElementById('menu-movil');
const btnUsuario = document.getElementById('btn-usuario');
const menuUsuario = document.getElementById('menu-usuario');

function alternar(boton, panel, mostrar) {
    panel.classList.toggle('hidden', !mostrar);
    boton.setAttribute('aria-expanded', String(mostrar));
}

btnMenu.addEventListener('click', function () {
    const abrir = menuMovil.classList.contains('hidden');
    alternar(btnMenu, menuMovil, abrir);
    btnMenu.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
    btnMenu.firstElementChild.className = abrir ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
});

btnUsuario.addEventListener('click', function (e) {
    e.stopPropagation();
    alternar(btnUsuario, menuUsuario, menuUsuario.classList.contains('hidden'));
});

document.addEventListener('click', function (e) {
    if (!menuUsuario.contains(e.target)) alternar(btnUsuario, menuUsuario, false);
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') alternar(btnUsuario, menuUsuario, false);
});

/* ---------- Inventario de productos ---------- */

const CLAVE_STORAGE = 'gestion-stock-productos';
const PRODUCTOS_INICIALES = [
    { id: 1, nombre: 'Camiseta básica', codigo: 'CAM-001', stock: 24, minimo: 10 },
    { id: 2, nombre: 'Taza de cerámica', codigo: 'TAZ-002', stock: 8, minimo: 10 },
    { id: 3, nombre: 'Cuaderno A5', codigo: 'CUA-003', stock: 0, minimo: 5 }
];

const ESTADOS = {
    disponible: { texto: 'Disponible', clases: 'bg-(--viz-verde-fondo) text-(--viz-verde-texto)' },
    bajo: { texto: 'Bajo', clases: 'bg-(--viz-naranja-fondo) text-(--viz-naranja-texto)' },
    agotado: { texto: 'Agotado', clases: 'bg-(--viz-gris-fondo) text-(--viz-gris-texto)' }
};

const tablaBody = document.getElementById('tabla-body');
const tablaVacia = document.getElementById('tabla-vacia');
const totalProductos = document.getElementById('total-productos');
const contadorAlertas = document.getElementById('contador-alertas');
const enlaceAlertas = document.getElementById('enlace-alertas');
const dialogo = document.getElementById('dialogo-agregar');
const formAgregar = document.getElementById('form-agregar');
const errorAgregar = document.getElementById('error-agregar');
const btnCsv = document.getElementById('btn-csv');
const btnCsvTexto = document.getElementById('btn-csv-texto');

const CLASE_BOTON_STOCK = 'flex size-10 lg:size-8 items-center justify-center rounded-full border border-(--borde) text-(--texto) cursor-pointer transition hover:bg-(--fondo) hover:text-(--acento-hover) focus-visible:outline-2 focus-visible:outline-(--acento-hover)';

function cargarProductos() {
    try {
        const guardado = localStorage.getItem(CLAVE_STORAGE);
        if (guardado) return JSON.parse(guardado);
    } catch (e) { /* sin almacenamiento disponible */ }
    return PRODUCTOS_INICIALES.map(function (p) { return Object.assign({}, p); });
}

let productos = cargarProductos();

function guardarProductos() {
    try {
        localStorage.setItem(CLAVE_STORAGE, JSON.stringify(productos));
    } catch (e) { /* sin almacenamiento disponible */ }
}

function estadoDe(p) {
    if (p.stock === 0) return 'agotado';
    if (p.stock <= p.minimo) return 'bajo';
    return 'disponible';
}

function crear(etiqueta, clases, texto) {
    const el = document.createElement(etiqueta);
    if (clases) el.className = clases;
    if (texto !== undefined) el.textContent = texto;
    return el;
}

function botonStock(id, accion, icono, etiqueta) {
    const b = crear('button', CLASE_BOTON_STOCK);
    b.type = 'button';
    b.dataset.id = id;
    b.dataset.accion = accion;
    b.setAttribute('aria-label', etiqueta);
    b.appendChild(crear('i', 'fa-solid ' + icono + ' text-xs'));
    return b;
}

function crearFila(p) {
    const tr = crear('tr', 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b border-(--borde) py-4 last:border-0 hover:bg-(--fondo)/60 sm:table-row sm:py-0');

    tr.appendChild(crear('td', 'col-start-1 row-start-1 min-w-0 font-semibold text-(--texto) [overflow-wrap:anywhere] sm:py-3.5 sm:pr-4 sm:font-medium', p.nombre));
    tr.appendChild(crear('td', 'col-start-1 row-start-2 min-w-0 font-mono text-sm text-(--texto-suave) [overflow-wrap:anywhere] sm:py-3.5 sm:pr-4', p.codigo));

    const tdStock = crear('td', 'col-span-2 row-start-3 sm:py-3.5 sm:pr-4');
    const fila = crear('div', 'flex items-center justify-between gap-3 sm:justify-start');
    fila.appendChild(crear('span', 'text-xs font-semibold uppercase tracking-wider text-(--texto-suave) sm:hidden', 'Stock'));
    const grupo = crear('div', 'flex items-center gap-1.5');
    const input = crear('input', 'w-20 rounded-lg border border-transparent bg-transparent py-1 text-center text-lg font-semibold text-(--texto) hover:border-(--borde) focus:border-(--acento) focus:bg-(--superficie) focus:outline-none focus:ring-2 focus:ring-(--acento)/30 sm:w-16 sm:text-base');
    input.type = 'number';
    input.min = '0';
    input.step = '1';
    input.inputMode = 'numeric';
    input.value = p.stock;
    input.dataset.id = p.id;
    input.setAttribute('aria-label', 'Stock de ' + p.nombre);
    grupo.appendChild(botonStock(p.id, 'menos', 'fa-minus', 'Restar una unidad de ' + p.nombre));
    grupo.appendChild(input);
    grupo.appendChild(botonStock(p.id, 'mas', 'fa-plus', 'Sumar una unidad a ' + p.nombre));
    fila.appendChild(grupo);
    tdStock.appendChild(fila);
    tr.appendChild(tdStock);

    const estado = ESTADOS[estadoDe(p)];
    const tdEstado = crear('td', 'col-start-2 row-start-2 justify-self-end sm:py-3.5 sm:pr-4');
    tdEstado.appendChild(crear('span', 'inline-block rounded-full px-3 py-1 text-xs font-semibold ' + estado.clases, estado.texto));
    tr.appendChild(tdEstado);

    const tdAcciones = crear('td', 'col-start-2 row-start-1 justify-self-end sm:py-3.5 sm:text-right');
    const borrar = crear('button', 'flex size-10 items-center justify-center rounded-full text-(--texto-suave) cursor-pointer transition hover:bg-(--stock-agotado)/10 hover:text-(--stock-agotado) lg:size-8');
    borrar.type = 'button';
    borrar.dataset.id = p.id;
    borrar.dataset.accion = 'borrar';
    borrar.setAttribute('aria-label', 'Eliminar ' + p.nombre);
    borrar.appendChild(crear('i', 'fa-regular fa-trash-can text-sm'));
    tdAcciones.appendChild(borrar);
    tr.appendChild(tdAcciones);

    return tr;
}

function actualizarAlertas() {
    const n = productos.filter(function (p) { return estadoDe(p) !== 'disponible'; }).length;
    contadorAlertas.textContent = n;
    contadorAlertas.classList.toggle('hidden', n === 0);
    enlaceAlertas.setAttribute('aria-label', 'Alertas de stock bajo (' + n + ')');
}

function actualizarResumen() {
    actualizarAlertasResumen();
}

function unidades(n) {
    return n + (n === 1 ? ' unidad' : ' unidades');
}

function actualizarAlertasResumen() {
    const lista = document.getElementById('res-alertas');
    const ok = document.getElementById('res-alertas-ok');
    const agotados = productos.filter(function (p) { return estadoDe(p) === 'agotado'; });
    const bajos = productos.filter(function (p) { return estadoDe(p) === 'bajo'; });

    const items = agotados.map(function (p) {
        return { p: p, tipo: 'agotado', texto: ' no hay stock y se necesitan mínimo ' + unidades(p.minimo) + '.' };
    }).concat(bajos.map(function (p) {
        return { p: p, tipo: 'bajo', texto: ' ' + (p.stock === 1 ? 'queda solo 1 unidad' : 'hay pocos (' + unidades(p.stock) + ')') + ' y se necesitan mínimo ' + unidades(p.minimo) + '.' };
    }));

    lista.replaceChildren(...items.map(function (it) {
        const agotado = it.tipo === 'agotado';
        const li = crear('li', 'flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm ' + (agotado ? 'bg-(--viz-gris-fondo) text-(--viz-gris-texto)' : 'bg-(--viz-naranja-fondo) text-(--viz-naranja-texto)'));
        li.appendChild(crear('i', 'mt-0.5 shrink-0 ' + (agotado ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-triangle-exclamation')));
        const texto = crear('p', 'min-w-0 break-words');
        texto.appendChild(crear('strong', 'font-semibold', 'Alerta de ' + it.p.nombre + ':'));
        texto.appendChild(document.createTextNode(it.texto));
        li.appendChild(texto);
        return li;
    }));
    lista.classList.toggle('hidden', items.length === 0);
    ok.classList.toggle('hidden', items.length > 0);
    ok.classList.toggle('flex', items.length === 0);
}

function render() {
    tablaBody.replaceChildren(...productos.map(crearFila));
    tablaVacia.classList.toggle('hidden', productos.length > 0);
    totalProductos.textContent = productos.length + (productos.length === 1 ? ' producto' : ' productos');
    actualizarAlertas();
    actualizarResumen();
    document.dispatchEvent(new CustomEvent('inventario:cambio'));
}

function cambiarStock(id, nuevo, selectorFoco) {
    const p = productos.find(function (x) { return x.id === id; });
    if (!p) return;
    p.stock = Math.max(0, Number.isFinite(nuevo) ? Math.floor(nuevo) : p.stock);
    guardarProductos();
    render();
    if (selectorFoco) {
        const el = tablaBody.querySelector(selectorFoco);
        if (el) el.focus();
    }
}

tablaBody.addEventListener('click', function (e) {
    const boton = e.target.closest('button[data-accion]');
    if (!boton) return;
    const id = Number(boton.dataset.id);
    const accion = boton.dataset.accion;
    const p = productos.find(function (x) { return x.id === id; });
    if (!p) return;
    const foco = 'button[data-accion="' + accion + '"][data-id="' + id + '"]';

    if (accion === 'mas') {
        cambiarStock(id, p.stock + 1, foco);
    } else if (accion === 'menos') {
        cambiarStock(id, p.stock - 1, foco);
    } else if (accion === 'borrar') {
        if (window.confirm('¿Eliminar "' + p.nombre + '" del inventario?')) {
            productos = productos.filter(function (x) { return x.id !== id; });
            guardarProductos();
            render();
        }
    }
});

tablaBody.addEventListener('change', function (e) {
    if (e.target.matches('input[type="number"]')) {
        cambiarStock(Number(e.target.dataset.id), parseInt(e.target.value, 10));
    }
});

/* Agregar producto */
document.getElementById('btn-agregar').addEventListener('click', function () {
    formAgregar.reset();
    errorAgregar.classList.add('hidden');
    dialogo.showModal();
    document.getElementById('nuevo-nombre').focus();
});

document.getElementById('btn-cancelar').addEventListener('click', function () {
    dialogo.close();
});

formAgregar.addEventListener('submit', function (e) {
    e.preventDefault();
    const nombre = document.getElementById('nuevo-nombre').value.trim();
    const codigo = document.getElementById('nuevo-codigo').value.trim().toUpperCase();
    const stock = parseInt(document.getElementById('nuevo-stock').value, 10);
    const minimo = parseInt(document.getElementById('nuevo-minimo').value, 10);

    let error = '';
    if (!nombre || !codigo) {
        error = 'Completá el nombre y el código del producto.';
    } else if (!(stock >= 0) || !(minimo >= 0)) {
        error = 'El stock y el mínimo deben ser números de 0 en adelante.';
    } else if (productos.some(function (p) { return p.codigo === codigo; })) {
        error = 'Ya existe un producto con el código ' + codigo + '.';
    }

    if (error) {
        errorAgregar.textContent = error;
        errorAgregar.classList.remove('hidden');
        return;
    }

    const id = productos.reduce(function (max, p) { return Math.max(max, p.id); }, 0) + 1;
    productos.push({ id: id, nombre: nombre, codigo: codigo, stock: stock, minimo: minimo });
    guardarProductos();
    render();
    dialogo.close();
});

/* Copiar CSV */
function comoCsv() {
    function celda(valor) {
        return '"' + String(valor).replace(/"/g, '""') + '"';
    }
    const filas = productos.map(function (p) {
        return [p.nombre, p.codigo, p.stock, ESTADOS[estadoDe(p)].texto].map(celda).join(',');
    });
    return ['Producto,Código,Stock,Estado'].concat(filas).join('\n');
}

btnCsv.addEventListener('click', function () {
    navigator.clipboard.writeText(comoCsv()).then(function () {
        btnCsvTexto.textContent = '¡Copiado!';
    }, function () {
        btnCsvTexto.textContent = 'No se pudo copiar';
    }).then(function () {
        setTimeout(function () { btnCsvTexto.textContent = 'Copiar CSV'; }, 2000);
    });
});

render();

/* ---------- Una sección a la vez ---------- */

const SECCION_INICIAL = 'resumen';
const secciones = document.querySelectorAll('#contenido > section');

function mostrarSeccion(id) {
    const existe = Array.prototype.some.call(secciones, function (s) { return s.id === id; });
    if (!id || !existe) return false;
    secciones.forEach(function (s) {
        s.classList.toggle('hidden', s.id !== id);
    });
    document.querySelectorAll('nav a[href^="#"]').forEach(function (a) {
        if (a.getAttribute('href') === '#' + id) {
            a.setAttribute('aria-current', 'page');
        } else {
            a.removeAttribute('aria-current');
        }
    });
    window.scrollTo(0, 0);
    return true;
}

window.addEventListener('hashchange', function () {
    mostrarSeccion(location.hash.slice(1));
});

document.querySelectorAll('nav a[href^="#"], #enlace-alertas').forEach(function (enlace) {
    enlace.addEventListener('click', function () {
        alternar(btnMenu, menuMovil, false);
        btnMenu.setAttribute('aria-label', 'Abrir menú');
        btnMenu.firstElementChild.className = 'fa-solid fa-bars';
        if (location.hash === enlace.getAttribute('href')) mostrarSeccion(location.hash.slice(1));
    });
});

if (!mostrarSeccion(location.hash.slice(1))) mostrarSeccion(SECCION_INICIAL);
