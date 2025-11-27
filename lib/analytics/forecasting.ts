interface HistoricalData {
    period: number; // e.g., timestamp or month index
    value: number;
}

interface ForecastResult {
    period: number;
    value: number;
    confidenceLower: number;
    confidenceUpper: number;
}

// Simple Linear Regression
export function linearRegressionForecast(
    history: HistoricalData[],
    periodsToForecast: number
): ForecastResult[] {
    const n = history.length;
    if (n < 2) return [];

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    history.forEach((point) => {
        sumX += point.period;
        sumY += point.value;
        sumXY += point.period * point.value;
        sumXX += point.period * point.period;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate standard error for confidence intervals
    const residuals = history.map(p => p.value - (slope * p.period + intercept));
    const stdError = Math.sqrt(residuals.reduce((a, b) => a + b * b, 0) / (n - 2));

    const forecast: ForecastResult[] = [];
    const lastPeriod = history[n - 1].period;

    for (let i = 1; i <= periodsToForecast; i++) {
        const nextPeriod = lastPeriod + i;
        const predicted = slope * nextPeriod + intercept;

        // 95% confidence interval (approx 1.96 * stdError)
        // Widening as we go further out
        const margin = 1.96 * stdError * Math.sqrt(1 + 1 / n + (Math.pow(nextPeriod - (sumX / n), 2) / sumXX));

        forecast.push({
            period: nextPeriod,
            value: Math.max(0, Math.round(predicted)),
            confidenceLower: Math.max(0, Math.round(predicted - margin)),
            confidenceUpper: Math.round(predicted + margin),
        });
    }

    return forecast;
}

// Simple Moving Average
export function movingAverageForecast(
    history: HistoricalData[],
    periodsToForecast: number,
    windowSize: number = 3
): ForecastResult[] {
    const forecast: ForecastResult[] = [];
    let currentHistory = [...history.map(h => h.value)];
    const lastPeriod = history[history.length - 1].period;

    for (let i = 1; i <= periodsToForecast; i++) {
        const window = currentHistory.slice(-windowSize);
        const avg = window.reduce((a, b) => a + b, 0) / window.length;

        forecast.push({
            period: lastPeriod + i,
            value: Math.round(avg),
            confidenceLower: Math.round(avg * 0.8), // Simple heuristic
            confidenceUpper: Math.round(avg * 1.2)
        });

        currentHistory.push(avg);
    }

    return forecast;
}
