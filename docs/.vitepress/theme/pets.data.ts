import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { publicGameValues } from '../../../packages/academy-model/public-values.mjs'
export default {
 watch: ['data/game/pets.json'],
 load() {
  const source = JSON.parse(readFileSync(fileURLToPath(new URL('../../../data/game/pets.json',import.meta.url)),'utf8'))
  return publicGameValues(source.records)
 }
}
