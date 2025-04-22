const WebSocket = require("ws")
const clients = new Map()

const handleConnection = (ws) => {

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message)

      if (data.type === "register") {
        // Store client connection
        clients.set(data.driverId, { role: data.role, ws })
        console.log(`${data.role} (${data.driverId}) connected`)

        // Send registration confirmation
        ws.send(
          JSON.stringify({
            type: "register_confirmation",
            message: `User ${data.driverId} registered as ${data.role}`,
          }),
        )
      }

      if (data.type === "location") {
        console.log(`${data.role} (${data.driverId}) location:`, data.location)

        // Send location updates to all other users
        for (const [userId, client] of clients.entries()) {
          // Don't send the update back to the sender
          if (userId !== data.driverId && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
              JSON.stringify({
                type: "location_update",
                driverId: data.driverId,
                role: data.role,
                location: data.location,
              }),
            )
          }
        }
      }
    } catch (error) {
    }
  })

  ws.on("close", () => {
    for (const [userId, client] of clients.entries()) {
      if (client.ws === ws) {
        console.log(`${client.role} (${userId}) disconnected`)
        clients.delete(userId)
        break
      }
    }
  })
}

module.exports = { handleConnection }


