const Publication = require("../models/publication")
const path = require("path");  //Sirve para manejar rutas de archivos y directorios de forma segura y compatible entre sistemas operativos (Windows, Linux, etc.).
const fs = require("fs");  //Permite leer, escribir, borrar o modificar archivos en el sistema de archivos del servidor.
const followService = require("../service/followUserIds")

//Acciones de prueba
const pruebaPublication = (req, res) =>{
    return res.status(200).send({
        message:"Mensaje enviado desde: controller/publication.js"
    });
}


// Controlador para guardar publicaciones
const savePublication = async (req, res) => {
    try {
        // Validar que el cuerpo existe y contiene el campo "text"
        if (!req.body || !req.body.text) {
            return res.status(400).send({
                status: "error",
                message: "Debes enviar el texto de la publicación en el cuerpo (body) de la solicitud."
            });
        }

        //Recoger los datos que llegan en el cuerpo de la petición HTTP (body)
        const params = req.body;


        //Crear un nuevo objeto del modelo Publication con los datos recibidos
        let newPublication = new Publication(params);

        //Asignar el ID del usuario autenticado al campo "user" de la publicación
        // Esto asegura que la publicación está asociada a quien la crea
        newPublication.user = req.user.id;

        //Guardar el objeto en la base de datos
        const publicationSaved = await newPublication.save();

        // 6. Verificar que la publicación se haya guardado correctamente
        if (!publicationSaved) {
            return res.status(400).send({
                status: "error",
                message: "La publicación no se ha guardado."
            });
        }

        //Hacer una nueva búsqueda para traer la publicación recién guardada,
        // pero esta vez usando "populate" para obtener los datos completos del usuario relacionado
        // Se excluyen campos sensibles del usuario como "password", "__v" y "role"
        const populatedPublication = await Publication.findById(publicationSaved._id)
            .populate("user", "-password -__v -role");

        //Devolver respuesta de éxito con la publicación y los datos completos del usuario
        return res.status(200).send({
            status: "success",
            message: "Publicación guardada correctamente.",
            publication: populatedPublication
        });

    } catch (error) {
        //Si ocurre algún error inesperado, devolver un error 500 (Internal Server Error)
        return res.status(500).send({
            status: "error",
            message: "Error del servidor.",
            error: error.message || error
        });
    }
}


// Controlador para obtener una publicación específica por su ID
const getPublication = async (req, res) => {
    try {
        //Obtener el ID de la publicación desde los parámetros de la URL
        const publicationId = req.params.id;

        //Verificar que se haya proporcionado un ID válido
        if (!publicationId) {
            return res.status(400).send({
                status: "error",
                message: "Debe proporcionar un ID de publicación válido."
            });
        }

        //Buscar la publicación en la base de datos por su ID
        // Usamos .populate() para obtener también los datos del usuario que la creó
        const publication = await Publication.findById(publicationId)
            .populate("user", "-password -__v -role"); // Excluir campos sensibles del usuario

        //Si no se encuentra la publicación, devolver un error 404
        if (!publication) {
            return res.status(404).send({
                status: "error",
                message: "No se ha encontrado la publicación."
            });
        }

        //Devolver la publicación encontrada
        return res.status(200).send({
            status: "success",
            message: "Publicación encontrada correctamente.",
            publication
        });

    } catch (error) {
        //Si ocurre algún error inesperado, devolver un error 500 (Internal Server Error)
        return res.status(500).send({
            status: "error",
            message: "Error del servidor.",
            error: error.message || error
        });
    }
};


// Controlador para eliminar una publicación
const deletePublication = async (req, res) => {
    try {
        //Obtener el ID de la publicación desde los parámetros de la URL
        const publicationId = req.params.id;

        //Verificar que se haya proporcionado un ID válido
        if (!publicationId) {
            return res.status(400).send({
                status: "error",
                message: "Debe proporcionar un ID de publicación válido."
            });
        }

        //Buscar y eliminar la publicación solo si pertenece al usuario autenticado
        const publicationDeleted = await Publication.findOneAndDelete({
            _id: publicationId,
            user: req.user.id // Solo puede borrar su propia publicación
        });

        //Si no se encuentra la publicación o no pertenece al usuario, mostrar error
        if (!publicationDeleted) {
            return res.status(404).send({
                status: "error",
                message: "No se ha encontrado la publicación o no tienes permiso para eliminarla."
            });
        }

        //Devolver la publicación eliminada como respuesta
        return res.status(200).send({
            status: "success",
            message: "Publicación eliminada correctamente.",
            publication: publicationDeleted
        });

    } catch (error) {
        //Si ocurre un error inesperado, devolver un error 500 (Error del servidor)
        return res.status(500).send({
            status: "error",
            message: "Error del servidor.",
            error: error.message || error
        });
    }
};

// Controlador para listar todas las publicaciones de un usuario con paginación
const getUserPublications = async (req, res)=> {
    try {
        // Verificar que se proporcione el ID del usuario en los parámetros
        if (!req.params.id) {
            return res.status(400).send({
                status: "error",
                message: "El ID del usuario es obligatorio.",
            });
        }

        const userId = req.params.id;
        
        // Obtener número de página desde los parámetros, o usar 1 por defecto
        let page = 1
        if(req.params.page) page= req.params.page

        const itemPerPage = 5;
        
         // Realizar la consulta paginada a la base de datos
        const userPublications = await Publication.paginate(
            {user: userId},  // Filtrar por el ID del usuario
            {
                page: page, 
                limit : itemPerPage, 
                sort:{create_at:-1},  // Ordenar por fecha de creación descendente
                populate:{
                    path:"user", // Rellenar datos del usuario en cada publicación
                    select:"-password -role -__v -create_at " // Excluir campos sensibles
                }
            }
        )

        // Comprobar si se encontraron publicaciones
        if (!userPublications || userPublications.docs.length === 0) {
            return res.status(404).send({
                status: "success",
                message: "Este usuario no tiene publicaciones.",
                userPublications: []
            });
        }
        
        // Devolver respuesta exitosa con los datos paginados
        return res.status(200).send({
            status:"success",
            message:"userPublications",
            userPublications
        })
    } catch (error) {
         //Si ocurre un error inesperado, devolver un error 500 (Error del servidor)
        return res.status(500).send({
            status: "error",
            message: "Error del servidor.",
            error: error.message || error
        });
    }
}

//Controlador para subir imagenes a una publicacion 
const uploadImgPublications = async (req, res) => {
    try {

        // Verificar que se proporcione el ID de la publicacion en los parámetros
        if (!req.params.id) {
            return res.status(400).send({
                status: "error",
                message: "El ID del usuario es obligatorio.",
            });
        }
        const publicationId = req.params.id;


        //Recoger el fichero de imagen y comprabar que existe
        if (!req.file) {
            return res.status(400).send({
                status: "error",
                message: "La petición no incluye ningun archivo"
            })
        }
    
        //Conseguir el nombre del archivo
        //Sacar la ectension del archivo
        const archivo_extension = path
            .extname(req.file.originalname)
            .toLowerCase()
            .replace(".", "");

        //Comprobar extension
        const extensionesPermitidas = ["png", "jpg", "jpeg", "gif"];
        if (!extensionesPermitidas.includes(archivo_extension)) {
            // Borrar el archivo si no es una imagen válida
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.error("Error al borrar el archivo inválido:", err);
                }
                return res.status(400).json({
                    status: "error",
                    mensaje: "Extensión de archivo no válida. Solo se permiten imágenes.",
                });
            });
            return; // Muy importante: detener aquí
        }

        // Obtener el ID del usuario  identifcado
        const userIdentity = req.user.id;

        //Si si es correcto, guardar imagen en bd
        const imgPublication = await Publication.findByIdAndUpdate(
            { "user": userIdentity, "_id":publicationId},
            { file: req.file.filename },
            { new: true }
        )

         // Validar si se encontró y actualizó el artículo
        if (!imgPublication) {
            return res.status(404).json({
                status: "error",
                mensaje: "No se encontró el artículo",
            });
        }

        
        return res.status(200).send({
            status: "success",
            message: "Subida de imagen desde usercontroler",
            file: imgPublication
        })
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error de servidor",
            error: error.message || error,
            publicationId
        })
    }
}


//Controlador para devolver archivos multimedia de publicaciones
const getPublicationImage = async (req, res) =>{
    try {
        //Sacar el parametro de la url
        const file = req.params.file
        
        //Montar el path real de la imgagen
        //const filePath = "./uploads/imgPublications/"+file;
        const filePath = path.join(__dirname, "../uploads/publications", file);
        //__dirname Es una variable global en Node.js que representa el directorio actual del archivo que se está ejecutando.
        
        //Comporbar que el archivo existe
        fs.stat(filePath, (err, stats) => {
            if (err) {
                return res.status(404).send({
                    status:"error",
                    menssage:"No existe la imagen"
                });
            }
            //devolver un file
            return res.sendFile(path.resolve(filePath))
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Error del servidor al subir la imagen"+error
        });  
    }
}

//Controlador para listar publicaciones de un suario que estoy siguiendo
const followingPublication = async (req ,res) =>{
    try {
        //Sacar la pagina actual
        let page = 1;
        if(req.params.page){
            page= parseInt(req.params.page);
        };

        const itemsPerPage =5

        //Sacar un array de identificadores de usuarios que sigo como usuario logueado
        const myFollows = await followService.followUserIds(req.user.id)
        const followingUsers = Array.isArray(myFollows.following) ? myFollows.following : [];
        //Verifica si myFollows.following es un array válido usando Array.isArray(...).
        //Si sí es un array, lo asigna a followingUsers.
        //Si no lo es (por ejemplo, es undefined, null, o un objeto no iterable), asigna un array vacío [] para evitar errores después.
        
        ////Find a publicaciones in, ordenas , popular, paginar
        const publications = await Publication.paginate(
            {user:followingUsers},
            {
                page:page,
                limit:itemsPerPage,
                sort: { created_at: -1 },
                populate: { path: "user", select: "-password -role -__v -email" }
            }
        )

        return res.status(200).send({
            myFollows: myFollows.following,
            publications:publications,
            followingUsers:followingUsers,
            status: "success",
            message: "Feed fr publicaciones"
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error de servidor",
            error: error.message || error,
        })
    }
}

//Exportar acciones
module.exports={
    pruebaPublication,
    savePublication,
    getPublication,
    deletePublication,
    getUserPublications,
    uploadImgPublications,
    getPublicationImage,
    followingPublication
}