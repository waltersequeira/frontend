import React, { useState } from "react";
import { Table, Spinner, Button, Image } from "react-bootstrap";
import BotonOrden from "../ordenamiento/BotonOrden";
import Paginacion from "../ordenamiento/Paginacion";
import { saveAs } from "file-saver";

const TablaProductos = ({
  productos,
  categorias,
  cargando,
  abrirModalEdicion,
  abrirModalEliminacion,
  totalElementos,
  elementosPorPagina,
  paginaActual,
  establecerPaginaActual
}) => {
  const [orden, setOrden] = useState({ campo: "id_producto", direccion: "asc" });

  const manejarOrden = (campo) => {
    setOrden(prev => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === "asc" ? "desc" : "asc"
    }));
  };

  const productosOrdenados = [...productos].sort((a, b) => {
    const valorA = a[orden.campo] ?? "";
    const valorB = b[orden.campo] ?? "";
    if (typeof valorA === "number" && typeof valorB === "number") {
      return orden.direccion === "asc" ? valorA - valorB : valorB - valorA;
    }
    return String(valorA).localeCompare(String(valorB)) * (orden.direccion === "asc" ? 1 : -1);
  });

  const obtenerNombreCategoria = (id) => {
    const cat = categorias.find(c => c.id_categoria === id);
    return cat ? cat.nombre_categoria : "Sin categoría";
  };

  if (cargando) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  const exportarExcelProductos = () => {
    const datos = productosFiltrados.map(((productos) => ({
      ID: productos.id_producto,
      Nombre: productos.nombre_producto,
      Descripcion: productos.descripcion_producto,
      Id_Categoria: productos.id_categoria,
      Precio: parseFloat(productos.precio_unitario),
      Stock: productos.stock
    })));

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Productos');

    const excelBuffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });

    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();

    const nombreArchivo = `Productos_${dia}${mes}${anio}.xlsx`;

    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, nombreArchivo);
  }

  return (
    <>
      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <BotonOrden campo="id_producto" orden={orden} manejarOrden={manejarOrden}>ID</BotonOrden>
            <BotonOrden campo="nombre_producto" orden={orden} manejarOrden={manejarOrden}>Nombre</BotonOrden>
            <BotonOrden campo="descripcion_producto" orden={orden} manejarOrden={manejarOrden}>Descripción</BotonOrden>
            <BotonOrden campo="id_categoria" orden={orden} manejarOrden={manejarOrden}>Categoría</BotonOrden>
            <BotonOrden campo="precio_unitario" orden={orden} manejarOrden={manejarOrden}>Precio</BotonOrden>
            <BotonOrden campo="stock" orden={orden} manejarOrden={manejarOrden}>Stock</BotonOrden>
            <th>Imagen</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosOrdenados.map(producto => (
            <tr key={producto.id_producto}>
              <td>{producto.id_producto}</td>
              <td>{producto.nombre_producto}</td>
              <td>{producto.descripcion_producto || '-'}</td>
              <td>{obtenerNombreCategoria(producto.id_categoria)}</td>
              <td>C${parseFloat(producto.precio_unitario).toFixed(2)}</td>
              <td>{producto.stock}</td>
              <td>
                {producto.imagen ? (
                  <img
                    src={`data:image/png;base64,${producto.imagen}`}
                    alt={producto.nombre_producto}
                    style={{ maxWidth: '100px' }}
                  />
                ) : (
                  'Sin imagen'
                )}
              </td>
              <td>
                <Button
                  variant="outline-warning"
                  size="sm"
                  className="me-2"
                  onClick={() => abrirModalEdicion(producto)}
                >
                  <i className="bi bi-pencil"></i>
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => abrirModalEliminacion(producto)}
                >
                  <i className="bi bi-trash"></i>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Button
            variant="outline-secondary"
            size="sm"
            className="me-2"
            onClick={() => generarPDFDetalleProducto(productos)}
            >
                <i className="bi bi-filetype-pdf"></i>
            </Button>

      <Paginacion
        elementosPorPagina={elementosPorPagina}
        totalElementos={totalElementos}
        paginaActual={paginaActual}
        establecerPaginaActual={establecerPaginaActual}
      />
    </>
  );
};

export default TablaProductos;
