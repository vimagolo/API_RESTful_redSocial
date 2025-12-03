//Importar dependecnia y modulos 
const bcrypt = require("bcrypt")
const User = require("../models/user")
const createToken = require("../service/jwt");
const followService=require("../service/followUserIds")
const path = require('path');
const fs = require("fs");
const Follow = require("../models/follow")
const Publication = require("../models/publication")
const validate= require("../helpers/validate");


//Acciones de prueba
const pruebaUser = (req, res) =>{
    return res.status(200).send({
        message:"Mensaje enviado desde: controller/user.js"
    });
}

//Metodo de registro de usuarios
const register = async (req, res) => {
    try {
        //Recoger datos de la peticion
        let params = req.body;

        //Comporbar que te llegan bien
        if (!params.name || !params.email || !params.password || !params.nick) {
            return res.status(400).send({
                status: "error",
                message: "Faltan datos por enviar",
            });
        }

        //Validacion avanzada
        validate(params);

        //Control de usuarios duplicados
        const existingUsers = await User.find({
            $or: [
                { email: new RegExp(`^${params.email}$`, 'i') },
                { nick: new RegExp(`^${params.nick}$`, 'i') }
                //^${params.email}$
                // //^ → Significa "el inicio de la cadena".
                // //${params.email} → Inserta el valor del email que el usuario está intentando registrar.
                // //$ → Significa "el final de la cadena".`
                //'i' → Bandera de insensibilidad a mayúsculas y minúsculas
            ]
        });

        if (existingUsers.length > 0) {
            return res.status(400).send({
                status: "error",
                message: "El email o el nick ya están en uso"
            });
        }

        // Normalizar email y nick a minúsculas
        params.email = params.email.toLowerCase();
        params.nick = params.nick.toLowerCase();

        //Cifrar la contraseña
        const saltRounds = 10;
        params.password = await bcrypt.hash(params.password, saltRounds);

        //Crear objeto de un usuario
        let userToSave = new User(params)

        //Guardar Usuario en la base de datos
        const userStored = await userToSave.save();

        if (!userStored) {
            return res.status(500).send({
                status: "error",
                message: "El usuario no se ha guardado correctamente"
            });
        }

        return res.status(200).send({
            status: "success",
            message: "Usuario registrado correctamente",
            user: {
                id: userStored._id,
                name: userStored.name,
                email: userStored.email,
                nick: userStored.nick
                // No incluir la contraseña por seguridad
            }
        })
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Ha ocurrido un error en el servidor",
            error: error.message  // o puedes no enviarlo si quieres ocultar detalles
        });
    }
};

//Metodo de login de usuarios
const login = async (req, res)=>{
    try{
        //Recoger parametros body
        const params = req.body;

        //Comporbar que te llegan bien
        if (!params.password || !params.email){
            return res.status(400).send({
                status: "error",
                message: "Faltan datos por enviar",
            });
        };

        //Buscar em la bd si existe
        let email= params.email.toLowerCase();
        const userFind = await User.findOne({email});

        if(!userFind){
            return res.status(400).send({
                status: "error",
                message: "El email no está registrado"
            });
        }

        //Comprobar su contraseña
        let pwd = bcrypt.compareSync(params.password, userFind.password);

        if (!pwd) {
            return res.status(400).send({
                status: "error",
                message: "No te has identificado correctamente"
            });
        }

        //Conseguir el Token
        const token = createToken.createToken(userFind);

        //Devolver datos de usuario
        return res.status(200).send({
            status: "success",
            mensaje: "Acción de login",
            user: {
                id: userFind._id,
                name: userFind.name,
                email: userFind.email,
                nick: userFind.nick
                // No incluir la contraseña por seguridad
            },
            token
        });        
    } catch (error){
        return res.status(500).send({
            status: "error",
            message: "Ha ocurrido un error en el servidor",
            error: error.message  // o puedes no enviarlo si quieres ocultar detalles
        });
    }
}


//Metodo para mostrar todos los datos de usuario
const profile = async (req, res) => {
    try {
        //Recibir el parametro del id de usuario por la url 
        const id =req.params.id;
        
        //Consulta para sacar los datos del usuario
        let user = await User.findById(id).select("-password -__v -role");

        if(!user){
            return res.status(400).send({
                status: "error",
                message: "Usuario no encontrado"
            })
        }

        //Info de seguimiento 
        const followInfo = await followService.followThisUser(req.user.id, id)
        
        //Devolver el resultado
        return res.status(200).send({
            status: "success",
            user,
            following: followInfo.following,
            follower: followInfo.follower
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Ha ocurrido un error en el servidor",
            error: error.message  // o puedes no enviarlo si quieres ocultar detalles
        });
    }
}

//Metodo para mostrar todos los datos de usuario
const list = async (req , res)=>{
    try {
        //Controlar en que pagina estamos
        let page = 1;
        if (req.params.page) {
            page = req.params.page;
        }
        page = parseInt(page);

        //Consultar con moogose pagination
        let itemsPerPage = 3;
        //let users = await User.find().sort('_id').paginate(page,  itemsPerPage);
        const users = await User.paginate({}, { page, limit: itemsPerPage, sort: { _id: -1 } });
        
        if (!users) {
            return res.status(500).send({
                status: "error",
                message: "Ha ocurrido un error en el servidor",
            })
        }

        //Devolver el resultado(TODO info de follow)
        const followUserIds = await followService.followUserIds(req.user.id);

        //Devolver el resultado
        return res.status(200).send({
            status: "success",
            message: "Ruta de listado de usuarios",
            page: users.page,
            totalPages: users.totalPages,
            totalDocs: users.totalDocs,
            users: users.docs,
            user_following : followUserIds.following,
            use_follow_me: followUserIds.followers
        })
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Ha ocurrido un error en el servidor",
            error: error.message
        })
    }
}

// Método para actualizar los datos del usuario autenticado
const update = async (req, res) => {
    try {
        // Clonamos la identidad del usuario que hace la petición (protegido por middleware de autenticación)
        const userIdentity = { ...req.user };

        // Obtenemos los nuevos datos del usuario que quiere actualizar
        const userToUpdate = { ...req.body };

        // Eliminamos campos que no deben ser actualizados directamente
        delete userToUpdate.role;
        delete userToUpdate.iat;
        delete userToUpdate.exp;
        delete userToUpdate.image;

        // Si el usuario quiere actualizar la contraseña, la ciframos antes de guardarla
        if (userToUpdate.password) {
            const saltRounds = 10;
            userToUpdate.password = await bcrypt.hash(userToUpdate.password, saltRounds);
        }

        // Verificamos si ya existe otro usuario con el mismo email o nick (insensible a mayúsculas/minúsculas)
        const existingUsers = await User.find({
            $or: [
                { email: new RegExp(`^${userToUpdate.email}$`, 'i') },
                { nick: new RegExp(`^${userToUpdate.nick}$`, 'i') }
            ]
        });

        // Creamos una bandera para verificar si hay un conflicto con otro usuario
        let userIsset = false;

        // Recorremos los usuarios encontrados para verificar si alguno NO es el mismo usuario autenticado
        existingUsers.forEach(user => {
            // Si encontramos otro usuario con ese email o nick (que no sea el mismo que se está actualizando)
            if (user && user.id !== userIdentity.id) {
                userIsset = true; // Hay conflicto, el email o nick ya están en uso por otro usuario
            }
        });

        // Si hay conflicto, respondemos con error
        if (userIsset) {
            return res.status(409).json({
                status: "error",
                message: "El email o el nick ya están en uso por otro usuario"
            });
        }

        // Si no hay conflicto, buscamos el usuario por ID y lo actualizamos con los nuevos datos
        const updatedUser = await User.findByIdAndUpdate(
            userIdentity.id,   // ID del usuario autenticado
            userToUpdate,      // Nuevos datos
            { new: true }      // Opción para devolver el documento actualizado
        );

        // Si no se encuentra el usuario (caso muy raro), devolvemos error
        if (!updatedUser) {
            return res.status(404).json({
                status: "error",
                message: "Usuario no encontrado"
            });
        }

        // Todo salió bien, respondemos con el usuario actualizado
        return res.status(200).json({
            status: "success",
            message: "Usuario actualizado correctamente",
            userToUpdate: userToUpdate,
            user: updatedUser
        });

    } catch (error) {
        // Si ocurre algún error inesperado, lo capturamos y respondemos con error del servidor
        return res.status(500).json({
            status: "error",
            message: "Error al actualizar usuario",
        });
    }
}

// Método para subir imagenes
const upload = async (req, res) => {
    try {
        //Recoger el fichero de imahen y comprabar que existe
        if (!req.file) {
            return res.status(300).send({
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

        // Obtener el ID del artículo a actualizar
        const articuloID = req.user.id;

        //Si si es correcto, guardar imagen en bd
        const articuloActualizado = await User.findByIdAndUpdate(
            { _id: articuloID },
            { image: req.file.filename },
            { new: true }
        )

         // Validar si se encontró y actualizó el artículo
        if (!articuloActualizado) {
            return res.status(404).json({
                status: "error",
                mensaje: "No se encontró el artículo",
            });
        }

        //Devolver respuetsa
        return res.status(200).send({
            status: "success",
            message: "Subida de imagen desde usercontroler",
            file: articuloActualizado
        })
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error de servidor",
            error:error
        })
    }
}

// Metodo para servir la imagen de un usuario (avatar)
const avatar = async (req, res) => {
    try {
        // Obtener el nombre del archivo desde los parámetros de la URL
        const file = req.params.file;

        //Construir la ruta completa al archivo de imagen dentro del servidor
        const filePath = "./uploads/avatars/"+file;

        //Comprobar que el archivo existe usando fs.stat
            /**
             * fs.stat(Información del archivo) revisa si el archivo existe y obtiene información sobre él.
             * - Si el archivo no existe o hay error al acceder (ej. permiso denegado), `err` tendrá un valor.
             * - `stats` contiene detalles del archivo (tamaño, si es directorio, si es archivo regular, etc).
             * En este caso, queremos asegurarnos de que:
             * - No haya error (`err === null`)
             * - Y que el archivo sea un archivo regular (no un directorio), usando `stats.isFile()`
             */
        fs.stat(filePath,(err, stats)=>{
            // Si hay error o no es un archivo normal, respondemos con 404 (no encontrado)
            if (err || !stats.isFile()) {
                return res.status(404).send({
                    status: "error",
                    message: "No existe la imagen"
                });
            }

            // Si el archivo existe, lo devolvemos al cliente con sendFile
            // `path.resolve` convierte la ruta relativa a absoluta (obligatorio para sendFile)
            return res.sendFile(path.resolve(filePath));
        });

    } catch (error) {
        //Si ocurre cualquier otro error inesperado, devolver error 500 (interno del servidor)
        return res.status(500).send({
            status: "error",
            message: "Error de servidor"
        })
    }
}


const counters = async(req , res) =>{
    try {
        let userId =req.user.id;

        if(req.params.id){
            userId= req.params.id;
        }

        const following = await Follow.countDocuments({"user":userId});

        const followed= await Follow.countDocuments({"followed":userId});

        const publications = await Publication.countDocuments({"user":userId});

        return res.status(200).send({
            userId,
            following:following,
            followed:followed,
            publications:publications
        })

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "No se han podido listar los conteos: " + error
        });  
    }
}



//Exportar acciones
module.exports={
    pruebaUser,
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar,
    counters
}