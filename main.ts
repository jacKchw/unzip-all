import * as path from "https://deno.land/std@0.170.0/path/mod.ts"

export const walkDir = async (
  sourcePath: string,
  callback: (filePath: string) => Promise<void>
): Promise<void> => {
  // convert to absolute path
  if (path.isAbsolute(sourcePath)) {
    sourcePath = await Deno.realPath(sourcePath)
  }

  // read through directory
  for await (const item of Deno.readDir(sourcePath)) {
    const itemPath = path.join(sourcePath, item.name)

    if (item.isFile) {
      callback(itemPath)
    } else if (item.isDirectory) {
      // recursively read sub-directory
      try {
        await walkDir(itemPath, callback)
      } catch (_error: unknown) {
        console.log("Can't read: ", itemPath)
      }
    }
  }
}

export const unzip = async (filePath: string) => {
  const ext = path.extname(filePath)
  if (ext !== ".zip") {
    return
  }

  const base = path.basename(filePath, ext)
  const dir = path.dirname(filePath)
  const newDir = path.join(dir, base)

  try {
    // make Directory
    await Deno.mkdir(newDir)

    // unzip
    const process = Deno.run({
      cmd: ["unzip", filePath, "-d", newDir],
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

    // Remove .zip file
    await Deno.remove(filePath)
    console.log("Extracted: ", filePath)
  } catch (error: unknown) {
    console.log(error)
  }
}

if (import.meta.main) {
  const sourcePath = Deno.args[0]
  await walkDir(sourcePath, async (filePath) => {
    await unzip(filePath)
  })
}
