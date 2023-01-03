import * as path from "https://deno.land/std@0.170.0/path/mod.ts"

export const walkDir = async (
  sourcePath: string,
  callback: (filePath: string) => Promise<void>
): Promise<void> => {
  if (path.isAbsolute(sourcePath)) {
    sourcePath = await Deno.realPath(sourcePath)
  }

  for await (const item of Deno.readDir(sourcePath)) {
    const itemPath = path.join(sourcePath, item.name)

    if (item.isFile) {
      callback(itemPath)
    } else if (item.isDirectory) {
      try {
        await walkDir(itemPath, callback)
      } catch (_error: unknown) {
        console.log("Can't read: ", item.name)
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

  await Deno.mkdir(newDir)
  const process = Deno.run({ cmd: ["unzip", filePath, "-d", newDir] })
  await process.status()
  await Deno.remove(filePath)
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await walkDir("/home/jack/.library", async (filePath) => {
    await unzip(filePath)
  })
}
