import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      NEXT_PUBLIC_PADDLE_PRICE_CASUAL: "pri_01kk1pndq89nmbytffssa8sejw",
      NEXT_PUBLIC_PADDLE_PRICE_REGULAR: "pri_01kk1pqm2pz7sq1z47ed04gqc2",
      NEXT_PUBLIC_PADDLE_PRICE_PRO: "pri_01kk1ptvd4ky1wtrn44awc72cv",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
