//Importamos modelos
const { populate } = require("../../../api-rest-red-social/models/follow");
const Follow = require("../models/follow");
const User  = require("../models/user");
const followService = require("../service/followUserIds");

//Acciones de prueba
const pruebaFollow = (req, res) =>{
    return res.status(200).send({
        message:"Mensaje enviado desde: controller/follow.js"
    });
}

// Método para guardar un "follow" (seguir a otro usuario)
const savefollow = async (req, res) => {
    try {
        // Obtener los datos enviados en el cuerpo de la petición
        const params = req.body


        // Obtener la identidad del usuario autenticado (extraída por middleware JWT)
        const identity = req.user


        // Verificar que se haya enviado el ID del usuario a seguir
        if (!params.followed) {
            return res.status(400).send({
                status: "error",
                message: "El ID del usuario a seguir es obligatorio"
            });
        }


        // Evitar que un usuario se siga a sí mismo
        if (params.followed === identity.id) {
            return res.status(400).send({
                status: "error",
                message: "No puedes seguirte a ti mismo"
            });
        }

        // Comprobar si ya existe una relación de follow entre los usuarios
        const existingFollow = await Follow.findOne({
             user: identity.id,          // El que sigue
             followed: params.followed   // El que está siendo seguido
        });       


        // Crear un nuevo objeto Follow con los datos correspondientes
        if (existingFollow) {
            return res.status(400).send({
                status: "error",
                message: "Ya sigues a este usuario"
            });
        }

        // Crear un nuevo objeto Follow con los datos correspondientes
        let userToFollow = new Follow({
            user: identity.id,          // Usuario autenticado
            followed: params.followed   // Usuario al que quiere seguir
        });

        // Guardar la relación en la base de datos
        const follow = await userToFollow.save();

        // Verificar que se haya guardado correctamente
        if (!follow) {
            return res.status(500).send({
                status: "error",
                message: "No se pudo guardar el seguimiento"
            });
        }
        
        // Devolver una respuesta de éxito con el objeto follow guardado
        return res.status(200).send({
            status: "success",
            message: "Follow guardado",
            follow
        });

    } catch (error) {
        // Capturar y manejar errores del servidor
        return res.status(500).send({
            status: "error",
            message: "Error de servidor"
        });
    }
}


// Método para dejar de seguir a un usuario (unfollow)
const unfollow = async (req, res) => {
    try {
        // Obtener el ID del usuario autenticado (quien quiere dejar de seguir)
        const userId = req.user.id;

        // Obtener el ID del usuario al que se desea dejar de seguir (desde los parámetros de la URL)
        const followedId = req.params.id;

        // Verificar que el ID del seguido esté presente
        if(!followedId){
            return res.status(400).send({
                status:"error",
                message:"El ID del usuario a dejar de seguir es obligatorio"
            })
        }

        // Buscar y eliminar la relación de follow en la base de datos
        const deletedFollow = await Follow.findOneAndDelete({
            user: userId,
            followed: followedId
        })

        // Comprobar si se encontró y eliminó la relación
        if(!deletedFollow){
            return res.status(400).send({
                status:"error",
                message: "No estás siguiendo a este usuario"
            })
        }

        // Devolver una respuesta de éxito
        return res.status(200).send({
            status: "success",
            message: "Has dejado de seguir al usuario correctamente",
            follow: deletedFollow
        });

    } catch (error) {
        // Capturar errores inesperados del servidor
        return res.status(500).send({
            status: "error",
            message: "Error de servidor"
        });
    }
}


// Acción para obtener el listado de usuarios que un usuario está siguiendo
const following = async (req, res) => {
    try {
        // Obtener el ID del usuario autenticado desde el token JWT (req.user viene del middleware de autenticación)
        let userId = req.user.id

        // Si se proporciona un ID de usuario como parámetro en la URL, lo usamos en lugar del autenticado
        if(req.params.id) userId = req.params.id;

        // Obtener el número de página desde los parámetros de la URL. Si no se proporciona, se usa la página 1 por defecto
        let page = 1;
        
        if(req.params.page) page = req.params.page;

        // Definir cuántos elementos (usuarios seguidos) se mostrarán por página
        const itemPerPage =5;

        // Buscar los documentos en la colección Follow usando paginate:
        // - Filtros: buscar todos los follows del usuario especificado
        // - populate: reemplazar los IDs de 'user' y 'followed' por los datos reales de esos usuarios
        // - sort: ordenar los resultados por el ID en orden descendente
        const follows = await Follow.paginate(
            { user: userId },
            {
                page,
                limit:itemPerPage,
                populate:[
                    { path: 'user', select: '-password -__v -role' },     // Quitar datos sensibles del usuario
                    { path: 'followed', select: '-password -__v -role' }  // Quitar datos sensibles del seguido
                ],
                sort:{ _id: -1 }
            }
        )


        // Obtener dos arrays:
        // - Usuarios que sigue el usuario autenticado
        // - Usuarios que siguen al usuario autenticado
        let followUserIds = await followService.followUserIds(req.user.id);

        // Enviar la respuesta con todos los datos relevantes
        return res.status(200).send({
            follows: follows,                          // Resultado completo de la paginación
            status: "success",                         // Estado de la respuesta
            message: "Listado de usuarios que estoy siguiendo", // Mensaje descriptivo
            //identity: req.user,                        // Información del usuario autenticado
            users: follows.docs,                       // Solo los documentos paginados
            totalPages: follows.totalPages,            // Número total de páginas
            totalDocs: follows.totalDocs,              // Número total de documentos encontrados
            user_following: followUserIds.following,   // IDs de usuarios que sigo
            user_follow_me: followUserIds.followers    // IDs de usuarios que me siguen
        });

    } catch (error) {
        // Si ocurre un error, se muestra por consola y se responde con un error de servidor
        console.error("Error en following:", error);
        return res.status(500).send({
            status: "error",
            message: "Error de servidor"
        });
    }
}



//Acción listado de usuarios que siguen a culaquier usuario
const followers = async (req, res) => {
    try {
        // Obtener el ID del usuario autenticado desde el token JWT (req.user viene del middleware de autenticación)
        let userId = req.user.id

        // Si se proporciona un ID de usuario como parámetro en la URL, lo usamos en lugar del autenticado
        if(req.params.id) userId= req.params.id;

        // Obtener el número de página desde los parámetros de la URL. Si no se proporciona, se usa la página 1 por defecto
        let page=1
        if (req.params.page) page = req.params.page;

        // Definir cuántos elementos (usuarios seguidos) se mostrarán por página
        const itemsPerPage = 5;

        // Buscar los documentos en la colección Follow usando paginate:
        // - Filtros: buscar todos los follows del usuario especificado
        // - populate: reemplazar los IDs de 'user' y 'followed' por los datos reales de esos usuarios
        // - sort: ordenar los resultados por el ID en orden descendente
        const followers = await Follow.paginate(
            { followed: userId },
            {
                page,
                limit: itemsPerPage,
                populate: [
                    { path: 'user', select: '-password -__v -role' },     // Quitar datos sensibles del usuario
                    { path: 'followed', select: '-password -__v -role' }  // Quitar datos sensibles del seguido
                ],
                sort: { _id: -1 }
            }
        )

        let followUserIds = await followService.followUserIds(req.user.id);

        return res.status(200).send({
            followers: followers,                          // Resultado completo de la paginación
            status: "success",                         // Estado de la respuesta
            message: "Listado de usuarios que estoy siguiendo", // Mensaje descriptivo
            identity: req.user,                        // Información del usuario autenticado
            users: followers.docs,                       // Solo los documentos paginados
            totalPages: followers.totalPages,            // Número total de páginas
            totalDocs: followers.totalDocs,              // Número total de documentos encontrados
            user_following: followUserIds.following,   // IDs de usuarios que sigo
            user_follow_me: followUserIds.followers  
        })
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error de servidor",
            error: error
        })
    }
}


//Exportar acciones
module.exports={
    pruebaFollow,
    savefollow,
    unfollow,
    following,
    followers
}