const express = require("express");
const router = express.Router();

const { exportarCSVCompletoCategoria } = require("../controllers/categoria.controller");

router.get("/exportarCSVCompletoCategoria", exportarCSVCompletoCategoria);

module.exports = router;
