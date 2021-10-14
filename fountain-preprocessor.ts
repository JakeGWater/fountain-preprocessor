#!/usr/bin/env node

import { promises } from 'fs'
import mkdirp from 'mkdirp'
import { basename, dirname, join } from 'path'
import { cwd } from 'process'
import yargs from 'yargs'
let { readFile, stat, readdir, open, } = promises

async function* compile_path(dirpath: string, filename: string): AsyncGenerator<string> {
    let file_path = join(dirpath, filename)

    yield `# File: ${filename}\n`
    let fstat = await stat(file_path)
    if (fstat.isDirectory()) {
        let files = await readdir(file_path)
        for (let file of files) {
            yield* compile_path(file_path, file)
        }
        return
    }
    let dir = dirname(file_path)
    let file = await readFile(file_path, 'utf-8')

    console.log(`==> Compiling [${file_path}]`)

    for (let line of file.split('\n')) {
        if (line.startsWith('%include ')) {
            let import_path = line.substr(9).trim()
            yield* compile_path(dir, import_path)
        } else {
            yield line
        }
        yield '\n'
    }
}

async function main() {
    let argv = yargs.argv as any
    let O = argv.o
    let I = argv._[0]
    let path = join(cwd(), O)
    await mkdirp(dirname(O))
    let file = await open(path, 'w')
    let dir = dirname(I)
    let filename = basename(I)
    for await (let line of compile_path(dir, filename)) {
        await file.write(line)
    }
}

main()
