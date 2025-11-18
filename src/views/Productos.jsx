import { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import TablaProductos from '../components/productos/TablaProductos';
import CuadroBusquedas from '../components/busquedas/CuadroBusquedas';
import ModalRegistroProducto from '../components/productos/ModalRegistroProducto';
import ModalEdicionProducto from '../components/productos/ModalEdicionProducto';
import ModalEliminacionProducto from '../components/productos/ModalEliminacionProducto';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Zoom, Fade } from "react-awesome-reveal";




const Productos = () => {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [textoBusqueda, setTextoBusqueda] = useState("");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
    const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
    const [productoEditado, setProductoEditado] = useState(null);
    const [productoAEliminar, setProductoAEliminar] = useState(null);
    const [paginaActual, establecerPaginaActual] = useState(1);
    const elementosPorPagina = 5;

    const [nuevoProducto, setNuevoProducto] = useState({
        nombre_producto: '',
        descripcion_producto: '',
        id_categoria: '',
        precio_unitario: '',
        stock: '',
        imagen: ''
    });

    // Calcular productos paginados
    const productosPaginados = productosFiltrados.slice(
        (paginaActual - 1) * elementosPorPagina,
        paginaActual * elementosPorPagina
    );

    const manejarCambioInput = (e) => {
        const { name, value } = e.target;
        setNuevoProducto(prev => ({ ...prev, [name]: value }));
    };

    const obtenerProductos = async () => {
        try {
            const respuesta = await fetch('http://localhost:3000/api/productos');
            if (!respuesta.ok) throw new Error('Error al obtener productos');
            const datos = await respuesta.json();
            setProductos(datos);
            setProductosFiltrados(datos);
            setCargando(false);
        } catch (error) {
            console.error(error.message);
            setCargando(false);
        }
    };

    const obtenerCategorias = async () => {
        try {
            const respuesta = await fetch('http://localhost:3000/api/categorias');
            if (!respuesta.ok) throw new Error('Error al obtener categorías');
            const datos = await respuesta.json();
            setCategorias(datos);
        } catch (error) {
            console.error("Error al cargar categorías:", error);
        }
    };

    const manejarCambioBusqueda = (e) => {
        const texto = e.target.value.toLowerCase();
        setTextoBusqueda(texto);
        const filtrados = productos.filter(p =>
            p.nombre_producto.toLowerCase().includes(texto) ||
            p.descripcion_producto.toLowerCase().includes(texto) ||
            p.id_categoria.includes(texto) ||
            p.stock.includes(texto) ||
            p.precio_unitario.includes(texto)
        );
        setProductosFiltrados(filtrados);
    };

    const agregarProducto = async () => {
        if (!nuevoProducto.nombre_producto.trim() || !nuevoProducto.id_categoria || !nuevoProducto.precio_unitario || !nuevoProducto.stock) return;
        try {
            const respuesta = await fetch('http://localhost:3000/api/registrarProducto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoProducto)
            });
            if (!respuesta.ok) throw new Error('Error al guardar');
            setNuevoProducto({
                nombre_producto: '',
                descripcion_producto: '',
                id_categoria: '',
                precio_unitario: '',
                stock: '',
                imagen: ''
            });
            setMostrarModal(false);
            await obtenerProductos();
        } catch (error) {
            console.error("Error al agregar producto:", error);
            alert("No se pudo guardar el producto.");
        }
    };

    const generarPDFProductos = () => {

        const doc = new jsPDF();

        // Encabezado del PDF
        doc.setFillColor(28, 41, 51);
        doc.rect(0, 0, 220, 30, 'F');

        doc.setTextColor(225, 225, 225);
        doc.setFontSize(28);
        doc.text("Lista de productos", doc.internal.pageSize.getWidth() / 2, 18, { align: "center" });

        const columnas = ["ID", "Nombre", "Descripcion", "Categoria", "Precio", "Stock"];
        const filas = productosFiltrados.map((producto) => [
            producto.id_producto,
            producto.nombre_producto,
            producto.descripcion_producto,
            producto.id_categoria,
            `C$ ${producto.precio_unitario}`,
            producto.stock,
        ])

        const totalPaginas = "{total_pages_count_string}";

        autoTable(doc, {
            head: [columnas],
            body: filas,
            startY: 40,
            theme: "grid",
            styles: { fontSize: 10, cellPadding: 2 },
            margin: { top: 20, left: 14, right: 14 },
            tableWidth: "auto",
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 'auto' },
            },
            pageBreak: "auto",
            rowPageBreak: "auto",

            didDrawPage: function (data) {
                const alturaPagina = doc.internal.pageSize.getHeight();
                const anchoPagina = doc.internal.pageSize.getWidth();

                const numeroPagina = doc.internal.getNumberOfPages();

                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                const piePagina = `Pagina ${numeroPagina} de ${totalPaginas}`;
                doc.text(piePagina, anchoPagina / 2 + 15, alturaPagina - 10, { align: "center" });
            },
        });

        if (typeof doc.putTotalPages === 'function') {
            doc.putTotalPages(totalPaginas);
        }

        const fecha = new Date();
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = fecha.getFullYear();
        const nombreArchivo = `productos_${dia}${mes}${anio}.pdf`;

        doc.save(nombreArchivo);

    }

    const abrirModalEdicion = (producto) => {
        setProductoEditado({ ...producto });
        setMostrarModalEdicion(true);
    };

    const guardarEdicion = async () => {
        if (!productoEditado.nombre_producto.trim() || !productoEditado.id_categoria || !productoEditado.precio_unitario || !productoEditado.stock) return;
        try {
            const respuesta = await fetch(`http://localhost:3000/api/actualizarproducto/${productoEditado.id_producto}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productoEditado)
            });
            if (!respuesta.ok) throw new Error('Error al actualizar');
            setMostrarModalEdicion(false);
            await obtenerProductos();
        } catch (error) {
            console.error("Error al editar producto:", error);
            alert("No se pudo actualizar el producto.");
        }
    };

    const abrirModalEliminacion = (producto) => {
        setProductoAEliminar(producto);
        setMostrarModalEliminar(true);
    };

    const confirmarEliminacion = async () => {
        try {
            const respuesta = await fetch(`http://localhost:3000/api/eliminarproducto/${productoAEliminar.id_producto}`, {
                method: 'DELETE',
            });
            if (!respuesta.ok) throw new Error('Error al eliminar');
            setMostrarModalEliminar(false);
            setProductoAEliminar(null);
            await obtenerProductos();
        } catch (error) {
            console.error("Error al eliminar producto:", error);
            alert("No se pudo eliminar el producto. Puede estar en uso.");
        }
    };


    const generarPDFDetalleProducto = (productos) => {
        // acepta un producto o un arreglo; si recibe arreglo toma el primero
        let producto = productos;
        if (Array.isArray(productos)) {
            if (productos.length === 0) return;
            producto = productos[0];
        }

        const pdf = new jsPDF();
        const anchoPagina = pdf.internal.pageSize.getWidth();

        // Encabezado
        pdf.setFillColor(28, 41, 51);
        pdf.rect(0, 0, 220, 30, 'F');
        pdf.setTextColor(225, 225, 225);
        pdf.setFontSize(22);
        pdf.text(producto.nombre_producto || '', anchoPagina / 2, 18, { align: "center" });

        let posicionY = 50;

        if (producto.imagen) {
            try {
                const propiedadesImagen = pdf.getImageProperties(producto.imagen);
                const anchoImagen = 100;
                const altoImagen = (propiedadesImagen.height * anchoImagen) / propiedadesImagen.width;
                const posicionX = (anchoPagina - anchoImagen) / 2;

                pdf.setTextColor(0, 0, 0);
                pdf.setFontSize(14);

                pdf.text(`Descripcion: ${producto.descripcion_producto}`, anchoPagina / 2, posicionY, { align: "center" });
                pdf.text(`Categoria: ${producto.id_categoria}`, anchoPagina / 2, posicionY + 10, { align: "center" });
                pdf.text(`Precio: C$ ${producto.precio_unitario}`, anchoPagina / 2, posicionY + 20, { align: "center" });
                pdf.text(`Stock: ${producto.stock}`, anchoPagina / 2, posicionY + 30, { align: "center" });

                pdf.save(`${producto.nombre_producto}.pdf`);
            } catch (err) {
                console.error('Error procesando imagen del producto para PDF:', err);
            }
        } else {
            // si no hay imagen, igual guardamos la info básica
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(14);
            pdf.text(`Descripcion: ${producto.descripcion_producto || ''}`, anchoPagina / 2, posicionY, { align: "center" });
            pdf.text(`Categoria: ${producto.id_categoria || ''}`, anchoPagina / 2, posicionY + 10, { align: "center" });
            pdf.text(`Precio: C$ ${producto.precio_unitario || ''}`, anchoPagina / 2, posicionY + 20, { align: "center" });
            pdf.text(`Stock: ${producto.stock || ''}`, anchoPagina / 2, posicionY + 30, { align: "center" });
            pdf.save(`${producto.nombre_producto || 'producto'}.pdf`);
        }
    };

    useEffect(() => {
        obtenerProductos();
        obtenerCategorias();
    }, []);

    const exportarExcelProductos = () => {
        try {
            const data = productosFiltrados.length ? productosFiltrados : productos;
            const ws = XLSX.utils.json_to_sheet(data.map(p => ({
                ID: p.id_producto,
                Nombre: p.nombre_producto,
                Descripcion: p.descripcion_producto,
                Categoria: p.id_categoria,
                Precio: p.precio_unitario,
                Stock: p.stock,
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Productos');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            saveAs(blob, `productos_${new Date().toISOString().slice(0,10)}.xlsx`);
        } catch (err) {
            console.error('Error exportando a Excel:', err);
        }
    };

    return (
    <>
        <Container className="mt-4">
            <h4>Productos</h4>
            <Row>
                <Col lg={5} md={6} sm={8} xs={12}>
                    <CuadroBusquedas
                        textoBusqueda={textoBusqueda}
                        manejarCambioBusqueda={manejarCambioBusqueda}
                    />
                </Col>
                <Col className="text-end">
                    <Button
                        className='color-boton-registro'
                        onClick={() => setMostrarModal(true)}
                    >
                        + Nuevo Producto
                    </Button>
                </Col>

            </Row>

            <Fade cascade triggerOnce delay={100} duration={2000}>
                <TablaProductos
                    productos={productosPaginados}
                    categorias={categorias}
                    cargando={cargando}
                    abrirModalEdicion={abrirModalEdicion}
                    abrirModalEliminacion={abrirModalEliminacion}
                    totalElementos={productos.length}
                    elementosPorPagina={elementosPorPagina}
                    paginaActual={paginaActual}
                    establecerPaginaActual={establecerPaginaActual}
                />
            </Fade>

            <ModalRegistroProducto
                mostrarModal={mostrarModal}
                setMostrarModal={setMostrarModal}
                nuevoProducto={nuevoProducto}
                manejarCambioInput={manejarCambioInput}
                agregarProducto={agregarProducto}
                categorias={categorias}
            />

            <ModalEdicionProducto
                mostrar={mostrarModalEdicion}
                setMostrar={setMostrarModalEdicion}
                productoEditado={productoEditado}
                setProductoEditado={setProductoEditado}
                guardarEdicion={guardarEdicion}
                categorias={categorias}
            />

            <ModalEliminacionProducto
                mostrar={mostrarModalEliminar}
                setMostrar={setMostrarModalEliminar}
                producto={productoAEliminar}
                confirmarEliminacion={confirmarEliminacion}
            />
        </Container>
        <Col lg={3} md={4} sm={4} xs={5}>
            <Button
                className="mb-3"
                onClick={generarPDFProductos}
                variant="secondary"
                style={{ width: "100%" }}
            >
                Generar reporte PDF
            </Button>
        </Col>

        <Button
            variant="outline-secondary"
            size="sm"
            className="me-2"
            onClick={() => generarPDFDetalleProducto(productos)}
        >
            <i className="bi bi-filetype-pdf"></i>
        </Button>
        <Col lg={3} md={4} sm={4} xs={5}>
            <Button
                className="mb-3"
                onClick={exportarExcelProductos}
                variant="secondary"
                style={{ width: "100%" }}
            >
                Generar Excel
            </Button>
        </Col>
    </>
   );
};


export default Productos;
