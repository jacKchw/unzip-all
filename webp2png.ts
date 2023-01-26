import * as path from "https://deno.land/std@0.170.0/path/mod.ts"
import { walkDir } from "./main"

export const convert2png = async (filePath: string) => {
  const ext = path.extname(filePath)
  if (ext !== ".webp") {
    return
  }

  const base = path.basename(filePath, ext)
  const dir = path.dirname(filePath)
  const newDir = path.join(dir, base + ".png")

  try {
    // convert
    const process = Deno.run({
      cmd: ["webp", filePath, "-o", newDir],
      stdout: "null",
      stderr: "piped",
    })

    //handle stderr
    const { success } = await process.status()
    const rawError = await process.stderrOutput()
    process.close()
    if (!success) {
      const errorString = new TextDecoder().decode(rawError)
      throw new Error(errorString)
    }

    // Remove .webp file
    await Deno.remove(filePath)
    console.log("Converted: ", filePath)
  } catch (error: unknown) {
    console.log(error)
  }
}

if (import.meta.main) {
  const sourcePath = Deno.args[0]
  await walkDir(sourcePath, async (filePath: string) => {
    await convert2png(filePath)
  })
}
