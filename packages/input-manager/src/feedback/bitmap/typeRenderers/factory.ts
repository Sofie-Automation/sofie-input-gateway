import { CanvasRenderingContext2D } from 'skia-canvas'

import { BitmapFeedback, ClassNames } from '../../feedback.js'
import { ActionRenderer } from './action.js'
import { BaseAdLibRenderer } from './adlib/base.js'
import { BaseRenderer } from './base.js'

export function rendererFactory(
	feedback: BitmapFeedback,
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	scaleFactor: number
): BaseRenderer {
	if (feedback.classNames?.includes(ClassNames.AD_LIB)) {
		return new BaseAdLibRenderer(ctx, width, height, scaleFactor)
	}

	return new ActionRenderer(ctx, width, height, scaleFactor)
}
