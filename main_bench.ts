import { walkDir } from "./main.ts"

Deno.bench(async function readRoot() {
  await walkDir(".", async (_filePath) => {
    return
  })
})
