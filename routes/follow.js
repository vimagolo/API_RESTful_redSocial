const express = require("express");
const router = express.Router();
const check = require("../middlewares/auth")

const FollowController = require("../controllers/follow");

//Definimos las rutas
router.get("/prueba-follow", FollowController.pruebaFollow);
router.post("/savefollow", check.auth ,FollowController.savefollow);
router.post("/unfollow/:id", check.auth ,FollowController.unfollow);

//Exportar router
module.exports = router;