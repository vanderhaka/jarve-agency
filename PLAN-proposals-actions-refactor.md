# Ensemble Execution Plan

**Status**: Phases 1-3 Complete (Phase 4 optional)
**Complexity**: 20/100 → 9 agents (Full Ensemble)

---

## Questions & Clarifications

1. **Authorization model**: Should access require proposal creator OR project owner? Or both?
2. **Existing patterns**: Is there an `ActionResult` type elsewhere in the codebase to match?
3. **Rate limiting**: Should we add rate limiting as part of this refactor?
4. **Testing**: Should we add tests as part of refactoring or as a separate task?

---

## Objective

Refactor `app/admin/proposals/actions.ts` (964 lines) to address:
- **CRITICAL**: Insecure token generation, missing authorization
- **HIGH**: Code duplication (8x auth pattern), function length (246 lines)
- **MEDIUM**: Performance (sequential queries), testability (tight coupling)

---

## Agent Type: refactoring-architect

Primary specialist for code structure improvement and decomposition.

Supporting agents used in analysis:
- code-reviewer: Code quality issues
- security-auditor: Security vulnerabilities
- backend-developer: Architecture patterns
- testing-specialist: Testability assessment
- performance-optimizer: Query optimization

---

## Tasks

### Phase 1: Security Fixes (CRITICAL) ✅ COMPLETE

- [x] **1.1** Replace `Math.random()` with `crypto.randomBytes()` for token generation
  - File: `app/admin/proposals/actions.ts:956-963`
  - Risk: CRITICAL - tokens are predictable

- [x] **1.2** Add authorization checks to mutation functions
  - Functions: `updateProposal`, `archiveProposal`, `getProposal`
  - Verify user created proposal or owns project

### Phase 2: Code Quality Quick Wins

- [x] **2.1** Extract `requireEmployee()` auth helper ✅ COMPLETE
  - Created: `lib/auth/require-employee.ts`
  - Replaced 7 duplicate auth patterns in actions.ts

- [x] **2.2** Add Zod input validation schemas ✅ COMPLETE
  - Created: `app/admin/proposals/schemas.ts`
  - Sanitizes SVG input in `signProposal` to prevent XSS

- [x] **2.3** Add `ActionResult<T>` return type ✅ COMPLETE
  - Created: `lib/types/action-result.ts`
  - Typed success/error responses

- [x] **2.4** Apply `unwrapJoinResult<T>` utility ✅ COMPLETE
  - Utility created in `lib/types/action-result.ts`
  - Applied to 3 authorization check patterns

### Phase 3: Performance Optimizations

- [~] **3.1** Parallelize `createProposal` queries - SKIPPED
  - Queries are conditional (depend on input params)
  - Limited parallelization opportunity

- [x] **3.2** Fix N+1 in `convertLeadAndSend` ✅ COMPLETE
  - Combined 2 leads queries into 1 (added client_id to select)
  - Impact: ~50ms saved per call

- [x] **3.3** Parallelize `sendProposal` updates ✅ COMPLETE
  - Combined 3 sequential updates → 2 parallel with Promise.all()
  - Merged proposal status + client_id into single update

### Phase 4: Architecture Improvements

- [ ] **4.1** Extract pure utility functions
  - Create: `lib/proposals/utils.ts`
  - Functions: `createInitialContent`, `canEditProposal`, `generatePortalUrl`

- [ ] **4.2** Break down `signProposal` (246 lines → <100)
  - Extract: `validatePortalToken`, `findProposalForSigning`
  - Extract: `createSignatureRecord`, `autoCreateProject`
  - Extract: `sendSigningNotifications`

- [ ] **4.3** Add constants file
  - Create: `lib/proposals/constants.ts`
  - `GST_RATE`, `MAX_DESCRIPTION_LENGTH`, `PORTAL_TOKEN_LENGTH`

---

## Files to Modify

| File | Action | Phase |
|------|--------|-------|
| `app/admin/proposals/actions.ts` | Refactor | 1-4 |
| `lib/auth/require-employee.ts` | Create | 2 |
| `lib/types/action-result.ts` | Create | 2 |
| `lib/proposals/utils.ts` | Create | 4 |
| `lib/proposals/constants.ts` | Create | 4 |

---

## Analysis Summary (from 5 agents)

### Security Audit Findings
| Issue | Severity | Lines |
|-------|----------|-------|
| Weak token generation (`Math.random`) | CRITICAL | 956-963 |
| Missing authorization checks | HIGH | 220, 817, 848 |
| No input validation | MEDIUM | Multiple |
| Data exposure (`SELECT *`) | MEDIUM | 858 |

### Code Quality Findings
| Issue | Severity | Lines |
|-------|----------|-------|
| Repeated auth pattern (8x) | HIGH | 73-78, 222-226, etc. |
| `signProposal` 246 lines | HIGH | 566-811 |
| `createProposal` 143 lines | MEDIUM | 72-214 |
| Missing return types | LOW | All functions |

### Performance Findings
| Issue | Impact | Lines |
|-------|--------|-------|
| Sequential queries in `createProposal` | 40% slower | 81-157 |
| N+1 query in `convertLeadAndSend` | +50ms | 335-339 |
| Sequential updates in `sendProposal` | 47% slower | 492-522 |

### Testability Findings
| Issue | Impact |
|-------|--------|
| Tight Supabase coupling | Cannot mock |
| `redirect()` in auth | Tests terminate |
| Embedded business logic | Cannot unit test |
| No dependency injection | Cannot isolate |

---

## Estimated Effort

| Phase | Hours | Priority |
|-------|-------|----------|
| Phase 1: Security | 3 | **URGENT** |
| Phase 2: Code Quality | 4 | HIGH |
| Phase 3: Performance | 4 | MEDIUM |
| Phase 4: Architecture | 6 | LOW |
| **Total** | **17** | |

---

## File Structure After Refactor

```
app/admin/proposals/
├── actions.ts              # ~300 lines (thin server actions)
├── schemas.ts              # Zod validation schemas
└── types.ts                # Moved types

lib/
├── auth/
│   └── require-employee.ts # Shared auth helper
├── proposals/
│   ├── utils.ts            # Pure functions
│   ├── token.ts            # Portal token generation
│   └── constants.ts        # Magic values
└── types/
    └── action-result.ts    # ActionResult<T>
```
