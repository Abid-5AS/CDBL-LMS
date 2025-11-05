# CDBL Leave Management - Android App

## 📚 Documentation

All policy documentation and source of truth files are located in the `docs/` directory:

### Policy Logic (Source of Truth)
- **Location**: `docs/Policy Logic/`
- **Start Here**: `docs/Policy Logic/README.md` - Complete index of all policy rules
- **Source of Truth**: `docs/Policy Logic/SourceOfTruth.md` - Official HR Policy Manual extract

### Key Documentation Files
- `docs/Policy_Implementation_Map.md` - Maps policy clauses to code implementation
- `docs/Validation_Rules.md` - Validation rules summary
- `docs/LeavePolicy_CDBL.md` - HR Policy Manual reference

### Policy Logic Documents (12 Parts)
1. `docs/Policy Logic/01-Leave Types and Entitlements.md`
2. `docs/Policy Logic/02-Leave Application Rules and Validation.md`
3. `docs/Policy Logic/03-Holiday and Weekend Handling.md`
4. `docs/Policy Logic/04-Leave Balance and Accrual Logic.md`
5. `docs/Policy Logic/05-File Upload and Medical Certificate Rules.md`
6. `docs/Policy Logic/06-Approval Workflow and Chain.md`
7. `docs/Policy Logic/07-Cancellation and Modification Rules.md`
8. `docs/Policy Logic/08-Date Time and Display Logic.md`
9. `docs/Policy Logic/09-Role Based Behavior.md`
10. `docs/Policy Logic/10-System Messages and Error Handling.md`
11. `docs/Policy Logic/11-Miscellaneous Business Rules.md`
12. `docs/Policy Logic/12-Source Mapping Index.md`

### Important Notes
- **Policy Version**: v2.0
- **Timezone**: All dates must use Asia/Dhaka timezone
- **EL Notice**: ≥5 working days (not calendar days)
- **EL Entitlement**: 24 days/year (2 days/month × 12 months)

## 🏗️ Architecture

This Android app follows the same policy logic as the web application (Next.js) and iOS app (SwiftUI).

### UI Framework
- **Jetpack Compose** (recommended) - Modern declarative UI
- Kotlin 2.0.21

### Key Policy Rules to Implement
- EL advance notice: ≥5 working days (excludes Fri/Sat/holidays)
- CL consecutive limit: ≤3 days
- CL cannot touch holidays/weekends on start/end dates
- ML certificate required if >3 days
- All dates normalized to Asia/Dhaka midnight

## 🔗 Related Documentation
- Web App: `/docs/Policy Logic/`
- iOS App: `/docs/mobile/`

