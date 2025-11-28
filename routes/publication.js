const express = require("express");
const router = express.Router();
const multer = require("multer")
const check = require("../middlewares/auth");

const PublicationController = require("../controllers/publication");

//Configuracion de subida de imagenes
const storage = multer.diskStorage({
    destination:(req, file, cb)=>{
        cb(null,"./uploads/publications");
    },
    filename:(req, file,cb)=>{
        cb(null,"pub-"+Date.now()+"-"+file.originalname);
    }
})

const uploads = multer({storage})

//Definimos las rutas
router.get("/prueba-publication", PublicationController.pruebaPublication);
router.post("/save", check.auth,PublicationController.savePublication);
router.get("/getPublication/:id", check.auth,PublicationController.getPublication);
router.delete("/deletePublication/:id", check.auth,PublicationController.deletePublication);
router.get("/getPublications/:id", check.auth,PublicationController.getUserPublications);
router.get("/getPublications/:id/page", check.auth,PublicationController.getUserPublications);
router.post("/upload/:id", [check.auth ,uploads.single("file0")],PublicationController.uploadImgPublications);
router.get("/getImagePublication/:file",[check.auth ,uploads.single("file0")],PublicationController.getPublicationImage);
router.get("/getFollowinPublication",check.auth ,PublicationController.followingPublication);
router.get("/getFollowinPublication/:page",check.auth ,PublicationController.followingPublication);


//Exportar router
module.exports = router;