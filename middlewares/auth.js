//Importar Modulos
const jwt = require("jwt-simple");
const moment = require("moment");

//Importar clave secreta 
const libjwt = require("../service/jwt")
const secret = libjwt.secret;

//MIDDLEWARE de autenticacion
const auth =(req, res ,next)=>{
    //Comporbar si me llega la cabecera de auth
    if(!req.headers.authorization){
        return res.status(403).send({
            status:"error",
            message:"La petición no tieen la cabecera de autenticación"
        })
    }

    //Limpiar el token así quitamos culaquier tipo de comillas que pueda traer
    let token = req.headers.authorization.replace(/['"]+/g, '');

    //Decodificar el token 
    let payload;
    try {
        payload = jwt.decode(token, secret);
    } catch (decodeError) {
        return res.status(401).json({
            status: "error",
            message: "Token inválido o mal formado",
            error: decodeError.message
        });
    }

    if(payload.exp<= moment().unix()){
        return res.status(401).send({
            status:"error",
            message:"Token expirado"
        })
    }

    //Agregar  datos de usuaro a request 
    req.user = payload

    //Pasar a la ejecucion de accion
    next()
}



module.exports = {
    auth
};
