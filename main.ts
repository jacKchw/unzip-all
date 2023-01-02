export function add(a: number, b: number): number {
  return a + b;
}

export const getAllpath =async (sourcePath:string):stirng[] => {

  const files :string[]= []
  const dirReader =  Deno.readDir(sourcePath)
  for await (const item of dirReader ){
    if (item.isFile){
      files.push(item.name)
    }else if(item.isDirectory){

    }

  }
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  console.log("Add 2 + 3 =", add(2, 3));
}
