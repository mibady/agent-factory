# Pattern 01: Discovery Log

## When to Use This Pattern
- First time exploring a new problem
- Don't know what the solution looks like yet
- Testing ideas manually before automation
- Quick experiments that might not be repeated

## Discovery Template

### Problem Statement
<!-- What are you trying to solve? -->


### Initial Observations
<!-- What do you know so far? -->


### Manual Tests Performed
<!-- What have you tried? Copy-paste your prompts and results here -->

#### Test 1
**Prompt:**
```
[Your prompt here]
```

**Result:**
```
[AI response here]
```

**Notes:**
- What worked?
- What didn't work?
- What surprised you?

#### Test 2
**Prompt:**
```
[Your prompt here]
```

**Result:**
```
[AI response here]
```

**Notes:**
-

### Patterns Emerging
<!-- After 3+ manual tests, do you see a pattern? -->
-
-
-

### Decision Point
After running manual tests, ask yourself:
- [ ] Will I need to do this again? → Move to Pattern 02 (Reusable)
- [ ] Is this too complex for one prompt? → Move to Pattern 03 (Sub-Agents)
- [ ] Do I need external APIs/tools? → Move to Pattern 04 (MCP Wrapper)
- [ ] Is this becoming a product? → Move to Pattern 05 (Full App)

### Next Steps
<!-- Based on your discovery, what's the next action? -->
1.
2.
3.

---

## Example Discovery Log

### Problem Statement
I need to extract key insights from customer support tickets and categorize them.

### Initial Observations
- We have 500+ tickets per week
- They come in various formats (email, chat, form submissions)
- Categories aren't well-defined yet

### Manual Tests Performed

#### Test 1
**Prompt:**
```
Analyze this support ticket and extract key information:
"Hi, I can't login to my account. I tried resetting my password but the email never arrived. Username: john@example.com"
```

**Result:**
```
Category: Authentication Issue
Subcategory: Password Reset
User: john@example.com
Severity: High
Action Required: Check email delivery logs
```

**Notes:**
- Structure looks good
- Need to standardize categories
- Should add sentiment analysis

### Decision Point
✅ This will be done daily → Moving to Pattern 02 (Reusable Script)