# Networking Module

**Purpose**: API client, error handling, retry logic, offline support

**Status**: 🚧 Work in Progress

## Files

- `APIEndpoints.swift` - Endpoint definitions (✅ Partial)
- `ErrorMapper.swift` - Error code mapping (✅ Partial)
- `APIClient.swift` - URLSession wrapper (TODO)
- `RequestBuilder.swift` - HTTP request construction (TODO)
- `ResponseDecoder.swift` - Response parsing (TODO)
- `RetryHandler.swift` - Exponential backoff (TODO)

## Design

### APIClient

```swift
class APIClient {
    func request<T: Decodable>(
        _ endpoint: APIEndpoints,
        method: HTTPMethod,
        body: Encodable? = nil
    ) async throws -> T
}
```

### Error Handling

All errors mapped to `ServerErrorCode` enum and `ErrorMapper.getUserFriendlyMessage()`.

### Retry Logic

Exponential backoff with max 10 attempts:
- Attempt 1: immediate
- Attempt 2: +1s
- Attempt 3: +2s
- Attempt 4: +4s
- etc.

## TODO

- [ ] Implement APIClient with URLSession
- [ ] Add request/response serialization
- [ ] Implement retry logic
- [ ] Add offline queue
- [ ] Token refresh flow
- [ ] File upload support

