import type { Device } from '../../devices/device.js'
import type { SomeFeedback } from '../../feedback/feedback.js'

export type StreamDeckEventTarget = Device

export interface StreamDeckDeviceBase {
	setFeedback(triggerId: string, feedback: SomeFeedback): Promise<void>
	clearFeedbackAll(): Promise<void>

	init(): Promise<void>
	destroy(): Promise<void>
}
