import assert from 'node:assert/strict'
import test from 'node:test'

import { careerRoleSelectionReducer, initialCareerRoleIndex } from './careerRoleSelection.ts'

test('a valid role selection becomes active and an invalid selection preserves the current role', () => {
  assert.equal(initialCareerRoleIndex, 0)
  assert.equal(careerRoleSelectionReducer(0, { index: 2, roleCount: 3, type: 'select' }), 2)
  assert.equal(careerRoleSelectionReducer(2, { index: -1, roleCount: 3, type: 'select' }), 2)
  assert.equal(careerRoleSelectionReducer(2, { index: 3, roleCount: 3, type: 'select' }), 2)
})
