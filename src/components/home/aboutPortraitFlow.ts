/** Extra space for editable copy in the desktop composition's fixed coordinates. */
export function getAboutPortraitFlow(introHeight: number, copyHeight: number) {
  const copyShift = Math.max(0, introHeight - 214)
  const bodyShift = copyShift + Math.max(0, copyHeight - 58)
  return { copyShift, bodyShift, sectionExtra: bodyShift * 0.9 }
}
