const express = require("express");
const router = express.Router();

const PublicationController = require("../controllers/publication");

//Definimos las rutas
router.get("/prueba-publication", PublicationController.pruebaPublication);

//Exportar router
module.exports = router;