# PINCA Design System

## Spacing Scale (Tailwind)
Base 4px. Approved values: 0.5(2px) 1(4px) 1.5(6px) 2(8px) 3(12px) 4(16px) 5(20px) 6(24px) 8(32px)

## Page Layout (REQUIRED on every Page component)
```jsx
<div className="flex flex-col w-full gap-4">
```

## Header Row (REQUIRED — with button)
```jsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
  <HeaderSection title="" subtitle="" description="" icon={Icon} breadcrumbs={[]} />
  <Button variant="black" icon={Plus}>Label</Button>
</div>
```

## Header Row (no button)
```jsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
  <HeaderSection ... />
</div>
```

## Tab Navigation
```jsx
<div className="flex items-center border-b border-zinc-200">
  <button className={`flex items-center gap-2 px-4 pb-3 pt-1 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${
    active ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-700 hover:border-zinc-300'
  }`}>
```

## Filter Container
```jsx
<div className="bg-white border border-zinc-100 rounded-2xl px-5 py-4 shadow-sm">
```

## Table/Content Container
```jsx
<div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
```

## KPI/Stats Grid
```jsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
```

## Card Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
```

## Buttons
- Use `<Button>` component — never raw `<button>` for primary actions
- Primary: `variant="black"` with `icon={Icon}`
- Square icon-only: `<ButtonSquare>`
- Padding: `px-5 py-2.5` · Radius: `rounded-xl` · Text: `text-sm font-semibold`

## Cards
- Background: `bg-white` · Border: `border border-zinc-100` · Radius: `rounded-2xl` · Shadow: `shadow-sm`
- Inline containers: `p-4` or `px-5 py-4`

## Radius
- Inputs, buttons, small elements: `rounded-xl`
- Cards, modals, panels: `rounded-2xl`
- Badges, pills: `rounded-full` or `rounded`

## Borders
- Card borders: `border-zinc-100`
- Input borders: `border-zinc-200/80`
- Dividers: `border-zinc-200`

## Typography
- Page title: `text-lg font-bold text-zinc-900` (handled by HeaderSection)
- Table header: `text-[10px] font-bold uppercase tracking-widest text-zinc-400`
- Body: `text-xs text-zinc-700`
- Secondary: `text-[10px] text-zinc-400`

## Depth (shadows)
- Cards: `shadow-sm`
- Modals/Drawers: `shadow-2xl`
- Buttons: `shadow-md` with color tint
- No `shadow-lg` on cards

## Colors
- Neutral: zinc scale (50→950)
- Success: emerald
- Info: blue
- Warning: amber
- Danger: red
- Secondary: violet
- Borders: zinc-100 (cards), zinc-200 (inputs/dividers)

## Violations to avoid
- `space-y-*` — use `flex flex-col gap-*` instead
- `rounded-lg` on cards — use `rounded-2xl`
- `border-zinc-200` on cards — use `border-zinc-100`
- Raw `<button>` for primary actions — use `<Button>`
- Missing `pb-2` on header row
- Missing `gap-4` on page root div
- Inline header `<h1>` — always use `<HeaderSection>`
