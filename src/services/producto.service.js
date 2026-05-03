const { supabase } = require("../config/supabase");
const { insertarArchivoAStorage,
   eliminarArchivoDeStorage } = require("./storage.service.js");

const SELECT_PRODUCTO = `
  prdcid,
  prdcimgnombre,
  prdcimgnombrebucket,
  prdcprecio,
  ctgraid,
  marcaid
`;

// ================= listarProductosPaginacion =================
const listarProductosPaginacion = async (pagina, limite) => {
  const desde = (pagina - 1) * limite;
  const hasta = desde + limite - 1;

  const { data, error } = await supabase
    .from("producto")
    .select(SELECT_PRODUCTO)
    .order("prdcid", { ascending: true })
    .range(desde, hasta);

  if (error) {
    console.error("Error:", error);
    return [];
  }

  return data;
};

// ================= listarProductos =================
const listarProductos = async () => {
  let todos = [];
  let offset = 0;
  const limite = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("producto")
      .select(SELECT_PRODUCTO)
      .order("prdcid", { ascending: true })
      .range(offset, offset + limite - 1);

    if (error) {
      console.error("Error al listar productos:", error.message);
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


// ================= obtenerProductoPorId =================
const obtenerProductoPorId = async (id) => {
  const { data, error } = await supabase
    .from("producto")
    .select(SELECT_PRODUCTO)
    .eq("prdcid", id)
    .single();

  if (error) {
    console.error("Error al listar producto por ID:", error);
    return null;
  }

  return data;
};

// ================ crearProducto =================
const crearProducto = async (producto, imagenFile) => {
  try {
    let prdcimgnombre = null;
    let prdcimgnombrebucket = null;

    // 🖼️ 1. SUBIR IMAGEN PRIMERO
    if (imagenFile) {
      const resultadoUpload = await insertarArchivoAStorage(
        "imagenes/producto",
        imagenFile
      );  

      if (!resultadoUpload) {
        console.error("Error al subir imagen");
        return null;
      }

      prdcimgnombre = imagenFile.name;
      prdcimgnombrebucket = resultadoUpload;
    }

    // 🧱 2. INSERTAR PRODUCTO EN BD
    const nuevoProducto = {
      prdcimgnombre,
      prdcimgnombrebucket,
      prdcprecio: producto.prdcprecio,
      ctgraid: producto.ctgraid,
      marcaid: producto.marcaid,
    };

    const { data, error } = await supabase
      .from("producto")
      .insert(nuevoProducto)
      .select()
      .single();

    if (error) {
      console.error("Error al crear producto:", error.message);

      // 🧹 rollback seguro
      if (prdcimgnombrebucket) {
        await eliminarArchivoDeStorage(
          "imagenes/producto",
          prdcimgnombrebucket
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

// ================= actualizarProductoPorId =================
// const actualizarProductoPorId = async (id, producto, nuevaImagen) => {
//   try {
//     const productoActual = await obtenerProductoPorId(id);

//     if (!productoActual) {
//       console.error("Producto no encontrado");
//       return null;
//     }

//     let nombreBucket = producto.prdcimgnombrebucket;

//     // 🖼️ reemplazo de imagen
//     if (nuevaImagen) {
//       if (productoActual.prdcimgnombrebucket) { 
//         await eliminarArchivoDeStorage(
//           `imagenes/producto/${productoActual.prdcimgnombrebucket}`
//         );
//       }

//       const nuevoNombre = await subirImagenProducto(nuevaImagen);

//       if (!nuevoNombre) {
//         console.error("Error al subir nueva imagen");
//         return null;
//       }

//       nombreBucket = nuevoNombre;
//     }

//     const updateData = {};

//     if (producto.prdcimgnombre !== undefined)
//       updateData.prdcimgnombre = producto.prdcimgnombre;

//     if (nombreBucket !== undefined)
//       updateData.prdcimgnombrebucket = nombreBucket;

//     if (producto.prdcprecio !== undefined)
//       updateData.prdcprecio = producto.prdcprecio;

//     if (producto.ctgraid !== undefined)
//       updateData.ctgraid = producto.ctgraid;

//     if (producto.marcaid !== undefined)
//       updateData.marcaid = producto.marcaid;

//     if (Object.keys(updateData).length === 0) {
//       console.warn("No hay datos para actualizar");
//       return null;
//     }

//     const { data, error } = await supabase
//       .from("producto")
//       .update(updateData)
//       .eq("prdcid", id)
//       .select()
//       .single();

//     if (error) {
//       console.error("Error al actualizar producto:", error.message);
//       return null;
//     }

//     return data;

//   } catch (err) {
//     console.error("Error general:", err);
//     return null;
//   }
// };

// ================= eliminarProductoPorId =================
const eliminarProductoPorId = async (id) => {
  if (!id) return false;

  try {
    const { data: producto, error: fetchError } = await supabase
      .from("producto")
      .select("prdcimgnombrebucket")
      .eq("prdcid", id)
      .single();

    if (fetchError || !producto) {
      console.error("Error al obtener producto:", fetchError?.message);
      return false;
    }

    const imagenPath = `producto/${producto.prdcimgnombrebucket}`;

    const { error: storageError } = await supabase.storage
      .from("imagenes")
      .remove([imagenPath]);

    if (storageError) {
      console.error("Error al eliminar imagen:", storageError.message);
      return false;
    }

    const { error: deleteError } = await supabase
      .from("producto")
      .delete()
      .eq("prdcid", id);

    if (deleteError) {
      console.error("Error al eliminar producto:", deleteError.message);
      return false;
    }

    return true;

  } catch (err) {
    console.error("Error general:", err);
    return false;
  }
};


// ================= getImagenProducto =================
const getImagenProducto = (nombreBucket) => {
  if (!nombreBucket) return "";

  const { data } = supabase
    .storage
    .from("imagenes")
    .getPublicUrl(`producto/${nombreBucket}`);

  return data.publicUrl;
};

// ================= buscarProductosPorNombre =================
const buscarProductosPorNombre = async (query) => {
  const { data, error } = await supabase
    .from("producto")
    .select(SELECT_PRODUCTO)
    .ilike("prdcimgnombre", `%${query}%`)
    .order("prdcimgnombre");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
};

module.exports = {
  listarProductosPaginacion,
  listarProductos,
  obtenerProductoPorId,
  // actualizarProductoPorId,
  eliminarProductoPorId,
  // subirImagenProducto,
  getImagenProducto,
  buscarProductosPorNombre
};