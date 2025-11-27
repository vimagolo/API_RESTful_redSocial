const express = require("express");
const router = express.Router();
const check = require("../middlewares/auth")

const FollowController = require("../controllers/follow");

//Definimos las rutas
router.get("/prueba-follow", FollowController.pruebaFollow);
router.post("/savefollow", check.auth ,FollowController.savefollow);
router.post("/unfollow/:id", check.auth ,FollowController.unfollow);
router.get("/following/:id", check.auth ,FollowController.following);
router.get("/followers/:id", check.auth ,FollowController.followers);
router.get("/following/:id/:page", check.auth ,FollowController.following);
router.get("/followers/:id/:page", check.auth ,FollowController.followers);

//Exportar router
module.exports = router;