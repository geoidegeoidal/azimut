## verdict

1. **Resolved — FORM / reduced-motion pointer response:** the header hover rotation now exists only inside `@media (prefers-reduced-motion: no-preference)`. The existing reduce override and pointer-handler guard remain. The replacement browser report explicitly passes `reducedMotionKeepsHeaderNeedleSteady`; all seven exact capture paths were reopened, remain valid and retain the visible bearing and reviewed composition.

## remaining

Clear. No regression introduced by this fix is visible in the replacement captures. Ship earned here covers the scored fixes, not the whole surface.

disposition: ship
