const { Parser } = require("json2csv");
const { supabase } = require("../config/supabase");
const { listarProductos,
        crearProducto
      } = require("../services/producto.service");
const { convertirAExcelCSV } = require("../utils/convertToCsv");

// ----------------------------------------------------
// EXPORT archivo CSV
// ----------------------------------------------------
const exportarCSVCompletoProducto = async (req, res) => {
  const productos = await listarProductos();   // 1. obtienes datos
  const csv = convertirAExcelCSV(productos);  

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=producto.csv");

  res.send(csv); // 3. descargas
};

// ----------------------------------------------------
// CREAR PRODUCTO
// ----------------------------------------------------
const crearProductoController = async (req, res) => {
  try {
    const producto = req.body;
    const imagenFile = req.file; // si usas multer

    const resultado = await crearProducto(producto, imagenFile);

    if (!resultado) {
      return res.status(400).json({
        message: "Error al crear producto",
      });
    }

    return res.status(201).json({
      message: "Producto creado correctamente",
      data: resultado,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

module.exports = {
  exportarCSVCompletoProducto,
  crearProductoController
};