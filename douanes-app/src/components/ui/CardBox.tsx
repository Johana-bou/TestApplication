interface Props { children: React.ReactNode; className?: string; padding?: boolean }
export function CardBox({ children, className = '', padding = true }: Props) {
  return (
    <div className={`card-box ${padding ? 'pd-20' : ''} ${className}`}>
      {children}
    </div>
  )
}
