#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const [, , inputPath, outputPath, vertexStepArg = '10', faceStepArg = '6'] = process.argv

if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/obj-decimate.cjs <input.obj> <output.obj> [vertexStep] [faceStep]')
  process.exit(1)
}

const vertexStep = Math.max(2, Number.parseInt(vertexStepArg, 10) || 10)
const faceStep = Math.max(1, Number.parseInt(faceStepArg, 10) || 6)

const raw = fs.readFileSync(inputPath, 'utf8')
const lines = raw.split(/\r?\n/)

const allVertices = []
const sampledFaces = []
const usedVertexIndices = new Set()

let inputVertexCount = 0
let inputFaceCount = 0

for (const line of lines) {
  if (line.startsWith('v ')) {
    inputVertexCount += 1
    allVertices.push(line)
    continue
  }

  if (!line.startsWith('f ')) continue
  inputFaceCount += 1
  if (inputFaceCount % faceStep !== 0) continue

  const tokens = line.slice(2).trim().split(/\s+/)
  if (tokens.length < 3) continue
  sampledFaces.push(tokens)
  tokens.forEach((token) => {
    const oldIndex = Number.parseInt(token.split('/')[0], 10)
    if (Number.isFinite(oldIndex) && oldIndex > 0) {
      usedVertexIndices.add(oldIndex)
    }
  })
}

const sortedUsedIndices = Array.from(usedVertexIndices).sort((a, b) => a - b)
const mappedVertexIndex = new Map()
const outputVertices = []
let keptVertexCount = 0

sortedUsedIndices.forEach((oldIndex) => {
  const vertexLine = allVertices[oldIndex - 1]
  if (!vertexLine) return
  keptVertexCount += 1
  mappedVertexIndex.set(oldIndex, keptVertexCount)
  outputVertices.push(vertexLine)
})

const outputFaces = []
let keptFaceCount = 0
sampledFaces.forEach((tokens) => {
  const remapped = []
  for (const token of tokens) {
    const [v, vt, vn] = token.split('/')
    const oldIndex = Number.parseInt(v, 10)
    const nextIndex = mappedVertexIndex.get(oldIndex)
    if (!nextIndex) return
    remapped.push(vt !== undefined || vn !== undefined ? `${nextIndex}/${vt || ''}/${vn || ''}` : `${nextIndex}`)
  }
  if (remapped.length < 3) return
  keptFaceCount += 1
  outputFaces.push(`f ${remapped.join(' ')}`)
})

const header = [
  '# decimated from source OBJ for web delivery',
  `# source: ${path.basename(inputPath)}`,
  `# vertexStep: ${vertexStep}`,
  `# faceStep: ${faceStep}`,
  `# vertices: ${keptVertexCount}/${inputVertexCount}`,
  `# faces: ${keptFaceCount}/${inputFaceCount}`,
]

const outputText = `${header.join('\n')}\n${outputVertices.join('\n')}\n${outputFaces.join('\n')}\n`
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, outputText)

const inMb = (fs.statSync(inputPath).size / (1024 * 1024)).toFixed(2)
const outMb = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2)
console.log(`Input:  ${inMb} MiB`)
console.log(`Output: ${outMb} MiB`)
console.log(`Vertices kept: ${keptVertexCount}/${inputVertexCount}`)
console.log(`Faces kept: ${keptFaceCount}/${inputFaceCount}`)
