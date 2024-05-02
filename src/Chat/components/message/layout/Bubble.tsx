import React, { ReactNode } from "react"
import { Box, as } from "folds"
import * as css from "./layout.css"
import classNames from "classnames"

type BubbleLayoutProps = {
  before?: ReactNode
}

export const BubbleLayout = as<"div", BubbleLayoutProps>(
  ({ before, children, className, ...props }, ref) => (
    <Box gap="300" {...props} ref={ref}>
      <Box className={css.BubbleBefore} shrink="No">
        {before}
      </Box>
      <Box
        // className={(css.BubbleContent, channelClassName)}
        className={classNames(css.BubbleContent, className)}
        direction="Column"
      >
        {children}
      </Box>
    </Box>
  )
)
