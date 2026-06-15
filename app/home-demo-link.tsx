'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { trackProductEvent } from '@/components/analytics/product-event-tracker'

export function HomeDemoLink({
  children,
  className,
}: {
  children: ReactNode
  className: string
}) {
  return (
    <Link
      href="/audit?demo=high-risk"
      onClick={() =>
        trackProductEvent('demo_click', {
          href: '/audit?demo=high-risk',
          surface: 'home_hero',
        })
      }
      className={className}
    >
      {children}
    </Link>
  )
}
