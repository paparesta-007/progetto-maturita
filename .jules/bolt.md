## 2024-04-12 - Prevented expensive data transformation on every render in Popups
**Learning:** React Popups (`OptionsPopup` and `ModelPopup`) often trigger re-renders from minor user interactions or parent state changes. Performing an array `reduce` to group models on every render is a common, hidden performance bottleneck.
**Action:** Use `useMemo` to cache derived states (like grouping lists into dictionaries) when the source data (`filteredModels`) hasn't changed.
