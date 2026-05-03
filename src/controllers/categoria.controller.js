const { Parser } = require("json2csv");
const { supabase } = require("../config/supabase");
const { listarCategorias } = require("../services/categoria.service");
const { convertirAExcelCSV } = require("../utils/convertToCsv");

// ----------------------------------------------------
// EXPORT archivo CSV
// ----------------------------------------------------
const exportarCSVCompletoCategoria = async (req, res) => {
  const categorias = await listarCategorias();   // 1. obtienes datos
  const csv = convertirAExcelCSV(categorias);  // 2. conviertes

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=categoria.csv");

  res.send(csv); 
};

module.exports = { exportarCSVCompletoCategoria };