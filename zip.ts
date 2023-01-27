import * as path from "https://deno.land/std@0.170.0/path/mod.ts"
import { parse } from "https://deno.land/std@0.174.0/flags/mod.ts"
import ProgressBar from "https://deno.land/x/progress@v1.3.6/mod.ts"

let progressBarTotal = 0
let progressBarCompleted = 0
const progressBar = new ProgressBar({
  display: ":percent [:bar] :time :completed/:total",
  total: progressBarTotal,
})

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
        progressBar.console("Can't read: " + itemPath)
      }
    }
  }
}

const zip = async (folderPath: string, ext = "zip") => {
  if (!path.isAbsolute(folderPath)) {
    folderPath = await Deno.realPath(folderPath)
  }

  // update progress bar
  for await (const _item of Deno.readDir(folderPath)) {
    progressBarTotal++
  }
  progressBar.render(progressBarCompleted, { total: progressBarTotal })

  // zip
  const zipFilePath = `${folderPath}.${ext}`
  for await (const item of Deno.readDir(folderPath)) {
    await zipFile(zipFilePath, folderPath, item.name)

    // update progress bar
    progressBarCompleted++
    progressBar.render(progressBarCompleted, { total: progressBarTotal })
  }

  await Deno.remove(folderPath, { recursive: true })
  progressBar.console("ziped: " + zipFilePath)
}

export const zipFile = async (
  zipfilePath: string,
  dirPath: string,
  fileName: string
) => {
  // convert to absolute path
  if (!path.isAbsolute(zipfilePath)) {
    zipfilePath = await Deno.realPath(zipfilePath)
  }

  // zip
  const process = Deno.run({
    cwd: dirPath,
    cmd: ["zip", "-r", zipfilePath, fileName],
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
}

if (import.meta.main) {
  const flags = parse(Deno.args)
  const sourcePath = flags._[0]
  if (sourcePath == undefined || typeof sourcePath == "number")
    throw new Error("Required sourcePath")
  if (flags.d == undefined) throw new Error("Required flag -d NUM")

  await walkOnlyDir(sourcePath, flags.d, 0, async (filePath) => {
    try {
      if (flags.dry) {
        progressBar.console("zipped: " + filePath + "." + flags.ext)
      } else {
        zip(filePath, flags.ext)
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        progressBar.console(error.message)
      }
    }
  })
}
