import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import emailjs from "@emailjs/browser";
import style from "./seccion_1.module.css";

// ─── EmailJS config ────────────────────────────────────
const EJS_PUBLIC_KEY  = "gqyB1Jy5OLlq59qgr";   // 🔑 reemplaza
const EJS_SERVICE_ID  = "service_7ctgs0d";   // 🔑 reemplaza
const EJS_TEMPLATE_ID = "template_67hnc3e";  // 🔑 reemplaza

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
  lbrclms_respuesta: string | null;
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

const esPendiente = (r: Reclamo) =>
  !r.lbrclms_respuesta || r.lbrclms_respuesta.trim() === "";

// ── Component ──────────────────────────────────────────
const Seccion_1 = () => {
  const [data, setData]         = useState<Reclamo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [selected, setSelected] = useState<Reclamo | null>(null);
  const [search, setSearch]     = useState("");
  const [tab, setTab]           = useState<"pendientes" | "respondidos">("pendientes");

  // Reply state
  const [replyId, setReplyId]       = useState<number | null>(null);
  const [replyText, setReplyText]   = useState("");
  const [sending, setSending]       = useState(false);
  const [sendMsg, setSendMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error: err } = await supabase
      .from("libro_reclamaciones")
      .select("*")
      .order("lbrclms_fecha", { ascending: false });

    if (err) setError(err.message);
    else setData(rows ?? []);
    setLoading(false);
  };

  const filtered = data.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.lbrclms_nombres_apellidos.toLowerCase().includes(q) ||
      r.lbrclms_email.toLowerCase().includes(q) ||
      r.lbrclms_recl_quej_detall.toLowerCase().includes(q);

    const matchTab =
      tab === "pendientes" ? esPendiente(r) : !esPendiente(r);

    return matchSearch && matchTab;
  });

  const pendientesCount   = data.filter(esPendiente).length;
  const respondidosCount  = data.filter((r) => !esPendiente(r)).length;

  // ── Toggle reply panel ──────────────────────────────
  const toggleReply = (id: number) => {
    if (replyId === id) {
      setReplyId(null);
      setReplyText("");
      setSendMsg(null);
    } else {
      setReplyId(id);
      setReplyText("");
      setSendMsg(null);
    }
  };

  // ── Send reply ──────────────────────────────────────
  const handleSend = async (reclamo: Reclamo) => {
    if (!replyText.trim()) return;
    setSending(true);
    setSendMsg(null);

    try {
      // 1. Guardar en Supabase
      const { error: dbErr } = await supabase
        .from("libro_reclamaciones")
        .update({ lbrclms_respuesta: replyText.trim() })
        .eq("lbrclms_id", reclamo.lbrclms_id);

      if (dbErr) throw new Error(dbErr.message);

      // 2. Enviar email con EmailJS
      await emailjs.send(
        EJS_SERVICE_ID,
        EJS_TEMPLATE_ID,
        {
          to_name:    reclamo.lbrclms_nombres_apellidos,
          to_email:   reclamo.lbrclms_email,
          tipo:       getTipo(reclamo.lbrclms_recl_quej_detall),
          detalle:    getDetalleSinPrefijo(reclamo.lbrclms_recl_quej_detall),
          respuesta:  replyText.trim(),
          fecha_orig: formatFecha(reclamo.lbrclms_fecha),
          reclamo_id: String(reclamo.lbrclms_id),
        },
        EJS_PUBLIC_KEY
      );

      // 3. Actualizar estado local
      setData((prev) =>
        prev.map((r) =>
          r.lbrclms_id === reclamo.lbrclms_id
            ? { ...r, lbrclms_respuesta: replyText.trim() }
            : r
        )
      );

      setSendMsg({ ok: true, text: "✅ Respuesta enviada y guardada correctamente." });
      setReplyId(null);
      setReplyText("");
    } catch (e: any) {
      setSendMsg({ ok: false, text: `⚠ Error: ${e.message}` });
    } finally {
      setSending(false);
    }
  };

  // ── Shared table renderer ────────────────────────────
  const renderTable = (rows: Reclamo[], showReply: boolean) => (
    <div className={style.card}>
      <table className={style.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Consumidor</th>
            <th>Documento</th>
            <th>Teléfono</th>
            <th>Tipo</th>
            <th>Detalle</th>
            <th>Fecha</th>
            {!showReply && <th>Acción</th>}
            {showReply  && <th>Respuesta</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const tipo = getTipo(r.lbrclms_recl_quej_detall);
            const doc  = r.lbrclms_dni_ce ? r.lbrclms_dni : r.lbrclms_ce;
            const isOpen = replyId === r.lbrclms_id;

            return (
              <>
                <tr
                  key={`row-${r.lbrclms_id}`}
                  className={isOpen ? style.rowActive : ""}
                  onClick={() => !showReply && setSelected(r)}
                >
                  <td className={style.idCell}>#{r.lbrclms_id}</td>
                  <td>
                    <div className={style.nombre}>{r.lbrclms_nombres_apellidos}</div>
                    <div className={style.email}>{r.lbrclms_email}</div>
                  </td>
                  <td>
                    <span className={`${style.pill} ${r.lbrclms_dni_ce ? style.pillDni : style.pillCe}`}>
                      {r.lbrclms_dni_ce ? "DNI" : "CE"} {doc}
                    </span>
                  </td>
                  <td>📞 {r.lbrclms_telefono}</td>
                  <td>
                    <span className={`${style.pill} ${tipo === "Reclamo" ? style.pillReclamo : style.pillQueja}`}>
                      {tipo === "Reclamo" ? "⚠" : "💬"} {tipo}
                    </span>
                  </td>
                  <td>
                    <div className={style.detallePreview}>
                      {getDetalleSinPrefijo(r.lbrclms_recl_quej_detall)}
                    </div>
                  </td>
                  <td>
                    <div className={style.fecha}>🕐 {formatFecha(r.lbrclms_fecha)}</div>
                  </td>

                  {/* Pendientes: botón responder */}
                  {!showReply && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className={`${style.replyBtn} ${isOpen ? style.replyBtnActive : ""}`}
                        onClick={() => toggleReply(r.lbrclms_id)}
                      >
                        {isOpen ? "✕ Cerrar" : "✉ Responder"}
                      </button>
                    </td>
                  )}

                  {/* Respondidos: preview respuesta */}
                  {showReply && (
                    <td>
                      <div className={style.respuestaPreview}>
                        {r.lbrclms_respuesta}
                      </div>
                    </td>
                  )}
                </tr>

                {/* ── Reply panel ── */}
                {!showReply && isOpen && (
                  <tr key={`reply-${r.lbrclms_id}`} className={style.replyRow}>
                    <td colSpan={8}>
                      <div className={style.replyPanel}>
                        <div className={style.replyPanelHeader}>
                          <span className={style.replyPanelTitle}>
                            ✉ Respondiendo a <strong>{r.lbrclms_nombres_apellidos}</strong>
                            <span className={style.replyEmail}>&nbsp;({r.lbrclms_email})</span>
                          </span>
                        </div>
                        <textarea
                          className={style.replyTextarea}
                          placeholder="Escribe tu respuesta aquí..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={4}
                        />
                        <div className={style.replyActions}>
                          {sendMsg && (
                            <span className={sendMsg.ok ? style.msgOk : style.msgErr}>
                              {sendMsg.text}
                            </span>
                          )}
                          <button
                            className={style.cancelBtn}
                            onClick={() => toggleReply(r.lbrclms_id)}
                            disabled={sending}
                          >
                            Cancelar
                          </button>
                          <button
                            className={style.sendBtn}
                            onClick={() => handleSend(r)}
                            disabled={sending || !replyText.trim()}
                          >
                            {sending ? (
                              <><span className={style.spinnerSmall} /> Enviando...</>
                            ) : (
                              "✉ Enviar respuesta"
                            )}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className={style.page}>

        {/* ── Header ── */}
        <div className={style.header}>
          <div>
            <p className={style.eyebrow}>Ferretería Gorrioncito</p>
            <h1 className={style.title}>
              Libro de <span>Reclamaciones</span>
            </h1>
          </div>
          <div className={style.searchWrap}>
            <span className={style.searchIcon}>🔍</span>
            <input
              className={style.search}
              type="text"
              placeholder="Buscar por nombre, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={style.tabs}>
          <button
            className={`${style.tabBtn} ${tab === "pendientes" ? style.tabActive : ""}`}
            onClick={() => { setTab("pendientes"); setReplyId(null); }}
          >
            <span className={style.tabIcon}>🔔</span>
            Pendientes
            {pendientesCount > 0 && (
              <span className={`${style.tabBadge} ${style.tabBadgePending}`}>
                {pendientesCount}
              </span>
            )}
          </button>
          <button
            className={`${style.tabBtn} ${tab === "respondidos" ? style.tabActive : ""}`}
            onClick={() => { setTab("respondidos"); setReplyId(null); }}
          >
            <span className={style.tabIcon}>✅</span>
            Respondidos
            {respondidosCount > 0 && (
              <span className={`${style.tabBadge} ${style.tabBadgeDone}`}>
                {respondidosCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className={style.state}>
            <div className={style.spinner} />
            Cargando registros...
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className={`${style.state} ${style.stateError}`}>⚠ {error}</div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className={style.state}>
            <div className={style.emptyIcon}>
              {tab === "pendientes" ? "🎉" : "📋"}
            </div>
            {tab === "pendientes"
              ? search ? "Sin resultados." : "¡Sin reclamos pendientes!"
              : search ? "Sin resultados." : "Aún no hay respuestas enviadas."}
          </div>
        )}

        {/* ── Tables ── */}
        {!loading && !error && filtered.length > 0 &&
          renderTable(filtered, tab === "respondidos")
        }
      </div>

      {/* ── Modal detalle ── */}
      {selected && (
        <div className={style.overlay} onClick={() => setSelected(null)}>
          <div className={style.modal} onClick={(e) => e.stopPropagation()}>
            <div className={style.modalHeader}>
              <div>
                <h2>Detalle del Registro #{selected.lbrclms_id}</h2>
                <p>{formatFecha(selected.lbrclms_fecha)}</p>
              </div>
              <button className={style.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className={style.modalBody}>
              <div className={style.field}>
                <span className={style.fieldLabel}>Nombres y Apellidos</span>
                <span className={style.fieldValue}>{selected.lbrclms_nombres_apellidos}</span>
              </div>
              <div className={style.field}>
                <span className={style.fieldLabel}>Correo electrónico</span>
                <span className={style.fieldValue}>{selected.lbrclms_email}</span>
              </div>
              <div className={style.field}>
                <span className={style.fieldLabel}>Domicilio</span>
                <span className={style.fieldValue}>{selected.lbrclms_domicilio}</span>
              </div>
              <div className={style.divider} />
              <div className={style.modalRow}>
                <div className={style.field}>
                  <span className={style.fieldLabel}>Tipo de documento</span>
                  <span className={style.fieldValue}>
                    <span className={`${style.pill} ${selected.lbrclms_dni_ce ? style.pillDni : style.pillCe}`}>
                      {selected.lbrclms_dni_ce ? "DNI" : "CE"}
                    </span>
                  </span>
                </div>
                <div className={style.field}>
                  <span className={style.fieldLabel}>Número</span>
                  <span className={style.fieldValue}>
                    {selected.lbrclms_dni_ce ? selected.lbrclms_dni : selected.lbrclms_ce}
                  </span>
                </div>
                <div className={style.field}>
                  <span className={style.fieldLabel}>Teléfono</span>
                  <span className={style.fieldValue}>{selected.lbrclms_telefono}</span>
                </div>
              </div>
              <div className={style.divider} />
              <div className={style.field}>
                <span className={style.fieldLabel}>
                  Tipo &nbsp;
                  <span className={`${style.pill} ${getTipo(selected.lbrclms_recl_quej_detall) === "Reclamo" ? style.pillReclamo : style.pillQueja}`}>
                    {getTipo(selected.lbrclms_recl_quej_detall) === "Reclamo" ? "⚠ Reclamo" : "💬 Queja"}
                  </span>
                </span>
              </div>
              <div className={style.field}>
                <span className={style.fieldLabel}>Detalle</span>
                <div className={style.detalleFull}>
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