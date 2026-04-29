import { Router } from "express";

import { categories, search, splash, trending } from "../controllers/search.controller.js";

export const searchRouter = Router();

searchRouter.get("/", search);
searchRouter.get("/splash", splash);
searchRouter.get("/categories", categories);
searchRouter.get("/trending", trending);
