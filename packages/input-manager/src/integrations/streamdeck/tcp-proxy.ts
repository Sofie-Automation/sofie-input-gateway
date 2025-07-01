import { StreamDeckTcpConnectionManager, StreamDeckTcp } from '@elgato-stream-deck/tcp'
import { SomeFeedback } from '../../feedback/feedback'
import { StreamDeckDeviceOptions } from '../../generated'
import { Logger } from '../../logger'
import { StreamDeckDeviceHandler } from './device'
import type { StreamDeckDeviceBase, StreamDeckEventTarget } from './types'

/**
 * A proxy for handling the connect/disconnect glow of the Stream Deck TCP connection.
 * This allows for the same StreamDeck class logic to be used for both TCP and USB connections, and keep all the TCP connection handling in one place.
 */
export class StreamDeckTcpProxy implements StreamDeckDeviceBase {
	private readonly events: StreamDeckEventTarget
	protected logger: Logger
	private config: StreamDeckDeviceOptions

	// It is intended that a connection manager is used for multiple connections, but that complicates our use case.
	// Note: If we want to support the front panel connection in the future, we will need to change this.
	private connectionManager = new StreamDeckTcpConnectionManager()

	private streamdeck: StreamDeckDeviceBase | undefined
	private feedbackCache = new Map<string, SomeFeedback>()

	constructor(config: StreamDeckDeviceOptions, logger: Logger, events: StreamDeckEventTarget) {
		this.events = events
		this.logger = logger
		this.config = config
	}

	async init(): Promise<void> {
		// @ts-expect-error Something wrong with the lib types..
		this.connectionManager.on('error', (err: string) => {
			this.logger.error(`Stream Deck: Connection error: ${err}`)
		})
		// @ts-expect-error Something wrong with the lib types..
		this.connectionManager.on('disconnected', (_streamdeck: StreamDeckTcp) => {
			if (this.streamdeck) {
				this.streamdeck.destroy().catch((err) => {
					this.logger.error(`Stream Deck: Error destroying device: ${err}`)
				})
			}

			// Clear current streamdeck
			this.streamdeck = undefined

			this.logger.info('Stream Deck: Disconnected from device')
		})
		// @ts-expect-error Something wrong with the lib types..
		this.connectionManager.on('connected', (streamdeck: StreamDeckTcp) => {
			if (streamdeck.CONTROLS.length === 0) {
				// Ignore the network-dock in a generic way
				this.logger.info('Stream Deck: Connected to device without any controls. Ignoring')
				return
			}

			if (this.streamdeck) {
				this.logger.warn('Stream Deck: Already connected to a device, ignoring new connection')
				return
			}

			this.logger.info('Stream Deck: Connected to device')

			this.streamdeck = new StreamDeckDeviceHandler(this.config, this.logger, this.events, streamdeck)

			const streamdeckImpl = this.streamdeck
			// TODO - could this be prone to race conditions?
			this.streamdeck
				.init()
				.then(async () => {
					// Redraw cached feedbacks
					await Promise.all(
						Array.from(this.feedbackCache.entries()).map(async ([triggerId, feedback]) =>
							streamdeckImpl.setFeedback(triggerId, feedback)
						)
					)
				})
				.catch((err) => {
					this.logger.error(`Stream Deck: Error initializing device: ${err}`)
				})
		})

		if (!this.config.ip) throw new Error('Stream Deck: No IP address provided in config')

		this.connectionManager.connectTo(this.config.ip, this.config.port)
	}
	async destroy(): Promise<void> {
		this.connectionManager.disconnectFromAll()

		await this.streamdeck?.destroy()
	}

	async setFeedback(triggerId: string, feedback: SomeFeedback): Promise<void> {
		this.feedbackCache.set(triggerId, feedback)

		if (this.streamdeck) {
			await this.streamdeck.setFeedback(triggerId, feedback)
		}
	}
	async clearFeedbackAll(): Promise<void> {
		this.feedbackCache.clear()

		if (this.streamdeck) {
			await this.streamdeck.clearFeedbackAll()
		}
	}
}
