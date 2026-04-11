import { createServer } from "node:http";

import { app } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { attachSocket } from "./services/socket.service.js";

async function bootstrap() {
  await connectDatabase();

  const server = createServer(app);
  attachSocket(server);

  server.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
