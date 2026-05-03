const { Parser } = require("json2csv");
const { supabase } = require("../config/supabase");
const { listarMarcas } = require("../services/marca.service");
const { convertirAExcelCSV } = require("../utils/convertToCsv");

// ----------------------------------------------------
// EXPORT archivo CSV
// ----------------------------------------------------
const exportarCSVCompletoMarca = async (req, res) => {
  const marcas = await listarMarcas();   // 1. obtienes datos
  const csv = convertirAExcelCSV(marcas);  // 2. conviertes

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=marca.csv");

  res.send(csv); 
};

module.exports = { exportarCSVCompletoMarca };