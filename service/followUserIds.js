const Follow = require("../models/follow");

// Función para obtener los IDs de los usuarios que sigue el usuario autenticado
// y los que lo siguen a él
const followUserIds = async (identityUserId) => {
    try {
        // Buscar todos los documentos donde el usuario autenticado (identityUserId) sigue a otros
        // Solo se selecciona el campo "followed" (el usuario seguido), y se excluye el "_id"
        let following = await Follow.find({ "user": identityUserId })
                                    .select({ "followed": 1, "_id": 0 });


        // Buscar todos los documentos donde el usuario autenticado es seguido por otros
        // Solo se selecciona el campo "user" (el que lo sigue), y se excluye el "_id"
        let followers = await Follow.find({ "followed": identityUserId })
                                    .select({ "user": 1, "_id": 0 });


        // Crear un array limpio solo con los IDs de los usuarios seguidos
        let followingClean = [];
        following.forEach(follow => {
            followingClean.push(follow.followed);
        });

        // Crear un array limpio solo con los IDs de los usuarios que lo siguen
        let followersClean = [];
        followers.forEach(follow => {
            followersClean.push(follow.user);
        });

        // Retornar ambos arrays
        return {
            following: followingClean, // IDs de usuarios que el usuario sigue
            followers: followersClean  // IDs de usuarios que siguen al usuario
        };

    } catch (error) {
        // Si ocurre un error, se devuelve un objeto de error (aunque no es correcto usar res aquí directamente)
        return {
            status: "error",
            message: "Error en el followService",
            error: error.message
        };
    }
}

/**
 * Función para verificar la relación de seguimiento entre dos usuarios.
 * 
 * @param {String} identityUserId - ID del usuario autenticado (el que está realizando la consulta)
 * @param {String} profileUserId - ID del usuario del perfil visitado
 * @returns {Object} - Objeto que indica si el usuario autenticado sigue al otro y si es seguido por él
 */
const followThisUser = async (identityUserId, profileUserId) => {
    try {
        // Verificar si el usuario autenticado sigue al perfil consultado
        const following = await Follow.findOne({user: identityUserId,followed: profileUserId})
                                        //.select({"followed":1,"_id":0});


        // Verificar si el perfil consultado sigue al usuario autenticado (es decir, si lo sigue de vuelta)
        const follower = await Follow.findOne({user: profileUserId, followed: identityUserId})
                                        //.select({"user":1,"_id":0});

        // Retornar los documentos encontrados (pueden ser null si no hay relación)
        return {
            following: following,  // true si identityUserId sigue a profileUserId
            follower: follower  // true si profileUserId sigue a identityUserId
        };
    } catch (error) {
        // En caso de error, devolver información útil
        return {
            status: "error",
            message: "Error al comprobar la relación de seguimiento",
            error: error.message
        };
    }
};

module.exports={
    followUserIds,
    followThisUser
}