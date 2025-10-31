# Web App Design Tokens

Reference for iOS app to maintain visual consistency.

## Color System (oklch)

### Light Mode:
- **Background**: `oklch(1 0 0)` - Pure white
- **Foreground**: `oklch(0.129 0.042 264.695)` - Dark blue-gray
- **Primary**: `oklch(0.208 0.042 265.755)` - Dark blue
- **Primary Foreground**: `oklch(0.984 0.003 247.858)` - Near white
- **Secondary**: `oklch(0.968 0.007 247.896)` - Very light gray
- **Secondary Foreground**: `oklch(0.208 0.042 265.755)` - Dark blue
- **Muted**: `oklch(0.968 0.007 247.896)` - Light gray background
- **Muted Foreground**: `oklch(0.554 0.046 257.417)` - Medium gray text
- **Destructive**: `oklch(0.577 0.245 27.325)` - Red
- **Border**: `oklch(0.929 0.013 255.508)` - Light gray border
- **Input**: `oklch(0.929 0.013 255.508)` - Input border
- **Ring**: `oklch(0.704 0.04 256.788)` - Focus ring

### Dark Mode:
- **Background**: `oklch(0.129 0.042 264.695)` - Dark blue-gray
- **Foreground**: `oklch(0.984 0.003 247.858)` - Near white
- **Primary**: `oklch(0.929 0.013 255.508)` - Light gray
- **Card**: `oklch(0.208 0.042 265.755)` - Darker blue-gray
- **Border**: `oklch(1 0 0 / 10%)` - Subtle white border
- **Destructive**: `oklch(0.704 0.191 22.216)` - Brighter red

## Spacing Scale

Tailwind to iOS conversion:
- `gap-6` = 24pt (1.5rem = 24px)
- `gap-4` = 16pt (1rem = 16px)
- `p-6` = 24pt padding
- `p-4` = 16pt padding
- `space-y-6` = 24pt vertical spacing
- `space-y-4` = 16pt vertical spacing
- `space-y-2` = 8pt vertical spacing

## Border Radius

- `rounded-xl` = 12pt (0.625rem * 2 = 10px, but typically 12pt in iOS)
- `rounded-lg` = 8pt (0.625rem = 10px, but typically 8pt in iOS)
- `rounded-md` = 6pt
- `rounded-sm` = 4pt

## Typography

### Font Sizes (Web → iOS):
- `text-xl` = `.title` (20pt) - Large headings
- `text-lg` = `.title2` (18pt) - Section headings
- `text-sm` = `.caption` (12pt) - Small text, labels
- `text-xs` = `.caption2` (10pt) - Tiny text

### Font Weights:
- `font-semibold` = `.semibold` (600)
- `font-medium` = `.medium` (500)
- Regular = `.regular` (400)

## Shadows

- `shadow-sm` = Subtle shadow (radius: 1-2pt, opacity: 0.1)
- `shadow-md` = Medium shadow (radius: 4pt, opacity: 0.15)
- `shadow-xs` = Very subtle (radius: 1pt, opacity: 0.05)

## Component Styling

### Cards:
```
Web: rounded-xl border border-slate-200 bg-white p-6 shadow-sm
iOS: .cornerRadius(12), .border(.ultraThinMaterial), .padding(24), .shadow(radius: 2)
```

### Buttons:
```
Web: rounded-md h-9 px-4 py-2 bg-primary text-primary-foreground
iOS: .cornerRadius(8), .frame(height: 36), .padding(.horizontal, 16), .padding(.vertical, 8)
```

### Form Fields:
```
Web: border border-slate-200 h-10 rounded-md
iOS: .border(.ultraThinMaterial), .frame(height: 40), .cornerRadius(8)
```

## iOS Adaptation Notes

Since iOS uses Liquid Glass design:
- Use `.ultraThinMaterial` backgrounds instead of solid colors
- Use system adaptive colors for primary/secondary
- Apply `.glassEffect()` for cards and badges
- Maintain spacing scale (16pt, 24pt) to match web
- Use similar corner radius values (8pt, 12pt)

