//Importamos modelos
const Follow = require("../models/follow");
const User  = require("../models/user")

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


//Exportar acciones
module.exports={
    pruebaFollow,
    savefollow,
    unfollow
}