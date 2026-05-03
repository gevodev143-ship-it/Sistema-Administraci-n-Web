const express = require("express");
const router = express.Router();

const { exportarPorCarpeta } = require("../controllers/storage.controller");

router.get("/exportarCarpeta/:tipo", exportarPorCarpeta);

module.exports = router;        