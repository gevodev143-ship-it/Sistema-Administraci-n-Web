import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "./AdminPanel.module.css";
import img1 from "../../../../assets/img/baseDatos.png";
import { ENDPOINTS } from "../../../../core/services/apiConfig";

// ─── Main Component ────────────────────────────────────────────
export default function AdminPanel() {
  const [mostrarModal,        setMostrarModal]        = useState(false);
  const [mostrarImport,       setMostrarImport]       = useState(false);
  const [mostrarImportExcel,  setMostrarImportExcel]  = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className={styles.adminPanel}>
      <div className={styles.botones_y_BD}>

        {/* Navegación */}
        <div className={styles.botonesNav}>
          <button
            onClick={() => navigate("/home")}
            className={location.pathname === "/home" ? styles.activo : ""}
          >
            Gestor de Tablas
          </button>
        </div>

        {/* Base de Datos */}
        <div className={styles.botonBaseDatos}>
          <button onClick={() => setMostrarModal(true)}>
            <img src={img1} alt="base de datos" />
            Base de Datos
          </button>

          {mostrarModal && (
            <div className={styles.modalFondo} onClick={() => setMostrarModal(false)}>
              <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

                {mostrarImportExcel ? (
                  <ImportExcelSection setMostrarImportExcel={setMostrarImportExcel} />
                ) : mostrarImport ? (
                  <ImportSection setMostrarImport={setMostrarImport} />
                ) : (
                  <>
                    <button onClick={() => setMostrarImportExcel(true)}>Importar Excel</button>
                    <button onClick={() => setMostrarImport(true)}>Importar BD</button>
                    <button onClick={() => window.open(ENDPOINTS.backup, "_blank")}>Exportar BD</button>
                  </>
                )}

              </div>
            </div>
          )}
        </div>

        {/* Editar Página */}
        <button onClick={() => navigate("/ferreteria")}>
          Editar Página
        </button>

      </div>
    </div>
  );
}

// ─── Import Excel Section ──────────────────────────────────────
function ImportExcelSection({
  setMostrarImportExcel,
}: {
  setMostrarImportExcel: (v: boolean) => void;
}) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const enviarExcel = async () => {
    if (!archivo) return alert("Selecciona un archivo Excel primero");

    if (!archivo.name.endsWith(".xlsx") && !archivo.name.endsWith(".xls"))
      return alert("El archivo debe ser un Excel (.xlsx o .xls)");

    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
      setLoading(true);
      const res = await fetch(ENDPOINTS.importarExcel, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error en el servidor");
      alert("Excel importado correctamente");
      setMostrarImportExcel(false);
    } catch (error) {
      console.error(error);
      alert("Error al importar el Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files && setArchivo(e.target.files[0])} />
      <button onClick={enviarExcel} disabled={loading}>
        {loading ? "Subiendo..." : "Subir Excel"}
      </button>
      <button onClick={() => setMostrarImportExcel(false)}>Volver</button>
    </div>
  );
}

// ─── Import BD Section ─────────────────────────────────────────
function ImportSection({
  setMostrarImport,
}: {
  setMostrarImport: (v: boolean) => void;
}) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const enviarArchivo = async () => {
    if (!archivo) return alert("Selecciona un archivo primero");

    if (!archivo.name.startsWith("BaseDeDatosGorrioncito"))
      return alert("El archivo debe empezar con 'BaseDeDatosGorrioncito'");

    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
      setLoading(true);
      const res = await fetch(ENDPOINTS.importarDirectorio, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error en el servidor");
      alert("Importación completada");
      setMostrarImport(false);
    } catch (error) {
      console.error(error);
      alert("Error al importar");
    } finally {
      setLoading(false);  
    }
  };

  return (
    <div>
      <input type="file" accept=".zip" onChange={(e) => e.target.files && setArchivo(e.target.files[0])} />
      <button onClick={enviarArchivo} disabled={loading}>
        {loading ? "Subiendo..." : "Subir archivo"}
      </button>
      <button onClick={() => setMostrarImport(false)}>Volver</button>
    </div>
  );
}