import { Separator as ChakraSeparator } from "@chakra-ui/react"
import { forwardRef } from "react"

export const Separator = forwardRef(function Separator(props, ref) {
  const { orientation = "horizontal", decorative, ...rest } = props
  return (
    <ChakraSeparator
      ref={ref}
      orientation={orientation}
      decorative={decorative}
      {...rest}
    />
  )
})
