const {Schema , model}= require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const UserSchema = Schema({
    name:{
        type: String,
        require:true
    },
    surname:{
        type: String,
    },
    bio:{
        type: String,
    },
    nick:{
        type: String,
        require:true
    },
    email:{
        type: String,
        require:true
    },
    password:{
        type: String,
        require:true
    },
    role:{
        type: String,
        default:"role_user"
    },
    image:{
        type: String,
        default: "default.png"
    },
    create_at:{
        type:Date,
        default:Date.now
    }
});

UserSchema.plugin(mongoosePaginate);

module.exports = model("User", UserSchema)
// Exporta el modelo "User" para que pueda usarse en otros archivos
// model("User", UserSchema, "users") crea un modelo de Mongoose:
//
// 1. "User" → nombre interno del modelo dentro de la app
// 2. UserSchema → el esquema que define la estructura de los documentos
// 3. "users" → nombre de la colección en MongoDB (si no se pone, Mongoose la pluraliza solo)