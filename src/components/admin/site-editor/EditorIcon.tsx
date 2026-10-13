import undo from '../../../assets/editor-icons/undo.svg'
import redo from '../../../assets/editor-icons/redo.svg'
import renew from '../../../assets/editor-icons/renew.svg'
import search from '../../../assets/editor-icons/search.svg'

const icons = { undo, redo, renew, search }

/** Official Carbon assets; keep text labels as the accessible action names. */
export function EditorIcon({ name }: { name: keyof typeof icons }) {
  return <img className="site-editor__icon" src={icons[name]} width={16} height={16} alt="" aria-hidden="true" />
}
