const express = require("express");
const router = express.Router();

const {
  exportarCSVCompletoProducto,
  crearProductoController
} = require("../controllers/producto.controller");

router.get("/exportarCSVCompletoProducto", exportarCSVCompletoProducto);
router.post("/crearProducto", crearProductoController);

module.exports = router;
