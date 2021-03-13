const { io } = require('../server')

const { Usuarios } = require('../classes/usuarios')
const { crearMensaje } = require('../utilidades/utilidades')


const usuarios = new Usuarios()


io.on('connection', (client) => {
    client.on('entrarChat', (data, callback) => {
        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre y la sala son necesarios'
            })
        }


        client.join(data.sala)


        usuarios.agregarPersona(client.id, data.nombre, data.sala)

        const personas = usuarios.getPersonasPorSala(data.sala)

        client.broadcast.to(data.sala).emit('listaPersonas', personas)

        return callback(personas)
    })


    client.on('crearMensaje', (data) => {
        const persona = usuarios.getPersona(client.id)
        const mensaje = crearMensaje(persona.nombre, data.mensaje)

        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje)
    })


    client.on('disconnect', () => {
        const personaBorrada = usuarios.borrarPersona(client.id)

        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${ personaBorrada.nombre } salió`))
        client.broadcast.to(personaBorrada.sala).emit('listaPersonas', usuarios.getPersonasPorSala(personaBorrada.sala))
    })


    // Mensajes privados
    client.on('mensajePrivado', data => {
        const persona = usuarios.getPersona(client.id)
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje))
    })
})