const { supabase } = require("../config/supabase");

const SELECT_MARCA = `
  marcaid,
  marcaimgnombre,
  marcaimgnombrebucket
`;

// ///////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////     listarMarcasPaginacion     //////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const listarMarcasPaginacion = async (pagina, limite) => {
  const desde = (pagina - 1) * limite;
  const hasta = desde + limite - 1;

  const { data, error } = await supabase
    .from("marca")
    .select(SELECT_MARCA)
    .order("marcaid", { ascending: true })
    .range(desde, hasta);

  if (error) {
    console.error("Error marcas:", error.message, error);
    return [];
  }

  return data;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////        listarMarcas       /////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const listarMarcas = async () => {
  let todos = [];
  let offset = 0;
  const limite = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("marca")
      .select(SELECT_MARCA)
      .order("marcaid", { ascending: true })
      .range(offset, offset + limite - 1);

    if (error) {
      console.error("Error al listar marcas:", error.message);
      break;
    }

    if (!data || data.length === 0) {
      break; // no hay más registros
    }
    todos = todos.concat(data);
    
    if (data.length < limite) {
      break; // último bloque, menos de 1000 registros
    }
    offset += limite; // avanzar al siguiente bloque
  }

  return todos;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////        obtenerMarcaPorId       //////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const obtenerMarcaPorId = async (id) => {
  const { data, error } = await supabase
    .from("marca")
    .select(SELECT_MARCA)
    .eq("marcaid", id)
    .single();

  if (error) {
    console.error("Error al listar marca por ID:", error);
    return null;
  }

  return data;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////        crearMarca       //////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const crearMarca = async (marca, imagenFile) => {
  try {
    let marcaimgnombre = null;
    let marcaimgnombrebucket = null;

    // 🖼️ 1. SUBIR IMAGEN PRIMERO
    if (imagenFile) {
      const resultadoUpload = await insertarArchivoAStorage(
        "imagenes/marca",
        imagenFile
      );

      if (!resultadoUpload) {
        console.error("Error al subir imagen");
        return null;
      }

      marcaimgnombre = imagenFile.name;
      marcaimgnombrebucket = resultadoUpload;
    }

    // 🧱 2. INSERTAR MARCA EN BD
    const nuevaMarca = {
      marcaimgnombre,
      marcaimgnombrebucket,
    };

    const { data, error } = await supabase
      .from("marca")
      .insert(nuevaMarca)
      .select()
      .single();

    if (error) {
      console.error("Error al crear la marca:", error.message);

      // 🧹 rollback
      if (marcaimgnombrebucket) {
        await eliminarArchivoDeStorage(
          "imagenes/marca",
          marcaimgnombrebucket
        );
      }

      return null;
    }

    return data;

  } catch (err) {
    console.error("Error general:", err);
    return null;
  }
};

// ///////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////        actualizarMarcaPorId       //////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const actualizarMarcaPorId = async (id, marca, nuevaImagen) => {
  try {
    const marcaActual = await obtenerMarcaPorId(id);

    if (!marcaActual) {
      console.error("Marca no encontrado");
      return null;
    }

    let nombreBucket = marca.marcaimgnombrebucket;

    if (nuevaImagen) {
      if (marcaActual.marcaimgnombrebucket) {
        await eliminarImagenMarca(marcaActual.marcaimgnombrebucket);
      }

      const nuevoNombre = await subirImagenMarca(nuevaImagen);

      if (!nuevoNombre) {
        console.error("Error al subir nueva imagen");
        return null;
      }

      nombreBucket = nuevoNombre;
    }

    const updateData = {};

    if (marca.marcaimgnombre !== undefined)
      updateData.marcaimgnombre = marca.marcaimgnombre;

    if (nombreBucket !== undefined)
      updateData.marcaimgnombrebucket = nombreBucket;

    if (Object.keys(updateData).length === 0) {
      console.warn("No hay datos para actualizar");
      return null;
    }

    const { data, error } = await supabase
      .from("marca")
      .update(updateData)
      .eq("marcaid", id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar marca:", error.message);
      return null;
    }

    return data;

  } catch (err) {
    console.error("Error general:", err);
    return null;
  }
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////        eliminarMarcaPorId       ///////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const eliminarMarcaPorId = async (id) => {
  if (!id) {
    return { ok: false, mensaje: "ID inválido" };
  }

  try {
    const { data: marca, error: fetchError } = await supabase
      .from("marca")
      .select("marcaimgnombrebucket")
      .eq("marcaid", id)
      .single();

    if (fetchError || !marca) {
      return { ok: false, mensaje: "No se pudo obtener la marca" };
    }

    const { error: deleteError } = await supabase
      .from("marca")
      .delete()
      .eq("marcaid", id);

    if (deleteError) {
      if (deleteError.code === "23503") {
        return {
          ok: false,
          mensaje: "No puedes eliminar esta marca porque tiene productos asociados"
        };
      }

      return { ok: false, mensaje: "Error al eliminar la marca" };
    }

    if (marca.marcaimgnombrebucket) {
      const imagenPath = `marca/${marca.marcaimgnombrebucket}`;

      const { error: storageError } = await supabase.storage
        .from("imagenes")
        .remove([imagenPath]);

      if (storageError) {
        console.error("Error al eliminar imagen:", storageError.message);
      }
    }

    return { ok: true };

  } catch (err) {
    console.error("Error general:", err);
    return { ok: false, mensaje: "Error inesperado" };
  }
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////        eliminarImagenMarca       ////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const eliminarImagenMarca = async (nombre) => {
  if (!nombre) return false;

  const { error } = await supabase.storage
    .from("imagenes")
    .remove([`marca/${nombre}`]);

  if (error) {
    console.error("Error al eliminar imagen:", error.message);
    return false;
  }

  return true;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////        subirImagenMarca       //////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const subirImagenMarca = async (file) => {
  const nombreArchivo = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("imagenes")
    .upload(`marca/${nombreArchivo}`, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Error al subir imagen:", error.message);
    return null;
  }

  return nombreArchivo;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////        getImagenMarca       //////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const getImagenMarca = (nombreBucket) => {
  if (!nombreBucket) return "";

  const { data } = supabase
    .storage
    .from("imagenes")
    .getPublicUrl(`marca/${nombreBucket}`);

  return data.publicUrl;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////        buscarMarcasPorNombre       //////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const buscarMarcasPorNombre = async (query) => {
  const { data, error } = await supabase
    .from("marca")
    .select(SELECT_MARCA)
    .ilike("marcaimgnombre", `%${query}%`)
    .order("marcaimgnombre");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
};

module.exports = {
  listarMarcas,
  obtenerMarcaPorId,
  actualizarMarcaPorId,
  eliminarMarcaPorId,
  eliminarImagenMarca,
  subirImagenMarca,
  getImagenMarca,
  buscarMarcasPorNombre
};