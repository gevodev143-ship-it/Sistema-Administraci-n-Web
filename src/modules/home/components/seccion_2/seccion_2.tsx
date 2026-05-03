import { useEffect, useState } from "react";
import styles from "./seccion_2.module.css";
import Modal from "../../../../shared/components/Modal/Modal";
import CrudModal from "../../../../shared/components/Modal/CrudModal";

import {
  Producto, buscarProductosPorNombre, getImagenProducto, eliminarProductoPorId, 
  listarProductoPaginacion

} from "../../../../core/services/producto.service";

import {
  Categoria,buscarCategoriasPorNombre,
  listarCategoriasPaginacion,eliminarCategoriaPorId,
  getImagenCategoria
} from "../../../../core/services/categoria.service";

import {
  Marca,buscarMarcasPorNombre,
  listarMarcasPaginacion,eliminarMarcaPorId,
  getImagenMarca
} from "../../../../core/services/marca.service";



const Seccion_2 = () => {

  // ✅ Fix 1: vista se declara PRIMERO
  const [vista, setVista] = useState<"producto" | "categoria" | "marca">("producto");
  const [busqueda, setBusqueda] = useState("");
  const [sinImagenes, setSinImagenes] = useState(false); // nuevo estado

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [pagina, setPagina] = useState(1);
  const LIMITE = 500;

  const [idEditando, setIdEditando] = useState<{
    id: number;
    type: "producto" | "categoria" | "marca";
  } | null>(null);

  // ✅ Helper para saber si un registro tiene TODAS sus imágenes según la vista
  const tieneImagen = (item: any): boolean => {
    if (vista === "producto") {
      return !!(item.prdcimgnombrebucket &&
                item.categoria?.ctgraimgnombrebucket &&
                item.marca?.marcaimgnombrebucket);
    }
    if (vista === "categoria") return !!item.ctgraimgnombrebucket;
    return !!item.marcaimgnombrebucket;
  };
const [buscando, setBuscando] = useState(false); // 🔥 NUEVO
  // ✅ Fix 3: filtrado + orden "sin imagen primero"
const datosFiltrados = (() => {
  let lista: any[] =
    vista === "producto"
      ? productos
      : vista === "categoria"
      ? categorias
      : marcas;

  if (sinImagenes) {
    lista = [...lista].sort((a, b) => {
      const sinA = !tieneImagen(a);
      const sinB = !tieneImagen(b);
      return Number(sinB) - Number(sinA);
    });
  }

  return lista;
})();

  // ✅ Fix 2a: filtra su propio array (categorias)
const handleEliminarCategoria = async (id: number) => {
  const confirmacion = window.confirm(
    "⚠️ ¿Seguro que deseas eliminar esta Categoría?\n\nEsta acción es IRREVERSIBLE."
  );
  if (!confirmacion) return;

  const res = await eliminarCategoriaPorId(id);

  if (res.ok) {
    setCategorias(prev => prev.filter(c => c.ctgraid !== id));
  } else {
    alert(res.mensaje); // 🔥 muestra el motivo real
  }
};
  // ✅ Fix 2b: filtra su propio array (marcas)
const handleEliminarMarca = async (id: number) => {
  const confirmacion = window.confirm(
    "⚠️ ¿Seguro que deseas eliminar esta Marca?\n\nEsta acción es IRREVERSIBLE."
  );
  if (!confirmacion) return;

  const res = await eliminarMarcaPorId(id);

  if (res.ok) {
    setMarcas(prev => prev.filter(m => m.marcaid !== id));
  } else {
    alert(res.mensaje); // 🔥 aquí sale el motivo real
  }
};

  const handleEliminarProducto = async (id: number) => {
    const confirmacion = window.confirm(
      "⚠️ ¿Seguro que deseas eliminar este producto?\n\nEsta acción es IRREVERSIBLE."
    );
    if (!confirmacion) return;
    const ok = await eliminarProductoPorId(id);
    if (ok) {
      setProductos(prev => prev.filter(p => p.prdcid !== id));
    }
  };

  useEffect(() => {
    if (busqueda.trim() !== "") return;

    const loadData = async () => {
      if (vista === "producto") {
        const data = await listarProductoPaginacion(pagina, LIMITE);
        setProductos(data);
      }
      if (vista === "categoria") {
        const data = await listarCategoriasPaginacion(pagina, LIMITE);
        setCategorias(data);
      }
      if (vista === "marca") {
        const data = await listarMarcasPaginacion(pagina, LIMITE);
        setMarcas(data);
      }
    };

    loadData();
  }, [vista, pagina, busqueda]);

  useEffect(() => {
  const query = busqueda.trim();

  if (query === "") {
    setPagina(1);
    return;
  }

  const timer = setTimeout(async () => {
    setBuscando(true);

    if (vista === "producto") {
      const data = await buscarProductosPorNombre(query);
      setProductos(data);
    }
    if (vista === "categoria") {
      const data = await buscarCategoriasPorNombre(query);
      setCategorias(data);
    }
    if (vista === "marca") {
      const data = await buscarMarcasPorNombre(query);
      setMarcas(data);
    }

    setBuscando(false);
  }, 400);

  return () => clearTimeout(timer);
}, [busqueda, vista]);

return (
  <div className={styles.seccion}>
    {/* TOOLBAR */}
    <div className={styles.toolbar}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${vista === "producto" ? styles.active : ""}`}
          onClick={() => {
            setVista("producto");
            setPagina(1);
          }}
        >
          Producto
        </button>

        <button
          className={`${styles.tab} ${vista === "categoria" ? styles.active : ""}`}
          onClick={() => {
            setVista("categoria");
            setPagina(1);
          }}
        >
          Categoría
        </button>

        <button
          className={`${styles.tab} ${vista === "marca" ? styles.active : ""}`}
          onClick={() => {
            setVista("marca");
            setPagina(1);
          }}
        >
          Marca
        </button>
      </div>

      <div className={styles.controls}>
          <input
            type="text"
            className={styles.search}
            placeholder={buscando ? "⏳ Buscando..." : "🔍 Buscar..."}
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
            }}
          />
          {/* ✅ checkbox conectado al estado */}
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={sinImagenes}
              onChange={(e) => setSinImagenes(e.target.checked)}
            />
            <span>Sin imágenes</span>
          </label>
        </div>
      </div>

    {/* MODAL */}
    {idEditando !== null && (
      <Modal onClose={() => setIdEditando(null)}>
        <CrudModal
          id={idEditando.id}
          type={idEditando.type}
          onClose={() => setIdEditando(null)}
        />
      </Modal>
    )}

    {/* PAGINACIÓN */}
    {busqueda === "" && (
      <div className={styles.pagination}>
        <button onClick={() => setPagina(pagina - 1)} disabled={pagina === 1}>
          Anterior
        </button>
        <span className={styles.pageInfo}>Página {pagina}</span>
        <button
          onClick={() => setPagina(pagina + 1)}
          disabled={datosFiltrados.length < LIMITE}
        >
          Siguiente
        </button>
      </div>
    )}
    {/* TABLA DINÁMICA */}
    <div className={styles.tablaWrapper}>
      <table>
        <thead>
          <tr>
            <th>N°</th>
            {vista === "producto" && (
              <>
                <th>Producto</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Categoría</th>
                <th>Marca</th>
                <th>Acciones</th>
              </>
            )}

            {vista === "categoria" && (
              <>
                <th>Categoría</th>
                <th>Imagen</th>
                <th>Acciones</th>
              </>
            )}

            {vista === "marca" && (
              <>
                <th>Marca</th>
                <th>Imagen</th>
                <th>Acciones</th>
              </>
            )}
          </tr>
        </thead>

        <tbody>
{/*///////////////////////////////////////////////////////////////////////////////////////////////*/}
{/*/////////////////////////////////   PRODUCTO   ////////////////////////////////////////////////*/}
{/*///////////////////////////////////////////////////////////////////////////////////////////////*/}
        {vista === "producto" &&
            (datosFiltrados as Producto[]).map((p, index) => (
              <tr key={p.prdcid}>
                <td>{(pagina - 1) * LIMITE + index + 1}</td>

                <td>
                  <img
                    className={styles.imgTabla}
                    src={getImagenProducto(p.prdcimgnombrebucket)}
                  />
                </td>

                <td>{p.prdcimgnombre}</td>

                <td>S/ {p.prdcprecio?.toFixed(2)}</td>

                <td>
                  {p.categoria?.ctgraimgnombrebucket ? (
                    <img
                      className={styles.imgTabla}
                      src={getImagenCategoria(p.categoria.ctgraimgnombrebucket)}
                    />
                  ) : (
                    <span className={styles.sinImagen}>Sin imagen</span>
                  )}
                </td>

                <td>
                  {p.marca?.marcaimgnombrebucket ? (
                    <img
                      className={styles.imgTabla}
                      src={getImagenMarca(p.marca.marcaimgnombrebucket)}
                    />
                  ) : (
                    <span className={styles.sinImagen}>Sin imagen</span>
                  )}
                </td>

                <td>
                  <div className={styles.acciones}>
                    <button
                      className={styles.btnEditar}
                      onClick={() => setIdEditando({ id: p.prdcid, type: "producto" })}>
                      Editar
                    </button>
                    <button
                      className={styles.btnEliminar}
                      onClick={() => handleEliminarProducto(p.prdcid)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}

{/*///////////////////////////////////////////////////////////////////////////////////////////////*/}
{/*////////////////////////////////   CATEGORIA   ////////////////////////////////////////////////*/}
{/*///////////////////////////////////////////////////////////////////////////////////////////////*/}
          {vista === "categoria" &&
            (datosFiltrados as Categoria[]).map((c, index) => (
              <tr key={c.ctgraid}>
                <td>{(pagina - 1) * LIMITE + index + 1}</td>

                <td>{c.ctgraimgnombre}</td>

                <td>
                  {c.ctgraimgnombrebucket ? (
                    <img
                      className={styles.imgTabla}
                      src={getImagenCategoria(c.ctgraimgnombrebucket)}
                    />
                  ) : (
                    <span className={styles.sinImagen}>Sin imagen</span>
                  )}
                </td>
                <td>
                  <div className={styles.acciones}>
                    <button 
                      className={styles.btnEditar}
                      onClick={() => setIdEditando({ id: c.ctgraid, type: "categoria" })}>
                      Editar
                    </button>
                    
                    <button
                      className={styles.btnEliminar}
                      onClick={() => handleEliminarCategoria(c.ctgraid)}>
                      Eliminar
                    </button>
                  </div>

                </td>
              </tr>
            ))}

{/*///////////////////////////////////////////////////////////////////////////////////////////////*/}
{/*////////////////////////////////////   MARCA   ////////////////////////////////////////////////*/}
{/*///////////////////////////////////////////////////////////////////////////////////////////////*/}
          {vista === "marca" &&
            (datosFiltrados as Marca[]).map((m, index) => (
              <tr key={m.marcaid}>
                <td>{(pagina - 1) * LIMITE + index + 1}</td>

                <td>{m.marcaimgnombre}</td>

                <td>
                  {m.marcaimgnombrebucket ? (
                    <img
                      className={styles.imgTabla}
                      src={getImagenMarca(m.marcaimgnombrebucket)}
                    />
                  ) : (
                    <span className={styles.sinImagen}>Sin imagen</span>
                  )}
                </td>
                <td>
                  <div className={styles.acciones}>
                    <button
                      className={styles.btnEditar}
                      onClick={() => setIdEditando({ id: m.marcaid, type: "marca" })}>
                      Editar
                    </button>
                    
                    <button
                      className={styles.btnEliminar}
                      onClick={() => handleEliminarMarca(m.marcaid)}>
                      Eliminar
                    </button>
                  </div>

                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
);
};
export default Seccion_2;