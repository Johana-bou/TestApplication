import { toDisplay } from '../../utils/formatDate'
export function DateDisplay({ value }: { value: string }) {
  return <span>{toDisplay(value)}</span>
}
