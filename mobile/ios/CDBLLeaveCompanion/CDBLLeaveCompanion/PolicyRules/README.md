# Policy Rules Module

**Purpose**: Centralized business logic for leave policy validation and calculations

**Status**: 🚧 Work in Progress

## Files

- `WorkingDayCalculator.swift` - Calculate working days, validate dates
- `PolicyConstants.swift` - Policy version, rules, limits (TODO)
- `ValidationRules.swift` - Leave request validation logic (TODO)

## Integration

This module should be the **single source of truth** for policy logic, mirroring `/docs/Policy Logic/` in the web app.

### Testing

```swift
// Tests/Unit/WorkingDayCalculatorTests.swift
func testCountWorkingDays_ExcludesWeekends() {
    let result = WorkingDayCalculator.countWorkingDays(
        from: Date(from: "2025-01-13"), // Monday
        to: Date(from: "2025-01-17")    // Friday
    )
    XCTAssertEqual(result, 5)
}
```

## TODO

- [ ] Add PolicyConstants.swift
- [ ] Add ValidationRules.swift
- [ ] Integrate with holiday API
- [ ] Add comprehensive unit tests
- [ ] Document all policy rules

