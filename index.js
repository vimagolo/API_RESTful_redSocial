// Importar dependencias necesarias para la API
const connection = require("./database/connection"); // Función para conectar a la base de datos
const express = require("express"); // Framework para crear el servidor y gestionar rutas
const cors = require("cors"); // Middleware para permitir peticiones desde otros dominios


// Mensaje inicial para indicar que la API está arrancando
console.log("API NODE para RED SOCIAL arrancada!!");


// Conexión a la base de datos
// Se ejecuta antes de iniciar el servidor para asegurar que todo funciona correctamente
connection();


// Crear servidor Node usando Express
const app = express(); // Instancia principal para gestionar la API
const puerto = 3900; // Puerto donde escuchará el servidor


// Configurar CORS para permitir peticiones externas (por ejemplo, desde un frontend)
app.use(cors());


// Middleware para interpretar el cuerpo (body) de las peticiones entrantes
app.use(express.json()); // Convierte JSON del cliente a objetos JS
app.use(express.urlencoded({ extended: true })); // Permite recibir datos de formularios


// Aquí se cargarán las rutas reales más adelante
// app.use("/api/usuarios", require("./routes/usuarios"));
const UserRoutes = require("./routes/user");
const PublicationRoutes = require("./routes/publication");
const followRoutes = require("./routes/follow");

app.use("/api", UserRoutes);
app.use("/api", PublicationRoutes);
app.use("/api", followRoutes);


// Ruta de prueba para verificar que el servidor responde correctamente
app.get("/ruta-prueba", (req, res) => {
return res.status(200).json({
    id: 1,
    nombre: "victor"
    });
});


// Iniciar el servidor y escuchar peticiones HTTP en el puerto indicado
app.listen(puerto, () => {
console.log("Servidor de node corriendo en el puerto: ", puerto);
});