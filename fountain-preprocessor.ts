#!/usr/bin/env node

import { promises } from 'fs'
import mkdirp from 'mkdirp'
import { dirname, join } from 'path'
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
    let path = join(__dirname, 'out', 'script.fountain')
    let file = await open(path, 'w')
    await mkdirp(join(__dirname, 'out'))
    for await (let line of compile_path(__dirname, 'script.fountain')) {
        file.write(line)
    }
}

main()
