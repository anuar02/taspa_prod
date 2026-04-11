import { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

let io: Server | null = null;

export function attachSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {
    socket.on("join", (userId: string) => {
      socket.join(userId);
    });

    socket.on("leave", (userId: string) => {
      socket.leave(userId);
    });
  });
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(userId).emit(event, payload);
}
