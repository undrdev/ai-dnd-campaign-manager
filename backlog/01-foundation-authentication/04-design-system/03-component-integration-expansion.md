# Component Integration and Library Expansion

## Story
**As a** developer  
**I want** to integrate the new UI components into existing pages and expand the library with commonly needed components  
**So that** the application has consistent styling throughout and all necessary UI patterns are available

## Acceptance Criteria
- [ ] Replace existing form inputs with AppInput components across all pages
- [ ] Replace existing buttons with AppButton components
- [ ] Integrate AppCard components where appropriate
- [ ] Replace existing modals/dialogs with AppModal
- [ ] Add missing input types (textarea, select, checkbox, radio, toggle)
- [ ] Add missing display components (tooltip, popover, alert, progress)
- [ ] Add missing navigation components (tabs, breadcrumb enhancements)
- [ ] Add missing feedback components (skeleton loaders, empty states)
- [ ] Ensure consistent spacing and typography using design tokens
- [ ] Test all component integrations work correctly

## Technical References
- **Design System**: Cross-Platform Design System - Component Integration
- **UI Specification**: Vue.js Web Application - Component Usage
- **Playbook Reference**: Phase 1, Week 2, Day 6-7: Component Integration
- **Existing Pages**: Authentication pages, layout components, dashboard structure

## Implementation Details

### Phase 1: Integration of Existing Components

#### Authentication Pages Integration
```vue
<!-- pages/auth/login.vue - Before -->
<VTextField v-model="email" type="email" label="Email" />
<VBtn @click="login">Login</VBtn>

<!-- pages/auth/login.vue - After -->
<AppInput 
  v-model="email" 
  type="email" 
  label="Email" 
  prepend-icon="mdi-email"
  :rules="emailRules"
/>
<AppButton @click="login" color="primary" size="lg">
  Login
</AppButton>
```

#### Layout Components Integration
```vue
<!-- components/layout/AppHeader.vue - Enhanced -->
<AppButton 
  variant="text" 
  prepend-icon="mdi-menu"
  @click="toggleSidebar"
  aria-label="Toggle sidebar"
/>
<AppAvatar 
  :src="user.avatar" 
  :text="user.initials"
  size="md"
  interactive
  @click="openUserMenu"
/>
```

### Phase 2: Additional Components Library

#### Form Components (`components/forms/`)
```
FormTextarea.vue      # Multi-line text input
FormSelect.vue        # Dropdown selection
FormCheckbox.vue      # Checkbox input
FormRadio.vue         # Radio button group
FormToggle.vue        # Toggle switch
FormDatePicker.vue    # Date selection
FormFileUpload.vue    # File upload with drag & drop
FormColorPicker.vue   # Color selection
FormSlider.vue        # Range slider
FormRating.vue        # Star rating component
```

#### Display Components (`components/ui/`)
```
AppTooltip.vue        # Contextual information
AppPopover.vue        # Floating content panels
AppAlert.vue          # Status messages
AppProgress.vue       # Progress indicators
AppSkeleton.vue       # Loading placeholders
AppEmptyState.vue     # No data states
AppDataTable.vue      # Sortable, filterable tables
AppPagination.vue     # Page navigation
AppBreadcrumb.vue     # Enhanced navigation breadcrumbs
AppTabs.vue           # Tabbed content
```

#### Feedback Components (`components/feedback/`)
```
AppConfirmDialog.vue  # Confirmation dialogs
AppSnackbar.vue       # Toast notifications
AppSpinner.vue        # Loading spinners
AppStatusBadge.vue    # Status indicators
AppInfoPanel.vue      # Information displays
```

#### D&D Specific Components (`components/dnd/`)
```
CharacterSheet.vue    # Character information display
SpellCard.vue         # Spell information cards
AbilityScore.vue      # Ability score display with modifiers
HealthBar.vue         # HP/resource bars
InitiativeTracker.vue # Combat initiative ordering
StatBlock.vue         # Monster/NPC stat blocks
InventoryGrid.vue     # Equipment management
CampaignSummary.vue   # Campaign overview cards
```

### Component Priority Matrix

#### High Priority (Immediate Need)
1. **FormTextarea** - Multi-line text for descriptions
2. **FormSelect** - Dropdowns for character classes, races, etc.
3. **FormCheckbox/Radio** - Options selection
4. **AppAlert** - System notifications and validation feedback
5. **AppTooltip** - Help text and explanations
6. **AppTabs** - Organize content sections
7. **AppEmptyState** - When no campaigns/characters exist

#### Medium Priority (Next Sprint)
1. **FormDatePicker** - Campaign scheduling
2. **AppDataTable** - Lists of campaigns, characters, NPCs
3. **AppPagination** - Large data sets
4. **FormFileUpload** - Character portraits, campaign assets
5. **AppConfirmDialog** - Delete confirmations
6. **AppProgress** - Loading states for AI generation

#### Low Priority (Future Enhancement)
1. **FormColorPicker** - Theme customization
2. **FormSlider** - Numeric ranges (HP, stats)
3. **FormRating** - Campaign/session ratings
4. **AppSkeleton** - Advanced loading states
5. **D&D Specific Components** - Game-specific UI

### Integration Plan

#### Week 1: Core Integration
- Replace all existing form inputs in authentication pages
- Update layout components to use new button/avatar components
- Integrate AppCard in dashboard areas
- Replace existing modals with AppModal

#### Week 2: Essential Additions
- Implement FormTextarea, FormSelect, FormCheckbox
- Create AppAlert for validation feedback
- Add AppTooltip for help text
- Implement AppTabs for content organization

#### Week 3: Enhanced UX
- Add AppEmptyState for no-data scenarios
- Implement AppDataTable for lists
- Create FormDatePicker for scheduling
- Add AppConfirmDialog for destructive actions

### Design Token Integration
All new components must:
- Use CSS custom properties from design token system
- Support light/dark themes
- Follow spacing scale (--spacing-*)
- Use typography scale (--font-size-*, --line-height-*)
- Implement color system (--color-*)
- Include animation tokens (--duration-*, --easing-*)

### Accessibility Requirements
Each component must include:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- High contrast mode support
- Reduced motion alternatives

### Testing Strategy
- Visual regression testing for component replacements
- Accessibility testing with screen readers
- Cross-browser compatibility testing
- Mobile responsiveness validation
- Theme switching verification

## File Structure After Implementation
```
components/
├── ui/
│   ├── AppButton.vue ✓
│   ├── AppCard.vue ✓
│   ├── AppBadge.vue ✓
│   ├── AppInput.vue ✓
│   ├── AppModal.vue ✓
│   ├── AppAvatar.vue ✓
│   ├── AppLoading.vue ✓
│   ├── AppNotification.vue ✓
│   ├── AppTooltip.vue [NEW]
│   ├── AppPopover.vue [NEW]
│   ├── AppAlert.vue [NEW]
│   ├── AppProgress.vue [NEW]
│   ├── AppSkeleton.vue [NEW]
│   ├── AppEmptyState.vue [NEW]
│   ├── AppDataTable.vue [NEW]
│   ├── AppPagination.vue [NEW]
│   └── AppTabs.vue [NEW]
├── forms/
│   ├── FormField.vue ✓
│   ├── FormTextarea.vue [NEW]
│   ├── FormSelect.vue [NEW]
│   ├── FormCheckbox.vue [NEW]
│   ├── FormRadio.vue [NEW]
│   ├── FormToggle.vue [NEW]
│   ├── FormDatePicker.vue [NEW]
│   ├── FormFileUpload.vue [NEW]
│   └── FormRating.vue [NEW]
├── feedback/
│   ├── AppConfirmDialog.vue [NEW]
│   ├── AppSnackbar.vue [NEW]
│   └── AppStatusBadge.vue [NEW]
├── layout/
│   ├── AppHeader.vue [UPDATED]
│   ├── AppSidebar.vue [UPDATED]
│   ├── AppFooter.vue [UPDATED]
│   ├── AppLayout.vue [UPDATED]
│   └── AppBreadcrumb.vue [UPDATED]
└── dnd/
    ├── DiceRoller.vue ✓
    ├── CharacterSheet.vue [FUTURE]
    ├── SpellCard.vue [FUTURE]
    ├── AbilityScore.vue [FUTURE]
    └── StatBlock.vue [FUTURE]
```

## Dependencies
- **Depends on**: 02-ui-components-library.md, 01-design-tokens-implementation.md
- **Blocks**: Feature development that requires consistent UI components

## Estimated Effort
**12 hours** - Component integration (4h) + new components (8h) + testing (2h)

## Success Metrics
- All existing pages use new component library
- No visual regressions from component replacements
- Consistent design token usage across all components
- Accessibility compliance maintained
- Performance impact is minimal
- Developer experience is improved with reusable components
