//
//  WorkingDayCalculator.swift
//  CDBLLeaveCompanion
//
//  Business logic for working days calculation
//  Policy: Excludes Friday, Saturday, and company holidays
//
//  TODO: Integrate with holiday API
//

import Foundation

struct WorkingDayCalculator {
    /// Calculate working days between two dates, excluding weekends and holidays
    /// - Parameters:
    ///   - start: Start date
    ///   - end: End date (inclusive)
    ///   - holidays: Optional array of holidays to exclude
    /// - Returns: Number of working days
    static func countWorkingDays(
        from start: Date,
        to end: Date,
        excluding holidays: [Holiday] = []
    ) -> Int {
        // Normalize to start of day
        let calendar = Calendar.current
        let startDay = calendar.startOfDay(for: start)
        let endDay = calendar.startOfDay(for: end)
        
        guard startDay <= endDay else {
            return 0
        }
        
        var count = 0
        var currentDate = startDay
        
        while currentDate <= endDay {
            let weekday = calendar.component(.weekday, from: currentDate)
            // Calendar.component(.weekday): 1=Sunday, 2=Monday, ..., 7=Saturday
            // Business days: Sunday(1), Monday(2), Tuesday(3), Wednesday(4), Thursday(5)
            // Weekends: Friday(6), Saturday(7)
            
            if weekday <= 5 {
                // Check if it's a holiday
                let dateString = DateFormatter.iso8601Day.string(from: currentDate)
                let isHoliday = holidays.contains { $0.date == dateString }
                
                if !isHoliday {
                    count += 1
                }
            }
            
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate) ?? currentDate
        }
        
        return count
    }
    
    /// Check if a date falls on a weekend (Friday or Saturday)
    /// - Parameter date: Date to check
    /// - Returns: True if weekend
    static func isWeekend(_ date: Date) -> Bool {
        let calendar = Calendar.current
        let weekday = calendar.component(.weekday, from: date)
        return weekday == 6 || weekday == 7 // Friday or Saturday
    }
    
    /// Check if a date is a valid working day (not weekend, not holiday)
    /// - Parameters:
    ///   - date: Date to check
    ///   - holidays: Optional array of holidays
    /// - Returns: True if valid working day
    static func isValidWorkingDay(_ date: Date, excluding holidays: [Holiday] = []) -> Bool {
        guard !isWeekend(date) else {
            return false
        }
        
        let dateString = DateFormatter.iso8601Day.string(from: date)
        return !holidays.contains { $0.date == dateString }
    }
    
    /// Find the next working day (non-weekend, non-holiday) after the given date
    /// - Parameters:
    ///   - date: Starting date
    ///   - excluding: Optional array of holidays
    /// - Returns: Next working day
    static func nextWorkingDay(after date: Date, excluding holidays: [Holiday] = []) -> Date {
        let calendar = Calendar.current
        var nextDate = calendar.date(byAdding: .day, value: 1, to: date) ?? date
        
        // Skip weekends and holidays
        while !isValidWorkingDay(nextDate, excluding: holidays) {
            nextDate = calendar.date(byAdding: .day, value: 1, to: nextDate) ?? nextDate
        }
        
        return calendar.startOfDay(for: nextDate)
    }
    
    /// Check if a date is a holiday
    /// - Parameters:
    ///   - date: Date to check
    ///   - holidays: Array of holidays
    /// - Returns: True if holiday
    static func isHoliday(_ date: Date, in holidays: [Holiday]) -> Bool {
        let dateString = DateFormatter.iso8601Day.string(from: date)
        return holidays.contains { $0.date == dateString }
    }
}

// MARK: - Holiday Model

struct Holiday: Codable, Identifiable {
    let id: String
    let date: String  // ISO 8601 format: "2025-01-01"
    let name: String
    let type: String  // "PUBLIC_HOLIDAY" or "COMPANY_HOLIDAY"
    
    enum CodingKeys: String, CodingKey {
        case date, name, type
    }
    
    init(date: String, name: String, type: String = "PUBLIC_HOLIDAY") {
        self.id = date
        self.date = date
        self.name = name
        self.type = type
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let dateValue = try container.decode(String.self, forKey: .date)
        self.id = dateValue
        self.date = dateValue
        self.name = try container.decode(String.self, forKey: .name)
        self.type = try container.decodeIfPresent(String.self, forKey: .type) ?? "PUBLIC_HOLIDAY"
    }
}

// MARK: - Date Formatter Helper

extension DateFormatter {
    static let iso8601Day: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: "Asia/Dhaka")
        return formatter
    }()
}

// MARK: - TODO List

/*
 * TODO Implementation Tasks:
 * 1. Integrate with /api/holidays endpoint
 * 2. Cache holidays in CoreData
 * 3. Add tests for edge cases (leap year, timezone changes)
 * 4. Optimize for large date ranges
 * 5. Add support for partial holidays
 */

