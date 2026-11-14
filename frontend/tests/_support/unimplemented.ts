/**
 * Marks an expected product feature that is not implemented yet.
 * Jest reports these as TODO (warning); they do not fail CI.
 * Use only for stubbed/absent behavior — not for tests you have not written yet.
 */
export function testUnimplemented(description: string): void {
    test.todo(`[unimplemented] ${description}`);
}
