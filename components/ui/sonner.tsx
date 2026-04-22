'use client'

import * as React from 'react'

import { Toaster as AppToaster } from '@/components/ui/toaster'
import { toast as baseToast } from '@/hooks/use-toast'

type ToastInput =
  | string
  | (Parameters<typeof baseToast>[0] & {
      title?: React.ReactNode
      description?: React.ReactNode
    })

type CompatToast = {
  (input: ToastInput, description?: React.ReactNode): ReturnType<typeof baseToast>
  success: (input: ToastInput, description?: React.ReactNode) => ReturnType<typeof baseToast>
  error: (input: ToastInput, description?: React.ReactNode) => ReturnType<typeof baseToast>
}

function normalizeToast(
  input: ToastInput,
  description?: React.ReactNode,
  variant: 'default' | 'destructive' = 'default',
) {
  if (typeof input === 'string') {
    return {
      title: input,
      description,
      variant,
    }
  }

  return {
    ...input,
    description: input.description ?? description,
    variant: input.variant ?? variant,
  }
}

const toast = ((input: ToastInput, description?: React.ReactNode) =>
  baseToast(normalizeToast(input, description))) as CompatToast

toast.success = (input: ToastInput, description?: React.ReactNode) =>
  baseToast(normalizeToast(input, description, 'default'))

toast.error = (input: ToastInput, description?: React.ReactNode) =>
  baseToast(normalizeToast(input, description, 'destructive'))

type ToasterProps = {
  position?: string
}

function Toaster(_props: ToasterProps) {
  return <AppToaster />
}

export { Toaster, toast }
