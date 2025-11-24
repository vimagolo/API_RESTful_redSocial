const express = require("express");
const router = express.Router();
const check = require("../middlewares/auth")

const UserController = require("../controllers/user");

//Definimos las rutas
router.get("/prueba-usuario",check.auth ,UserController.pruebaUser);
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/profile/:id",check.auth ,UserController.profile);
router.get("/list",check.auth ,UserController.list);
router.get("/list/:page",check.auth ,UserController.list);

//Exportar router
module.exports = router;