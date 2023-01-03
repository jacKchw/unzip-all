export function add(a: number, b: number): number {
  return a + b
}

export const getAllpath = async (sourcePath: string): Promise<string[]> => {
  const files: string[] = []
  for await (const item of Deno.readDir(sourcePath)) {
    if (item.isFile || item.isSymlink) {
      files.push(item.name)
    } else if (item.isDirectory) {
      const content = await getAllpath(item.name)
      files.push(...content)
    }
  }
  return files
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const output = await getAllpath("/")
  console.log(output)
}
