//Importar dependecnia y modulos 
const bcrypt = require("bcrypt")
const User = require("../models/user")
const createToken = require("../service/jwt");


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
        //validate(params);

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
        let user = await User.findById(id).select("-password -__v -_id -role");

        if(!user){
            return res.status(400).send({
                status: "error",
                message: "Usuario no encontrado"
            })
        }
        
        //Devolver el resultado
        //TODO: devolver informacion de follows
        return res.status(200).send({
            status: "success",
            user,
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Ha ocurrido un error en el servidor",
            error: error.message  // o puedes no enviarlo si quieres ocultar detalles
        });
    }
}

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

        //Devolver el resultado
        return res.status(200).send({
            status: "success",
            message: "Ruta de listado de usuarios",
            page: users.page,
            totalPages: users.totalPages,
            totalDocs: users.totalDocs,
            users: users.docs,
        })
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Ha ocurrido un error en el servidor",
            error: error.message
        })
    }
}



//Exportar acciones
module.exports={
    pruebaUser,
    register,
    login,
    profile,
    list
}