## ADDED Requirements

### Requirement: Standardized Primary Button Theme
All primary action buttons across the application SHALL use the Manchester City theme to ensure high contrast and visual consistency.

#### Scenario: Primary button contrast
- **WHEN** a button is identified as a primary action (previously using `bg-slate-900` or `bg-indigo-900`)
- **THEN** it MUST use the `.bg-mancity-pattern` class for its background
- **AND** it MUST use the `.text-primary-foreground` class for its text to ensure readability

### Requirement: Standardized Header and Banner Theme
High-impact visual containers such as dialog headers, card banners, and summary sections SHALL use the Manchester City theme instead of legacy dark backgrounds.

#### Scenario: Dialog header update
- **WHEN** a dialog header or banner is using legacy dark backgrounds (`bg-slate-900` or `bg-indigo-900`)
- **THEN** it MUST be updated to use `.bg-mancity-pattern`
- **AND** it MUST use `.text-primary-foreground` for all contained labels and text elements

### Requirement: Interactive State Feedback
Buttons using the Manchester City theme SHALL provide clear visual feedback during hover and active states while maintaining text readability.

#### Scenario: Button hover state
- **WHEN** a user hovers over a Manchester City themed button
- **THEN** the background opacity SHOULD change (e.g., `hover:opacity-90`)
- **AND** the text MUST remain clearly readable using Dark Navy (`text-primary-foreground`)
