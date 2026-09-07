import { BitmapFeedback } from '../../feedback.js'
import { BaseRenderer } from './base.js'

export class ActionRenderer extends BaseRenderer {
	render(feedback: BitmapFeedback): void {
		const label = feedback?.userLabel?.long ?? feedback?.action?.long ?? 'unknown'

		if (feedback.style) return this.renderStyled(label, feedback.style)

		const text = this.text
		text.p({
			children: label ?? 'unknown',
			align: 'center',
			fontSize: this.percentToPixels(1.5),
			spring: true,
			background: '#000',
			lineClamp: 4,
		})
	}
}
