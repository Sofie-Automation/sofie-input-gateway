import { Logger } from 'winston'
import * as fs from 'fs'
import { CertificatesConfig } from './connector'

export class Process {
	logger: Logger

	public certificates: Buffer[] = []

	constructor(logger: Logger) {
		this.logger = logger
	}
	init(certificatesConfig: CertificatesConfig): void {
		if (certificatesConfig.unsafeSSL) {
			this.logger.info('Disabling NODE_TLS_REJECT_UNAUTHORIZED, be sure to ONLY DO THIS ON A LOCAL NETWORK!')
			process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
		} else {
			// var rootCas = SSLRootCAs.create()
		}
		if (certificatesConfig.certificates.length) {
			this.logger.info(`Loading certificates...`)
			for (const certificate of certificatesConfig.certificates) {
				try {
					this.certificates.push(fs.readFileSync(certificate))
					this.logger.info(`Using certificate "${certificate}"`)
				} catch (error) {
					this.logger.error(`Error loading certificate "${certificate}"`, error)
				}
			}
		}
	}
}
