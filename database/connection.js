// Importamos Mongoose, que es la librería encargada de gestionar la conexión
// y el modelado de datos en MongoDB.
const mongoose = require("mongoose");

// Función encargada de conectar a la base de datos.
// Se declara como async para permitir el uso de "await".
const connection = async () => {
    try {
        // Intentamos conectar con la base de datos usando mongoose.connect().
        // Esta función devuelve una promesa, por eso usamos "await".
        await mongoose.connect("mongodb://localhost:27017/mi_red_social");

        // Si la conexión es exitosa, mostramos un mensaje informativo.
        console.log("Conectado correctamente a la base de datos");
        
    } catch (error) {
        // Si ocurre cualquier error durante la conexión, lo mostramos en consola…
        console.error("❌Error al conectar con la base de datos:", error);
        
        // …y lanzamos un error más descriptivo para manejarlo en otros módulos si es necesario.
        throw new Error("No se ha podido conectar a la base de datos.");
    }
};

// Exportamos la función para poder usarla en otros archivos del proyecto.
module.exports = connection;