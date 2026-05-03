const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const { supabase } = require("../config/supabase");

const CONFIG_ARCHIVOS = [
  {
    archivo: "categorias.csv",
    tabla: "categoria",
    pk: "ctgraid",
    columnaNombre: "ctgraimgnombre",
    columnaBucket: "ctgraimgnombrebucket",
    carpetaBucket: "categoria",
  },
  {
    archivo: "marcas.csv",
    tabla: "marca",
    pk: "marcaid",
    columnaNombre: "marcaimgnombre",
    columnaBucket: "marcaimgnombrebucket",
    carpetaBucket: "marca",
  },
  {
    archivo: "productos.csv",
    tabla: "producto",
    pk: "prdcid",
    columnaNombre: "prdcimgnombre",
    columnaBucket: "prdcimgnombrebucket",
    carpetaBucket: "producto",
  },
];

const BUCKET = "imagenes";

// ─────────────────────────────────────────────
// LECTURA DE ARCHIVOS CSV / XLSX
// Recibe el config del archivo para filtrar correctamente
// ─────────────────────────────────────────────
const leerArchivo = (rutaCompleta, config) => {
  const workbook = XLSX.readFile(rutaCompleta);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  const MAX_TEXT = 500; // Truncar strings largos para evitar "index row too large" (max 8191 bytes)

  const filas = data.map((fila) =>
    Object.fromEntries(
      Object.entries(fila)
        .map(([k, v]) => {
          const key = k.toLowerCase().trim();
          const val = v === "null" || v === "" || v === undefined ? null : v;
          if (key === "prdcprecio") return [key, val !== null ? Number(val) : null];
          // Truncar strings excesivamente largos
          if (typeof val === "string" && val.length > MAX_TEXT)
            return [key, val.slice(0, MAX_TEXT)];
          return [key, val];
        })
        .filter(([k]) => k && !k.startsWith("__empty"))
    )
  );

  // Solo descartar filas completamente sin pk.
  // IMPORTANTE: la categoría 18 (nombre vacío) se inserta igual porque productos la referencian.
  return filas.filter((fila) => fila[config.pk] !== null && fila[config.pk] !== undefined);
};

// ─────────────────────────────────────────────
// LIMPIEZA DE TABLAS
// Orden inverso por FK: producto → marca → categoria
// No se resetea el SERIAL — los IDs del CSV se usan directamente
// ─────────────────────────────────────────────
const limpiarTablas = async () => {
  const errores = [];
  const tablas = [
    { tabla: "producto",  pk: "prdcid"  },
    { tabla: "marca",     pk: "marcaid" },
    { tabla: "categoria", pk: "ctgraid" },
  ];

  for (const { tabla, pk } of tablas) {
    const { error } = await supabase.from(tabla).delete().not(pk, "is", null);
    if (error) errores.push(`Error al limpiar ${tabla}: ${error.message}`);
  }

  return errores;
};

// ─────────────────────────────────────────────
// LIMPIEZA Y CREACIÓN DE CARPETAS EN BUCKET
// ─────────────────────────────────────────────
const limpiarYCrearCarpetaBucket = async (carpetaBucket) => {
  const errores = [];

  const { data: archivos, error: errorListar } = await supabase.storage
    .from(BUCKET)
    .list(carpetaBucket, { limit: 10000 });

  if (errorListar) {
    errores.push(`Error al listar ${carpetaBucket}: ${errorListar.message}`);
    return errores;
  }

  if (archivos && archivos.length > 0) {
    const rutas = archivos.map((f) => `${carpetaBucket}/${f.name}`);
    const LOTE = 1000;
    for (let i = 0; i < rutas.length; i += LOTE) {
      const { error } = await supabase.storage
        .from(BUCKET)
        .remove(rutas.slice(i, i + LOTE));
      if (error)
        errores.push(`Error al eliminar en ${carpetaBucket}: ${error.message}`);
    }
  }

  // Placeholder para que la carpeta exista en Supabase Storage
  const { error: errorKeep } = await supabase.storage
    .from(BUCKET)
    .upload(`${carpetaBucket}/.keep`, new Uint8Array(0), {
      contentType: "application/octet-stream",
      upsert: true,
    });

  if (errorKeep)
    errores.push(`Error al crear carpeta ${carpetaBucket}: ${errorKeep.message}`);

  return errores;
};

// ─────────────────────────────────────────────
// INSERCIÓN EN TABLA
// Devuelve un Map: csvId (string) → nuevoId (generado por Supabase)
// ─────────────────────────────────────────────
const insertarEnTabla = async (tabla, pk, registros, mapaFKs = {}) => {
  const LOTE = 500; // Reducido para evitar timeouts
  const errores = [];
  let totalInsertados = 0;
  const mapaGenerado = new Map(); // csvId → nuevoId

  for (let i = 0; i < registros.length; i += LOTE) {
    const csvLote = registros.slice(i, i + LOTE);

    // Construir lote con mapeo de FKs (solo para producto)
    // Guardamos el csvId original para poder construir el mapa después
    const loteMapeado = [];
    const csvIdsLote = []; // IDs originales del CSV, en el mismo orden

    for (const r of csvLote) {
      const csvId = String(r[pk]);
      const fila = { ...r }; // Conservar el pk del CSV tal como está

      if (tabla === "producto") {
        const ctgraIdReal = mapaFKs.categoria?.get(String(r.ctgraid));
        const marcaIdReal = mapaFKs.marca?.get(String(r.marcaid));

        if (!ctgraIdReal) {
          errores.push(
            `Producto "${r.prdcimgnombre}" omitido: ctgraid="${r.ctgraid}" no tiene equivalente en el mapa de categorías`
          );
          continue;
        }
        if (!marcaIdReal) {
          errores.push(
            `Producto "${r.prdcimgnombre}" omitido: marcaid="${r.marcaid}" no tiene equivalente en el mapa de marcas`
          );
          continue;
        }

        fila.ctgraid = ctgraIdReal;
        fila.marcaid = marcaIdReal;
      }

      loteMapeado.push(fila);
      csvIdsLote.push(csvId);
    }

    if (loteMapeado.length === 0) continue;

    const { data, error } = await supabase
      .from(tabla)
      .upsert(loteMapeado, { onConflict: pk })
      .select();

    if (error) {
      errores.push(`Lote ${Math.floor(i / LOTE) + 1} en "${tabla}": ${error.message}`);
      continue;
    }

    totalInsertados += data.length;

    // El id no cambia (upsert conserva el pk del CSV),
    // así que el mapa es simplemente csvId → csvId
    if (tabla === "categoria" || tabla === "marca") {
      data.forEach((insertado) => {
        const id = insertado[pk];
        mapaGenerado.set(String(id), id);
      });
    }
  }

  return { errores, totalInsertados, mapaGenerado };
};

// ─────────────────────────────────────────────
// SUBIDA DE IMÁGENES AL BUCKET
// ─────────────────────────────────────────────
const inferirMime = (nombre) => {
  const mimes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };
  return mimes[path.extname(nombre).toLowerCase()] || "application/octet-stream";
};

const subirImagenes = async (
  carpetaImagenesLocal,
  nombresEsperados,
  carpetaBucket
) => {
  const resultado = { subidas: 0, omitidas: 0, errores: [] };

  if (!fs.existsSync(carpetaImagenesLocal)) {
    resultado.errores.push(
      `Carpeta local no encontrada: ${carpetaImagenesLocal}`
    );
    return resultado;
  }

  const archivosLocales = fs.readdirSync(carpetaImagenesLocal);
  // Mapa en minúsculas para comparación case-insensitive
  const mapaLocal = new Map(
    archivosLocales.map((n) => [n.toLowerCase(), n])
  );

  for (const nombreEsperado of nombresEsperados) {
    if (!nombreEsperado) continue;

    const nombreLocalReal = mapaLocal.get(nombreEsperado.toLowerCase());
    if (!nombreLocalReal) {
      resultado.omitidas++;
      continue;
    }

    const contenido = fs.readFileSync(
      path.join(carpetaImagenesLocal, nombreLocalReal)
    );

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${carpetaBucket}/${nombreEsperado}`, contenido, {
        contentType: inferirMime(nombreLocalReal),
        upsert: true,
      });

    if (error)
      resultado.errores.push(
        `Error al subir ${nombreEsperado}: ${error.message}`
      );
    else resultado.subidas++;
  }

  return resultado;
};

// ─────────────────────────────────────────────
// PROCESO PRINCIPAL
// ─────────────────────────────────────────────
const procesarArchivosExcel = async (directorioBase) => {
  // FASE 1: Limpiar tablas y reiniciar secuencias SERIAL
  console.log("⏳ Fase 1: Limpiando tablas...");
  const erroresLimpiezaTablas = await limpiarTablas();
  if (erroresLimpiezaTablas.length > 0) {
    console.error("❌ Errores en limpieza de tablas:", erroresLimpiezaTablas);
    console.warn("⚠️  Continuando de todas formas — verifica que la función SQL exista en Supabase.");
  } else {
    console.log("✅ Tablas limpias y secuencias reiniciadas");
  }

  // FASE 2: Limpiar carpetas del bucket
  console.log("⏳ Fase 2: Limpiando bucket...");
  const erroresLimpiezaBucket = [];
  for (const config of CONFIG_ARCHIVOS) {
    const errs = await limpiarYCrearCarpetaBucket(config.carpetaBucket);
    erroresLimpiezaBucket.push(...errs);
  }
  console.log("✅ Bucket limpio");

  // FASE 3: Insertar CSVs y subir imágenes
  const resultados = [];
  const mapaFKs = {}; // { categoria: Map<csvId, nuevoId>, marca: Map<csvId, nuevoId> }

  for (const config of CONFIG_ARCHIVOS) {
    console.log(`⏳ Procesando ${config.archivo}...`);
    const rutaCsv = path.join(directorioBase, "csv", config.archivo);

    if (!fs.existsSync(rutaCsv)) {
      resultados.push({
        archivo: config.archivo,
        tabla: config.tabla,
        filas: 0,
        insertados: 0,
        erroresDb: [`Archivo no encontrado: ${rutaCsv}`],
        imagenes: null,
      });
      continue;
    }

    const registros = leerArchivo(rutaCsv, config);
    console.log(`   📄 ${registros.length} filas válidas leídas`);

    if (config.tabla !== "producto") {
      console.log(`   🗺️  Mapa de FKs disponibles para categoría/marca: no aplica aún`);
    } else {
      console.log(
        `   🗺️  Mapa categorías: ${mapaFKs.categoria?.size ?? 0} entradas | ` +
        `Mapa marcas: ${mapaFKs.marca?.size ?? 0} entradas`
      );
    }

    const { errores: erroresDb, totalInsertados, mapaGenerado } =
      await insertarEnTabla(config.tabla, config.pk, registros, mapaFKs);

    // Guardar mapas de FK para tablas de referencia
    if (config.tabla === "categoria" || config.tabla === "marca") {
      mapaFKs[config.tabla] = mapaGenerado;
      console.log(
        `   🗺️  Mapa generado para ${config.tabla}: ${mapaGenerado.size} entradas`
      );
    }

    // Subir imágenes
    const nombresImagenes = registros
      .map((r) => r[config.columnaBucket])
      .filter(Boolean);

    const carpetaImagenesLocal = path.join(directorioBase, config.carpetaBucket);
    const imagenes = await subirImagenes(
      carpetaImagenesLocal,
      nombresImagenes,
      config.carpetaBucket
    );

    console.log(
      `   ✅ ${totalInsertados} insertados | ` +
      `🖼️  ${imagenes.subidas} imágenes subidas, ${imagenes.omitidas} omitidas`
    );
    if (erroresDb.length > 0) console.warn("   ⚠️  Errores DB:", erroresDb);

    resultados.push({
      archivo: config.archivo,
      tabla: config.tabla,
      filas: registros.length,
      insertados: totalInsertados,
      erroresDb,
      imagenes,
    });
  }

  return { erroresLimpiezaTablas, erroresLimpiezaBucket, resultados };
};

module.exports = { procesarArchivosExcel };