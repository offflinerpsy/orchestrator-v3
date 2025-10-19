/**
 * Toast notifications — Sonner integration
 * 
 * USAGE:
 * import { toast } from '@/components/ui/use-toast'
 * 
 * toast({ title: 'Success!', description: 'IGNITE started' })
 * toast({ title: 'Error', description: 'Failed', variant: 'destructive' })
 * 
 * OR use sonner directly:
 * import { toast } from 'sonner'
 * toast.success('Success!')
 * toast.error('Error!')
 */

import { toast as sonnerToast } from 'sonner'

type ToastVariant = 'default' | 'destructive'

interface ToastProps {
  title: string
  description?: string
  variant?: ToastVariant
}

export function useToast() {
  const toast = (props: ToastProps) => {
    if (props.variant === 'destructive') {
      sonnerToast.error(props.title, {
        description: props.description,
      })
    } else {
      sonnerToast.success(props.title, {
        description: props.description,
      })
    }
  }

  return { toast }
}

// Export sonner toast for direct usage
export { toast as sonnerToast } from 'sonner'

