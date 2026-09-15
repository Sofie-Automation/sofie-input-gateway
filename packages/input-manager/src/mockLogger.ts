import { vi } from 'vitest'

import type { Logger } from './logger.js'

// Used in tests
export function makeMockLogger(): Logger {
	const mockLogger: Logger = {
		data: vi.fn(),
		debug: vi.fn(),
		error: vi.fn(),
		help: vi.fn(),
		http: vi.fn(),
		info: vi.fn(),
		input: vi.fn(),
		prompt: vi.fn(),
		silly: vi.fn(),
		verbose: vi.fn(),
		warn: vi.fn(),
		child: (): Logger => {
			return mockLogger
		},
	}
	return mockLogger
}
