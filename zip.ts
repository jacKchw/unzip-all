import * as path from "https://deno.land/std@0.170.0/path/mod.ts"
import { parse } from "https://deno.land/std@0.174.0/flags/mod.ts"
import { walkDir } from "./main.ts"

export const walkOnlyDir = async (
  sourcePath: string,
  distDepth: number,
  depth: number,
  callback: (filePath: string) => Promise<void>
): Promise<void> => {
  // convert to absolute path
  if (!path.isAbsolute(sourcePath)) {
    sourcePath = await Deno.realPath(sourcePath)
  }

  // read through directory
  for await (const item of Deno.readDir(sourcePath)) {
    const itemPath = path.join(sourcePath, item.name)

    if (item.isDirectory) {
      if (distDepth === depth) {
        await callback(itemPath)
        continue
      }

      try {
        // recursively read sub-directory
        await walkOnlyDir(itemPath, distDepth, depth + 1, callback)
      } catch (_error: unknown) {
        console.log("Can't read: ", itemPath)
      }
    }
  }
}

export const zip = async (filePath: string, ext = "zip") => {
  const dir = path.dirname(filePath)
  const outputFileName = dir + "." + ext

  // zip
  const process = Deno.run({
    cmd: ["zip", outputFileName, filePath],
    stdout: "inherit",
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
}

if (import.meta.main) {
  const flags = parse(Deno.args)
  const sourcePath = flags._[0]
  if (sourcePath == undefined || typeof sourcePath == "number")
    throw new Error("Required sourcePath")
  if (flags.d == undefined) throw new Error("Required flag -d NUM")

  await walkDir(sourcePath, async (filePath) => {
    if (flags.dry) {
      console.log(filePath + "." + flags.ext)
    } else {
      await zip(filePath, flags.ext)
    }
  })

  // delete folder
  await walkOnlyDir(sourcePath, flags.d, 0, async (filePath) => {
    if (flags.dry) {
      console.log(filePath + "." + flags.ext)
    } else {
      try {
        // Remove folder
        await Deno.remove(filePath, { recursive: true })
        console.log("zip: ", filePath)
      } catch (error: unknown) {
        console.log(error)
      }
    }
  })
}
