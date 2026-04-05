"use client"

import { cva } from "class-variance-authority"
import { CSSProperties } from "react"
import { HTMLMotionProps, motion } from "motion/react"

import { cn } from "@/lib/utils"

const morphingSquareVariants = cva("flex gap-2 items-center justify-center", {
  variants: {
    messagePlacement: {
      bottom: "flex-col",
      top: "flex-col-reverse",
      right: "flex-row",
      left: "flex-row-reverse",
    },
  },
  defaultVariants: {
    messagePlacement: "bottom",
  },
})

export interface MorphingSquareProps {
  message?: string
  /**
   * Position of the message relative to the spinner.
   * @default bottom
   */
  messagePlacement?: "top" | "bottom" | "left" | "right"
}

export function MorphingSquare({
  className,
  message,
  messagePlacement = "bottom",
  ...props
}: HTMLMotionProps<"div"> & MorphingSquareProps) {
  const { style, ...restProps } = props
  const directionByPlacement: Record<NonNullable<MorphingSquareProps["messagePlacement"]>, CSSProperties["flexDirection"]> = {
    bottom: "column",
    top: "column-reverse",
    right: "row",
    left: "row-reverse",
  }

  return (
    <div
      className={cn(morphingSquareVariants({ messagePlacement }))}
      style={{
        display: "flex",
        flexDirection: directionByPlacement[messagePlacement],
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: "inherit",
        textAlign: "center",
        margin: "0 auto",
        width: "fit-content",
      }}
    >
      <motion.div
        className={cn("w-10 h-10 bg-foreground", className)}
        style={{
          display: "block",
          width: 40,
          height: 40,
          backgroundColor: "currentColor",
          ...style,
        }}
        animate={{
          borderRadius: ["6%", "50%", "6%"],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        {...restProps}
      />
      {message && (
        <div
          style={{
            color: "inherit",
            padding: "6px 12px",
            fontSize: 14,
            lineHeight: 1.1,
          }}
        >
          {message}
        </div>
      )}
    </div>
  )
}
