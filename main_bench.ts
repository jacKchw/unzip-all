import { walkDir } from "./main.ts"

Deno.bench(async function readCodeBase() {
  await walkDir("/Users/jack/dev/jackchw", async (_filePath) => {
    return
  })
})

Deno.bench(async function readRoot() {
  await walkDir(".", async (_filePath) => {
    return
  })
})
