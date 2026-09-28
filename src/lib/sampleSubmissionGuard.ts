export const SAMPLE_SUBMISSION_MESSAGES = {
  application: '샘플 화면입니다. 입단지원서는 접수되지 않습니다.',
  enquiry: '샘플 화면입니다. 문의는 접수되지 않습니다.',
  pledge: '샘플 화면입니다. 후원약정은 접수되지 않습니다.',
} as const

/** Preview forms may be edited and reviewed, but must never reach a live intake RPC. */
export function getSampleSubmissionMessage(
  kind: keyof typeof SAMPLE_SUBMISSION_MESSAGES,
  pathname = typeof window === 'undefined' ? '' : window.location.pathname,
) {
  return /^\/sample(?:\/|$)/.test(pathname) && !/^\/sample\/admin(?:\/|$)/.test(pathname)
    ? SAMPLE_SUBMISSION_MESSAGES[kind] : null
}
