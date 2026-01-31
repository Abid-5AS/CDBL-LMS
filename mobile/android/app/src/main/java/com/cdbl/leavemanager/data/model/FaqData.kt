package com.cdbl.leavemanager.data.model

data class FaqItem(
    val question: String,
    val answer: String
)

object FaqData {
    val faqs = listOf(
        FaqItem(
            "How do I apply for leave?",
            "Navigate to 'Apply Leave' from the dashboard. Fill in the leave type, dates, and reason. Submit to send for approval."
        ),
        FaqItem(
            "What is the difference between CL and EL?",
            "Casual Leave (CL) is for short personal matters (max 3 days). Earned Leave (EL) accrues monthly and is for planned vacations."
        ),
        FaqItem(
            "Can I cancel a leave request?",
            "Yes, if it is still 'Pending'. Once approved, you cannot cancel directly; you may need to request cancellation."
        ),
        FaqItem(
            "How many days in advance for EL?",
            "For long leaves (>10 days), submit 30 days in advance. Policies vary by department."
        ),
        FaqItem(
            "What happens if my leave is rejected?",
            "You will be notified, and the days will not be deducted. You can re-apply with corrections."
        ),
        FaqItem(
            "Where can I see my balance?",
            "Your leave balance is on the Dashboard and 'My Leaves' screen."
        ),
        FaqItem(
            "Who approves my requests?",
            "Typically: Dept Head -> HR Admin -> HR Head -> CEO (depending on hierarchy)."
        ),
        FaqItem(
            "Can I apply for half-day leave?",
            "Currently, only full-day requests are supported via the app. Consult HR for half-days."
        )
    )
}
