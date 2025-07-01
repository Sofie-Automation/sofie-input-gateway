import { Canvas, FontLibrary } from 'skia-canvas'
import { SomeBitmapFeedback } from '../feedback'
import { rendererFactory } from './typeRenderers/factory'
import path from 'path'
import fs from 'fs/promises'
import { constants as fsConstants } from 'fs'
import process from 'process'
import { Logger } from '../../logger'

async function makeBitmapFromFeedback(
	feedback: SomeBitmapFeedback,
	width: number,
	height: number,
	isPressed: boolean
): Promise<Buffer> {
	const { ctx } = createCanvasAndContext()

	ctx.fillStyle = 'black'
	ctx.fillRect(0, 0, width, height)

	if (isPressed) {
		ctx.translate(width * 0.05, height * 0.05)
		ctx.scale(0.9, 0.9)
	}

	const scaleFactor = height / 72

	if (feedback !== null) {
		const renderer = rendererFactory(feedback, ctx, width, height, scaleFactor)
		renderer.render(feedback)
	}

	return Buffer.from(
		ctx.getImageData(0, 0, width, height, {
			colorSpace: 'srgb',
		}).data
	)
}

export async function getBitmap(
	feedback: SomeBitmapFeedback,
	width: number,
	height: number,
	isPressed?: boolean
): Promise<Buffer> {
	const bitmap = await makeBitmapFromFeedback(feedback, width, height, isPressed ?? false)
	return bitmap
}

export async function init(logger: Logger): Promise<void> {
	// Create a canvas, just to boot up Skia, load the fonts, etc.
	const { canvas, ctx } = createCanvasAndContext()
	logger.silly(
		`skia-canvas initialized, using GPU: ${canvas.gpu}, engine info: ${JSON.stringify((canvas as any).engine)}`
	)

	const fonts = ['roboto-condensed-regular.ttf', 'roboto-condensed-700.ttf']

	const searchPaths = [
		path.join(path.dirname(process.execPath), './assets'),
		path.join(process.cwd(), './assets'),
		process.cwd(),
	]

	const foundFiles = await findFiles(fonts, searchPaths)
	logger.silly(`Found ${foundFiles.length} fonts to be loaded`)

	FontLibrary.use('RobotoCnd', foundFiles)
	logger.silly('Fonts loaded into FontLibrary')

	void canvas, ctx
}

async function findFiles(files: string[], paths: string[]): Promise<string[]> {
	const result: string[] = []
	for (const file of files) {
		for (const pathOption of paths) {
			try {
				const pathToTest = path.join(pathOption, file)
				await fs.access(pathToTest, fsConstants.O_RDONLY)
				// File exists, we can add it to result
				result.push(pathToTest)
				break
			} catch (e) {
				// Doesn't exist or can't read
			}
		}
	}

	return result
}

function createCanvasAndContext(width?: number, height?: number) {
	const canvas = new Canvas(width, height)

	if (process.env['SKIA_CANVAS_DISABLE_GPU'] === '1') {
		canvas.gpu = false
	}

	const ctx = canvas.getContext('2d')

	return { canvas, ctx }
}
