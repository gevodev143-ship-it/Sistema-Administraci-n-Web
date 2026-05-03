import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "./AdminPanel.module.css";
import img1 from "../../../../assets/img/baseDatos.png";
import { ENDPOINTS } from "../../../../core/services/apiConfig";

// ─── Types ─────────────────────────────────────────────────────
interface ExcelRow {
  descripcion: string;
  categoria: string;
  marca: string;
  precio: number | string;
}

interface ImportLog {
  type: "info" | "success" | "error" | "warn";
  msg: string;
}

// ─── Main Component ────────────────────────────────────────────
export default function AdminPanel() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarImport, setMostrarImport] = useState(false);

  const [activo, setActivo] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const botones = [
    { label: "Gestor de Tablas", path: "/home" },
  ];

  const descargarBackup = () => {
    window.open(ENDPOINTS.backup, "_blank");
  };

  return (
    <>
      <div className={styles.adminPanel}>
        <div className={styles.botones_y_BD}>

          {/* Botones navegación */}
          <div className={styles.botonesNav}>
            {botones.map((b) => (
              <button
                key={b.path}
                onClick={() =>
                  navigate(b.path + (activo ? "?sinImagen=true" : ""))
                }
                className={location.pathname === b.path ? styles.activo : ""}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Base de Datos */}
          <div className={styles.botonBaseDatos}>
            <button onClick={() => setMostrarModal(true)}>
              <img src={img1} alt="base de datos" />
              Base de Datos
            </button>

            {mostrarModal && (
              <div
                className={styles.modalFondo}
                onClick={() => setMostrarModal(false)}
              >
                <div
                  className={styles.modal}
                  onClick={(e) => e.stopPropagation()}
                >
                  {!mostrarImport ? (
                    <>
                      <button onClick={() => setMostrarImport(true)}>
                        Importar BD
                      </button>

                      <button onClick={descargarBackup}>
                        Exportar BD
                      </button>
                    </>
                  ) : (
                    <ImportSection setMostrarImport={setMostrarImport} />
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
    </>
  );
}
// ─── Import Section ────────────────────────────────────────────
function ImportSection({ setMostrarImport }: { setMostrarImport: (v: boolean) => void }) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArchivo(e.target.files[0]);
    }
  };

  const enviarArchivo = async () => {
    if (!archivo) {
      alert("Selecciona un archivo primero");
      return;
    }

    // ✅ Validación nombre
    if (!archivo.name.startsWith("BaseDeDatosGorrioncito")) {
      alert("El archivo debe empezar con 'BaseDeDatosGorrioncito'");
      return;
    }

    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
      setLoading(true);

      const res = await fetch(ENDPOINTS.importarDirectorio, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Error en el servidor");
      }

      const data = await res.json();
      console.log("Respuesta backend:", data);

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
      <input type="file" accept=".zip" onChange={handleFileChange} />

      <button onClick={enviarArchivo} disabled={loading}>
        {loading ? "Subiendo..." : "Subir archivo"}
      </button>

      <button onClick={() => setMostrarImport(false)}>
        Volver
      </button>
    </div>
  );
}