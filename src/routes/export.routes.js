const express = require("express");
const router = express.Router();

const {
  exportarTodosCSV,
  exportarBaseDeDatosGorrioncito
} = require("../controllers/export.controller");

router.get("/csv", exportarTodosCSV);
router.get("/backup", exportarBaseDeDatosGorrioncito);

module.exports = router;