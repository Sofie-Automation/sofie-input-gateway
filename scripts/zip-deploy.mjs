// const process = require('process') // process is a global variable in node.js
import * as fs from 'fs/promises'

import * as zipAFolder from 'zip-a-folder'

const packageName = 'input-gateway'

const suffix = process.argv[2] ?? ''

;(async () => {
	const packageJson = await fs.readFile('./packages/input-gateway/package.json')
	const packageParsed = JSON.parse(packageJson)
	const version = packageParsed.version

	const zipFileName = `${packageName}${suffix}-v${version}.zip`

	const err = await zipAFolder.zip('./deploy', `./${zipFileName}`)
	if (err) {
		throw new Error(err)
	}

	await fs.rename(`./${zipFileName}`, `./deploy/${zipFileName}`)
})().catch((err) => {
	console.error(err)
	// eslint-disable-next-line n/no-process-exit
	process.exit(1)
})
