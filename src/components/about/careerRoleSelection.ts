export const initialCareerRoleIndex = 0

export interface CareerRoleSelectionAction {
  index: number
  roleCount: number
  type: 'select'
}

export function careerRoleSelectionReducer(
  currentIndex: number,
  action: CareerRoleSelectionAction,
) {
  const isValidSelection = Number.isInteger(action.index)
    && action.index >= 0
    && action.index < action.roleCount

  return isValidSelection ? action.index : currentIndex
}
