import * as path from "https://deno.land/std@0.170.0/path/mod.ts"

export const walkDir = async (
  sourcePath: string,
  callback: (filePath: string) => Promise<void>
): Promise<string[]> => {
  if (path.isAbsolute(sourcePath)) {
    sourcePath = await Deno.realPath(sourcePath)
  }

  const fileReaders: string[] = []
  for await (const item of Deno.readDir(sourcePath)) {
    const itemPath = path.join(sourcePath, item.name)

    if (item.isFile) {
      callback(itemPath)
      fileReaders.push(itemPath)
    } else if (item.isDirectory) {
      try {
        const content = await walkDir(itemPath, callback)
        fileReaders.push(...content)
      } catch (_error: unknown) {
        console.log("Can't read: ", item.name)
      }
    }
  }

  return fileReaders
}

export const isZip = async (filePath: string): Promise<boolean> => {
  return path.extname(filePath) === ".zip"
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await walkDir(".", async (filePath) => {
    if (await isZip(filePath)) {
      console.log(filePath)
    }
  })
}
