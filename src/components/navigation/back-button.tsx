import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

type BackButtonProps = {
  /** Ruta fallback cuando no hay historial (o si quieres forzar destino). */
  to?: string
  label?: string
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
  className?: string
}

export function BackButton({
  to = '/',
  label = 'Volver',
  variant = 'outline',
  size = 'icon',
  className,
}: BackButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    // window.history.length suele ser 1 cuando se entra directo (sin "atrás")
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(to)
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      aria-label={label}
      className={cn(className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {size !== 'icon' ? <span className="ml-2">{label}</span> : null}
    </Button>
  )
}
