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

export const unzip = async (filePath:string)=>{
    const ext = path.extname(filePath)
    if (ext !== ".zip") {
      return
    }
    
    const base = path.basename(filePath,ext)
    const dir = path.dirname(filePath)
    const newDir =path.join(dir,base )

    await Deno.mkdir(newDir)
    const process = Deno.run({cmd:["unzip", filePath,"-d",newDir]})
    await process.status()
    await Deno.remove(filePath)
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await walkDir("/home/jack/.library", async (filePath) => {
    await unzip(filePath)
  })
}
