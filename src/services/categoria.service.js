const { supabase } = require  ("../config/supabase");

const SELECT_CATEGORIA = `
  ctgraid,
  ctgraimgnombre,
  ctgraimgnombrebucket
`;

// ///////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////     listarCategoriasPaginacion     ////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const listarCategoriasPaginacion = async (pagina, limite) => {
  const desde = (pagina - 1) * limite;
  const hasta = desde + limite - 1;

  const { data, error } = await supabase
    .from("categoria")
    .select(SELECT_CATEGORIA)
    .order("ctgraid", { ascending: true })
    .range(desde, hasta);

  if (error) {
    console.error("Error categoria:", error.message, error);    
    return [];
  }

  return data;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////        crearCategoria       //////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const crearCategoria = async (categoria, imagenFile) => {
  try {
    let ctgraimgnombre = null;
    let ctgraimgnombrebucket = null;

    // 🖼️ 1. SUBIR IMAGEN PRIMERO
    if (imagenFile) {
      const resultadoUpload = await insertarArchivoAStorage(
        "imagenes/categoria",
        imagenFile
      );

      if (!resultadoUpload) {
        console.error("Error al subir imagen");
        return null;
      }

      ctgraimgnombre = imagenFile.name;
      ctgraimgnombrebucket = resultadoUpload;
    }

    // 🧱 2. INSERTAR CATEGORIA EN BD
    const nuevaCategoria = {
      ctgraimgnombre,
      ctgraimgnombrebucket,
    };

    const { data, error } = await supabase
      .from("categoria")
      .insert(nuevaCategoria)
      .select()
      .single();

    if (error) {
      console.error("Error al crear la categoria:", error.message);

      // 🧹 rollback
      if (ctgraimgnombrebucket) {
        await eliminarArchivoDeStorage(
          "imagenes/categoria",
          ctgraimgnombrebucket
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
// ///////////////////////        listarCategorias       /////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const listarCategorias = async () => {
  let todos = [];
  let offset = 0;
  const limite = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("categoria")
      .select(SELECT_CATEGORIA)
      .order("ctgraid", { ascending: true })
      .range(offset, offset + limite - 1);

    if (error) {
      console.error("Error al listar categorías:", error.message);
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
// ////////////////////////        obtenerCategoriaPorId       ///////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const obtenerCategoriaPorId = async (id) => {
  const { data, error } = await supabase
    .from("categoria")
    .select(SELECT_CATEGORIA)
    .eq("ctgraid", id)
    .single();

  if (error) {
    console.error("Error al listar categoria por ID:", error);
    return null;
  }

  return data;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////        actualizarCategoriaPorId       /////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const actualizarCategoriaPorId = async (id, categoria, nuevaImagen) => {
  try {
    const categoriaActual = await obtenerCategoriaPorId(id);

    if (!categoriaActual) {
      console.error("Categoria no encontrado");
      return null;
    }

    let nombreBucket = categoria.ctgraimgnombrebucket;

    if (nuevaImagen) {
      if (categoriaActual.ctgraimgnombrebucket) {
        await eliminarImagenCategoria(categoriaActual.ctgraimgnombrebucket);
      }

      const nuevoNombre = await subirImagenCategoria(nuevaImagen);

      if (!nuevoNombre) {
        console.error("Error al subir nueva imagen");
        return null;
      }

      nombreBucket = nuevoNombre;
    }

    const updateData = {};

    if (categoria.ctgraimgnombre !== undefined)
      updateData.ctgraimgnombre = categoria.ctgraimgnombre;

    if (nombreBucket !== undefined)
      updateData.ctgraimgnombrebucket = nombreBucket;

    if (Object.keys(updateData).length === 0) {
      console.warn("No hay datos para actualizar");
      return null;
    }

    const { data, error } = await supabase
      .from("categoria")
      .update(updateData)
      .eq("ctgraid", id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar categoria:", error.message);
      return null;
    }

    return data;

  } catch (err) {
    console.error("Error general:", err);
    return null;
  }
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////        eliminarCategoriaPorId       ///////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const eliminarCategoriaPorId = async (id) => {
  if (!id) {
    return { ok: false, mensaje: "ID inválido" };
  }

  try {
    const { data: categoria, error: fetchError } = await supabase
      .from("categoria")
      .select("ctgraimgnombrebucket")
      .eq("ctgraid", id)
      .single();

    if (fetchError || !categoria) {
      return { ok: false, mensaje: "No se pudo obtener la categoría" };
    }

    const { error: deleteError } = await supabase
      .from("categoria")
      .delete()
      .eq("ctgraid", id);

    if (deleteError) {
      if (deleteError.code === "23503") {
        return {
          ok: false,
          mensaje: "No puedes eliminar esta categoría porque tiene productos asociados"
        };
      }

      return { ok: false, mensaje: "Error al eliminar la categoría" };
    }

    if (categoria.ctgraimgnombrebucket) {
      const imagenPath = `categoria/${categoria.ctgraimgnombrebucket}`;

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
// ////////////////////////        eliminarImagenCategoria       /////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const eliminarImagenCategoria = async (nombre) => {
  if (!nombre) return false;

  const { error } = await supabase.storage
    .from("imagenes")
    .remove([`categoria/${nombre}`]);

  if (error) {
    console.error("Error al eliminar imagen:", error.message);
    return false;
  }

  return true;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////        subirImagenCategoria       /////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
 const subirImagenCategoria = async (file) => {
  const nombreArchivo = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("imagenes")
    .upload(`categoria/${nombreArchivo}`, file, {
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
// ////////////////////////        getImagenCategoria       //////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const getImagenCategoria = (nombreBucket) => {
  if (!nombreBucket) return "";

  const { data } = supabase
    .storage
    .from("imagenes")
    .getPublicUrl(`categoria/${nombreBucket}`);

  return data.publicUrl;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////        buscarCategoriasPorNombre       ///////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
const buscarCategoriasPorNombre = async (query) => {
  const { data, error } = await supabase
    .from("categoria")
    .select(SELECT_CATEGORIA)
    .ilike("ctgraimgnombre", `%${query}%`)
    .order("ctgraimgnombre");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
};

module.exports = {
  listarCategorias,
  obtenerCategoriaPorId,
  actualizarCategoriaPorId,
  eliminarCategoriaPorId,
  eliminarImagenCategoria,
  subirImagenCategoria,
  getImagenCategoria,
  buscarCategoriasPorNombre
};