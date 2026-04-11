import { Router } from "express";

import { categories, search, trending } from "../controllers/search.controller.js";

export const searchRouter = Router();

searchRouter.get("/", search);
searchRouter.get("/categories", categories);
searchRouter.get("/trending", trending);
