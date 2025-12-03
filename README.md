# Circuit Breaker in TypeScript

This repository contains a minimal implementation of a Circuit Breaker strategy, useful for building resilient applications that interact with unstable or unreliable external services.

### File Included

`circuit-breaker.ts`

This file implements a basic Circuit Breaker, including:

- Closed state: requests flow normally.

- Open state: requests fail fast after reaching the error threshold.

- Half-open state: allows limited test requests to determine recovery.

- Simple configuration for thresholds and timeout durations.

## Running the Script

You can execute the file using Bun:

```bash
bun <file-name>.ts
```

Example:

```bash
bun circuit-breaker.ts
```

## Requirements

- Bun installed
Installation guide: https://bun.sh

## Purpose

This repository serves as a simple reference for understanding and experimenting with the Circuit Breaker pattern.
Useful for:

- API clients

- Microservices

- Distributed systems

- Fault-tolerant applications

## License

MIT License.