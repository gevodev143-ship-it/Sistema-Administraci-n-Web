const archiver = require("archiver");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const { supabase } = require("../config/supabase");

const BUCKET_NAME = "imagenes";

// ----------------------------------------------------
// FUNCION GENÉRICA PARA TODAS LAS CARPETAS
// ----------------------------------------------------
const exportarImagenesPorCarpeta = async (carpeta, archive) => {
  try {
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(carpeta, { limit: 1000 });

    if (error) {
      console.error("Error en carpeta:", carpeta, error.message);
      return;
    }

    for (const file of files) {
      if (!file.name || file.name === ".emptyFolderPlaceholder") continue;

      const filePath = `${carpeta}/${file.name}`;

      const { data, error: signedError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 60);

      if (signedError) {
        console.error("Error URL:", file.name);
        continue;
      }

      const response = await fetch(data.signedUrl);

      if (!response.ok) {
        console.warn("No se pudo descargar:", file.name);
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      archive.append(buffer, {
        name: `${carpeta}/${file.name}`,
      });

      console.log("✅ Agregado:", file.name);
    }
  } catch (err) {
    console.error("Error exportando carpeta:", carpeta, err);
  }
};

// ================= insertarArchivoAStorage =================
const insertarArchivoAStorage = async (rutaBase, archivo) => {
  if (!rutaBase || !archivo) return null;

  // 1. Validar extensión de imagen
  const extensionesValidas = ["jpg", "jpeg", "png", "webp"];

  const extension = archivo.name.split(".").pop().toLowerCase();

  if (!extensionesValidas.includes(extension)) {
    console.error("Archivo no permitido:", archivo.name);
    return null;
  }

  // 2. Separar bucket y carpeta
  const partes = rutaBase.split("/").filter(Boolean);

  const bucket = partes[0];
  const carpeta = partes.slice(1).join("/");

  // 3. GENERAR NOMBRE SEGURO (COMBINACIÓN DE AMBOS MUNDOS)
  const nombreArchivo = `${Date.now()}-${archivo.name}`;

  // 4. Construir ruta final
  const rutaArchivo = carpeta
    ? `${carpeta}/${nombreArchivo}`
    : nombreArchivo;

  // 5. Subir a Supabase Storage
  const { error } = await supabase.storage
    .from(bucket)
    .upload(rutaArchivo, archivo, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Error al subir archivo:", error.message);
    return null;
  }

  // 6. Retornar nombre generado
  return nombreArchivo;
};

// ================= eliminarArchivoDeStorage =================
const eliminarArchivoDeStorage = async (rutaBase, nombreArchivo) => {
  if (!rutaBase || !nombreArchivo) return false;
  // 1. Validar extensión de imagen
  const extensionesValidas = ["jpg", "jpeg", "png", "webp"];

  const extension = nombreArchivo.split(".").pop().toLowerCase();

  if (!extensionesValidas.includes(extension)) {
    console.error("Archivo no permitido:", nombreArchivo);
    return false;
  }

  // 2. Separar bucket y carpeta
  const partes = rutaBase.split("/").filter(Boolean);

  const bucket = partes[0];
  const carpeta = partes.slice(1).join("/");

  // 3. Construir ruta final del archivo
  const rutaArchivo = carpeta
    ? `${carpeta}/${nombreArchivo}`
    : nombreArchivo;

  // 4. Eliminar en Supabase
  const { error } = await supabase.storage
    .from(bucket)
    .remove([rutaArchivo]);

  if (error) {
    console.error("Error al eliminar archivo:", error.message);
    return false;
  }
  return true;
};

// ----------------------------------------------------
// EXPORT CORRECTO
// ----------------------------------------------------
module.exports = {
  exportarImagenesPorCarpeta,
  insertarArchivoAStorage,
  eliminarArchivoDeStorage
};
