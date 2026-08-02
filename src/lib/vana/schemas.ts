import { z } from "zod";

export const mirrorSourceSchema = z.enum(["instagram", "youtube", "spotify"]);

export const mirrorCardSourceSchema = z.enum([
  "instagram",
  "youtube",
  "spotify",
  "spotify-youtube",
  "instagram-spotify",
  "instagram-youtube",
  "instagram-spotify-youtube",
]);
