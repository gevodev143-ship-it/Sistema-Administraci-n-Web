import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

// ── Types ──────────────────────────────────────────────
interface Reclamo {
  lbrclms_id: number;
  lbrclms_email: string;
  lbrclms_nombres_apellidos: string;
  lbrclms_domicilio: string;
  lbrclms_dni_ce: boolean;
  lbrclms_dni: string | null;
  lbrclms_ce: string | null;
  lbrclms_telefono: string;
  lbrclms_recl_quej_detall: string;
  lbrclms_fecha: string;
}

// ── Helpers ────────────────────────────────────────────
const formatFecha = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTipo = (detalle: string): "Reclamo" | "Queja" | "—" => {
  if (detalle.startsWith("[Reclamo]")) return "Reclamo";
  if (detalle.startsWith("[Queja]")) return "Queja";
  return "—";
};

const getDetalleSinPrefijo = (detalle: string) =>
  detalle.replace(/^\[(Reclamo|Queja)\]\s*/, "");

// ── Component ──────────────────────────────────────────
const Seccion_1 = () => {
  const [data, setData] = useState<Reclamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Reclamo | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: rows, error: err } = await supabase
        .from("libro_reclamaciones")
        .select("*")
        .order("lbrclms_fecha", { ascending: false });

      if (err) {
        setError(err.message);
      } else {
        setData(rows ?? []);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const filtered = data.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.lbrclms_nombres_apellidos.toLowerCase().includes(q) ||
      r.lbrclms_email.toLowerCase().includes(q) ||
      r.lbrclms_recl_quej_detall.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Sora:wght@600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .lr-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #e8f4fd 0%, #f0f8ff 50%, #e3f2fb 100%);
          font-family: 'DM Sans', sans-serif;
          padding: 40px 24px 80px;
        }

        /* ── Header ── */
        .lr-header {
          max-width: 1200px;
          margin: 0 auto 36px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .lr-title-block {}
        .lr-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #5baad4;
          margin-bottom: 6px;
        }
        .lr-title {
          font-family: 'Sora', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #0d3a5c;
          line-height: 1.2;
        }
        .lr-title span {
          color: #2a9fd6;
        }
        .lr-count {
          background: #2a9fd6;
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 20px;
          margin-left: 10px;
          vertical-align: middle;
        }

        /* ── Search ── */
        .lr-search-wrap {
          position: relative;
        }
        .lr-search {
          border: 1.5px solid #c3dff0;
          border-radius: 10px;
          padding: 10px 16px 10px 40px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #1a3f5c;
          background: white;
          width: 260px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .lr-search:focus {
          border-color: #2a9fd6;
          box-shadow: 0 0 0 3px rgba(42,159,214,0.12);
        }
        .lr-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #8ab8d0;
          font-size: 15px;
          pointer-events: none;
        }

        /* ── Table card ── */
        .lr-card {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 18px;
          box-shadow: 0 4px 32px rgba(13,58,92,0.08), 0 1px 4px rgba(13,58,92,0.04);
          overflow: hidden;
          border: 1px solid #d9edf7;
        }

        .lr-table {
          width: 100%;
          border-collapse: collapse;
        }

        .lr-table thead {
          background: linear-gradient(90deg, #1a6fa3 0%, #2a9fd6 100%);
        }
        .lr-table thead th {
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          padding: 14px 18px;
          text-align: left;
          white-space: nowrap;
        }

        .lr-table tbody tr {
          border-bottom: 1px solid #eef5fb;
          transition: background 0.15s;
          cursor: pointer;
        }
        .lr-table tbody tr:hover {
          background: #f0f8ff;
        }
        .lr-table tbody tr:last-child {
          border-bottom: none;
        }

        .lr-table td {
          padding: 14px 18px;
          font-size: 13.5px;
          color: #2d5a78;
          vertical-align: middle;
        }

        /* ── Pill badges ── */
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 20px;
          white-space: nowrap;
        }
        .pill-reclamo {
          background: #fff0f0;
          color: #c0392b;
          border: 1px solid #f5c6c2;
        }
        .pill-queja {
          background: #fff8e8;
          color: #c07d00;
          border: 1px solid #f5e0a8;
        }
        .pill-dni {
          background: #e8f4fd;
          color: #1a6fa3;
          border: 1px solid #b8d9f0;
        }
        .pill-ce {
          background: #eef5fb;
          color: #2a5478;
          border: 1px solid #c3dff0;
        }

        /* nombre en negrita */
        .lr-nombre {
          font-weight: 600;
          color: #0d3a5c;
        }
        .lr-email {
          font-size: 12px;
          color: #5baad4;
        }
        .lr-detalle-preview {
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #4a7a96;
          font-size: 13px;
        }
        .lr-fecha {
          font-size: 12px;
          color: #7aafc8;
          white-space: nowrap;
        }

        /* ── States ── */
        .lr-state {
          max-width: 1200px;
          margin: 60px auto;
          text-align: center;
          color: #5baad4;
          font-size: 15px;
        }
        .lr-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #c3dff0;
          border-top-color: #2a9fd6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .lr-empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        /* ── Modal ── */
        .lr-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 35, 60, 0.45);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .lr-modal {
          background: white;
          border-radius: 20px;
          max-width: 560px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(10,35,60,0.2);
          overflow: hidden;
          animation: slideUp 0.25s ease;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .lr-modal-header {
          background: linear-gradient(90deg, #1a6fa3 0%, #2a9fd6 100%);
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .lr-modal-header h2 {
          font-family: 'Sora', sans-serif;
          font-size: 17px;
          color: white;
          font-weight: 700;
        }
        .lr-modal-header p {
          color: rgba(255,255,255,0.75);
          font-size: 12px;
          margin-top: 2px;
        }
        .lr-close {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          font-size: 18px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .lr-close:hover { background: rgba(255,255,255,0.35); }

        .lr-modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-height: 70vh;
          overflow-y: auto;
        }

        .lr-field {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .lr-field-label {
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #8ab8d0;
        }
        .lr-field-value {
          font-size: 14px;
          color: #0d3a5c;
          font-weight: 500;
          line-height: 1.5;
        }
        .lr-divider {
          height: 1px;
          background: #eef5fb;
          margin: 4px 0;
        }
        .lr-detalle-full {
          background: #f4faff;
          border: 1px solid #d0e9f7;
          border-radius: 10px;
          padding: 14px;
          font-size: 14px;
          color: #1a4a6b;
          line-height: 1.6;
        }
      `}</style>

      <div className="lr-page">
        {/* Header */}
        <div className="lr-header">
          <div className="lr-title-block">
            <p className="lr-eyebrow">Ferretería Gorrioncito</p>
            <h1 className="lr-title">
              Libro de <span>Reclamaciones</span>
              {!loading && <span className="lr-count">{filtered.length}</span>}
            </h1>
          </div>
          <div className="lr-search-wrap">
            <span className="lr-search-icon">🔍</span>
            <input
              className="lr-search"
              type="text"
              placeholder="Buscar por nombre, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="lr-state">
            <div className="lr-spinner" />
            Cargando registros...
          </div>
        )}
        {!loading && error && (
          <div className="lr-state" style={{ color: "#c0392b" }}>
            ⚠ {error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="lr-state">
            <div className="lr-empty-icon">📋</div>
            {search ? "Sin resultados para tu búsqueda." : "No hay registros aún."}
          </div>
        )}

        {/* Table */}
        {!loading && !error && filtered.length > 0 && (
          <div className="lr-card">
            <table className="lr-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Consumidor</th>
                  <th>Documento</th>
                  <th>Teléfono</th>
                  <th>Tipo</th>
                  <th>Detalle</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const tipo = getTipo(r.lbrclms_recl_quej_detall);
                  const doc = r.lbrclms_dni_ce ? r.lbrclms_dni : r.lbrclms_ce;
                  return (
                    <tr key={r.lbrclms_id} onClick={() => setSelected(r)}>
                      <td style={{ color: "#8ab8d0", fontWeight: 600, fontSize: 12 }}>
                        #{r.lbrclms_id}
                      </td>
                      <td>
                        <div className="lr-nombre">{r.lbrclms_nombres_apellidos}</div>
                        <div className="lr-email">{r.lbrclms_email}</div>
                      </td>
                      <td>
                        <span className={`pill ${r.lbrclms_dni_ce ? "pill-dni" : "pill-ce"}`}>
                          {r.lbrclms_dni_ce ? "DNI" : "CE"} {doc}
                        </span>
                      </td>
                      <td>📞 {r.lbrclms_telefono}</td>
                      <td>
                        <span className={`pill ${tipo === "Reclamo" ? "pill-reclamo" : "pill-queja"}`}>
                          {tipo === "Reclamo" ? "⚠" : "💬"} {tipo}
                        </span>
                      </td>
                      <td>
                        <div className="lr-detalle-preview">
                          {getDetalleSinPrefijo(r.lbrclms_recl_quej_detall)}
                        </div>
                      </td>
                      <td>
                        <div className="lr-fecha">
                          🕐 {formatFecha(r.lbrclms_fecha)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {selected && (
        <div className="lr-overlay" onClick={() => setSelected(null)}>
          <div className="lr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lr-modal-header">
              <div>
                <h2>Detalle del Registro #{selected.lbrclms_id}</h2>
                <p>{formatFecha(selected.lbrclms_fecha)}</p>
              </div>
              <button className="lr-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="lr-modal-body">
              <div className="lr-field">
                <span className="lr-field-label">Nombres y Apellidos</span>
                <span className="lr-field-value">{selected.lbrclms_nombres_apellidos}</span>
              </div>
              <div className="lr-field">
                <span className="lr-field-label">Correo electrónico</span>
                <span className="lr-field-value">{selected.lbrclms_email}</span>
              </div>
              <div className="lr-field">
                <span className="lr-field-label">Domicilio</span>
                <span className="lr-field-value">{selected.lbrclms_domicilio}</span>
              </div>
              <div className="lr-divider" />
              <div style={{ display: "flex", gap: 24 }}>
                <div className="lr-field">
                  <span className="lr-field-label">Tipo de documento</span>
                  <span className="lr-field-value">
                    <span className={`pill ${selected.lbrclms_dni_ce ? "pill-dni" : "pill-ce"}`}>
                      {selected.lbrclms_dni_ce ? "DNI" : "CE"}
                    </span>
                  </span>
                </div>
                <div className="lr-field">
                  <span className="lr-field-label">Número</span>
                  <span className="lr-field-value">
                    {selected.lbrclms_dni_ce ? selected.lbrclms_dni : selected.lbrclms_ce}
                  </span>
                </div>
                <div className="lr-field">
                  <span className="lr-field-label">Teléfono</span>
                  <span className="lr-field-value">{selected.lbrclms_telefono}</span>
                </div>
              </div>
              <div className="lr-divider" />
              <div className="lr-field">
                <span className="lr-field-label">
                  Tipo de reclamo &nbsp;
                  <span className={`pill ${getTipo(selected.lbrclms_recl_quej_detall) === "Reclamo" ? "pill-reclamo" : "pill-queja"}`}>
                    {getTipo(selected.lbrclms_recl_quej_detall) === "Reclamo" ? "⚠ Reclamo" : "💬 Queja"}
                  </span>
                </span>
              </div>
              <div className="lr-field">
                <span className="lr-field-label">Detalle</span>
                <div className="lr-detalle-full">
                  {getDetalleSinPrefijo(selected.lbrclms_recl_quej_detall)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Seccion_1;