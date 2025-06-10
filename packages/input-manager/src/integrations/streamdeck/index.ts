import { listStreamDecks, openStreamDeck } from '@elgato-stream-deck/node'
import { Logger } from '../../logger'
import { Device } from '../../devices/device'
import { SomeFeedback } from '../../feedback/feedback'
import { StreamDeckDeviceOptions } from '../../generated'
import { StreamDeckDeviceHandler } from './device'
import DEVICE_OPTIONS from './$schemas/options.json'
import { StreamDeckTcpProxy } from './tcp-proxy'
import { StreamDeckDeviceBase } from './types'

export class StreamDeckDevice extends Device {
	private config: StreamDeckDeviceOptions

	private streamdeck: StreamDeckDeviceBase | undefined

	constructor(config: StreamDeckDeviceOptions, logger: Logger) {
		super(logger)
		this.config = config
	}

	init = async (): Promise<void> => {
		if (this.streamdeck) throw new Error('Device already initialized')

		console.log('init', this.config)

		if (this.config.ip) {
			this.logger.debug(`Stream Deck: Trying to connect to: ip: ${this.config.ip}, port: ${this.config.port}`)

			this.streamdeck = new StreamDeckTcpProxy(this.config, this.logger, this)
		} else {
			const allDevices = await listStreamDecks()
			const deviceInfo = allDevices.find((thisDevice, index) => {
				let match = true
				if (this.config.path && thisDevice.path !== this.config.path) match = false
				if (this.config.serialNumber && thisDevice.serialNumber !== this.config.serialNumber) match = false
				if (this.config.index && index !== this.config.index) match = false

				return match
			})
			if (!deviceInfo) throw new Error('Matching device not found')

			this.logger.debug(
				`Stream Deck: path: ${deviceInfo.path}, serialNumber: ${deviceInfo.serialNumber}, index: ${allDevices.indexOf(
					deviceInfo
				)}`
			)

			const device = await openStreamDeck(deviceInfo.path, {
				resetToLogoOnClose: true,
			})
			if (!device) throw new Error(`Could not open device: "${deviceInfo.path}"`)

			this.streamdeck = new StreamDeckDeviceHandler(this.config, this.logger, this, device)
		}

		await this.streamdeck.init()
	}

	destroy = async (): Promise<void> => {
		await super.destroy()

		await this.streamdeck?.destroy()
	}

	setFeedback = async (triggerId: string, feedback: SomeFeedback): Promise<void> => {
		if (!this.streamdeck) throw new Error('Device not initialized')

		await this.streamdeck.setFeedback(triggerId, feedback)
	}

	clearFeedbackAll = async (): Promise<void> => {
		if (!this.streamdeck) throw new Error('Device not initialized')

		await this.streamdeck.clearFeedbackAll()
	}

	static getOptionsManifest(): object {
		return DEVICE_OPTIONS
	}
}
