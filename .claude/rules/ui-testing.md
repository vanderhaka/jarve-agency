# UI Testing with Claude in Chrome

> Use Claude in Chrome browser automation to replace manual UI testing wherever possible.

## Core Principle

**Automate first, manual test only when automation cannot verify the behavior.**

Claude in Chrome can interact with web pages like a real user - filling forms, clicking buttons, navigating tabs, verifying content. Use this capability to validate UI behaviors without human intervention.

---

## When to Use Claude in Chrome Testing

### Always Automate These
- Form input validation (text, numbers, dates, emails)
- Button clicks and navigation flows
- Tab switching and modal interactions
- Dropdown/select menu selections
- Checkbox and radio button states
- Error message display verification
- Loading state transitions
- Toast/notification appearances
- URL routing and navigation
- Responsive layout checks (via resize_window)
- Accessibility tree verification

### May Require Manual Testing
- Complex drag-and-drop interactions
- Canvas/WebGL rendering
- Audio/video playback verification
- Print layout
- Native file dialogs (use file inputs instead)

---

## Testing Workflow

### 1. Start Testing Session

```bash
# Get current browser context
mcp__claude-in-chrome__tabs_context_mcp (createIfEmpty: true)

# Create dedicated test tab
mcp__claude-in-chrome__tabs_create_mcp

# Navigate to test target
mcp__claude-in-chrome__navigate (url: "http://localhost:3000/page-to-test")
```

### 2. Wait for Page Load

```bash
# Take screenshot to verify page loaded
mcp__claude-in-chrome__computer (action: "screenshot")

# Or read page structure
mcp__claude-in-chrome__read_page (tabId: X)
```

### 3. Interact with Elements

```bash
# Find elements by purpose
mcp__claude-in-chrome__find (query: "email input field")

# Fill form fields
mcp__claude-in-chrome__form_input (ref: "ref_1", value: "test@example.com")

# Click buttons
mcp__claude-in-chrome__computer (action: "left_click", ref: "ref_2")

# Or click by coordinates
mcp__claude-in-chrome__computer (action: "left_click", coordinate: [X, Y])
```

### 4. Verify Results

```bash
# Screenshot after action
mcp__claude-in-chrome__computer (action: "screenshot")

# Check page content
mcp__claude-in-chrome__read_page (tabId: X)

# Check for specific text
mcp__claude-in-chrome__get_page_text (tabId: X)

# Verify console for errors
mcp__claude-in-chrome__read_console_messages (tabId: X, onlyErrors: true)
```

---

## Common Test Patterns

### Form Validation Testing

```markdown
## Test: Email validation

1. Navigate to form page
2. Find email input
3. Enter invalid email: "notanemail"
4. Click submit
5. Screenshot - verify error message appears
6. Enter valid email: "user@example.com"
7. Click submit
8. Screenshot - verify form proceeds
```

### Tab Navigation Testing

```markdown
## Test: Tab switching

1. Navigate to tabbed interface
2. Screenshot initial state (Tab 1 active)
3. Find Tab 2 element
4. Click Tab 2
5. Screenshot - verify Tab 2 content visible
6. Verify Tab 1 content hidden
7. Click Tab 1
8. Screenshot - verify Tab 1 active again
```

### Modal/Dialog Testing

```markdown
## Test: Modal open/close

1. Find "Open Modal" button
2. Click button
3. Wait 0.5s for animation
4. Screenshot - verify modal visible
5. Find close button (X or "Cancel")
6. Click close
7. Wait 0.5s for animation
8. Screenshot - verify modal closed
```

### Error State Testing

```markdown
## Test: API error handling

1. Navigate to page that makes API calls
2. Use JavaScript to mock failed response:
   mcp__claude-in-chrome__javascript_tool (
     text: "window.fetch = () => Promise.reject(new Error('Network error'))"
   )
3. Trigger action that calls API
4. Screenshot - verify error message/toast
5. Check console for error logging
```

### Responsive Layout Testing

```markdown
## Test: Mobile responsive layout

1. Resize window to mobile: resize_window (width: 375, height: 812)
2. Screenshot - verify mobile layout
3. Check navigation becomes hamburger menu
4. Resize to tablet: resize_window (width: 768, height: 1024)
5. Screenshot - verify tablet layout
6. Resize to desktop: resize_window (width: 1920, height: 1080)
7. Screenshot - verify desktop layout
```

---

## Best Practices

### Element Selection Priority

1. **Use `find` with descriptive queries** - Most reliable
   ```bash
   find (query: "submit button", tabId: X)
   ```

2. **Use `read_page` + refs** - For complex pages
   ```bash
   read_page (tabId: X, filter: "interactive")
   ```

3. **Use coordinates** - Last resort, after screenshot verification
   ```bash
   computer (action: "left_click", coordinate: [500, 300])
   ```

### Wait Strategies

```bash
# Wait for animations/transitions
computer (action: "wait", duration: 0.5)

# Wait for API responses
computer (action: "wait", duration: 2)

# Verify with screenshot after wait
computer (action: "screenshot")
```

### Console Monitoring

```bash
# Check for JavaScript errors after each action
read_console_messages (tabId: X, onlyErrors: true, pattern: "error|Error|fail")

# Clear console between test phases
read_console_messages (tabId: X, clear: true)
```

### Network Verification

```bash
# Verify API calls were made
read_network_requests (tabId: X, urlPattern: "/api/")

# Check for failed requests
read_network_requests (tabId: X, urlPattern: "/api/", limit: 10)
```

---

## Test Evidence Collection

### GIF Recording for Test Documentation

```bash
# Start recording before test sequence
gif_creator (action: "start_recording", tabId: X)

# Take initial screenshot
computer (action: "screenshot")

# Perform test steps...
# Each action is captured

# Stop recording
gif_creator (action: "stop_recording", tabId: X)

# Export with meaningful name
gif_creator (action: "export", tabId: X, filename: "form-validation-test.gif", download: true)
```

### Screenshot Naming Convention

When describing screenshots in test reports:
- `screenshot-{feature}-{state}.png`
- Example: `screenshot-login-form-error-state.png`

---

## Accessibility Testing

```bash
# Get full accessibility tree
read_page (tabId: X, filter: "all")

# Check for interactive elements
read_page (tabId: X, filter: "interactive")

# Verify ARIA labels present
# Look for: aria-label, aria-describedby, role attributes
```

### Key Accessibility Checks

1. All interactive elements have accessible names
2. Focus order is logical (test with Tab key)
3. Error messages are associated with inputs
4. Color is not only indicator of state
5. Sufficient color contrast (verify visually)

---

## Integration with TESTING.md

After Claude in Chrome tests complete, document results:

```markdown
## Browser Automation Test Results

| Test Case | Status | Evidence |
|-----------|--------|----------|
| Form validation | PASS | screenshot-form-validation.png |
| Tab navigation | PASS | tab-test.gif |
| Error handling | PASS | screenshot-error-state.png |
| Mobile responsive | PASS | responsive-test.gif |

### Console Errors: None detected
### Network Failures: None detected
```

---

## Troubleshooting

### Element Not Found
1. Take screenshot to verify page state
2. Use broader `find` query
3. Wait for dynamic content to load
4. Check if element is in shadow DOM (may need JavaScript)

### Click Not Working
1. Verify coordinates with screenshot
2. Scroll element into view first: `scroll_to (ref: "ref_X")`
3. Check for overlaying elements (modals, popups)
4. Try clicking center of element

### Form Input Not Working
1. Verify element is a valid input type
2. Click to focus first, then type
3. Check for readonly/disabled attributes
4. Try `form_input` instead of `type`

### Tests Timing Out
1. Add explicit waits between actions
2. Check network tab for slow responses
3. Verify dev server is running
4. Check console for blocking errors

---

## Quick Reference

| Action | Tool | Key Parameters |
|--------|------|----------------|
| Navigate | `navigate` | url, tabId |
| Screenshot | `computer` | action: "screenshot" |
| Click | `computer` | action: "left_click", ref OR coordinate |
| Type | `computer` | action: "type", text |
| Fill input | `form_input` | ref, value |
| Find element | `find` | query, tabId |
| Read page | `read_page` | tabId, filter |
| Get text | `get_page_text` | tabId |
| Check console | `read_console_messages` | tabId, pattern |
| Check network | `read_network_requests` | tabId, urlPattern |
| Wait | `computer` | action: "wait", duration |
| Resize | `resize_window` | width, height |
| Record GIF | `gif_creator` | action, tabId |
| Run JS | `javascript_tool` | text, tabId |
