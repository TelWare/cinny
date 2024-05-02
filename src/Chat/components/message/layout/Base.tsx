import React from "react"
import { Text, as } from "folds"
import classNames from "classnames"
import * as css from "./layout.css"

type MessageBaseType = css.MessageBaseVariants & {
  senderId: string
  currentUserId: string
  roomType: string
}

const eventsToBeOnRight = ["m.room.message", "m.sticker"]

export const MessageBase = as<"div", MessageBaseType>(
  (
    {
      className,
      senderId,
      currentUserId,
      eventType,
      roomType,
      highlight,
      selected,
      collapse,
      autoCollapse,
      space,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={classNames(
          css.MessageBase({
            highlight,
            selected,
            collapse,
            autoCollapse,
            space
          }),
          className,
          senderId === currentUserId &&
            roomType !== "Channels" &&
            eventsToBeOnRight?.includes(eventType)
            ? css.moveToright
            : ""
        )}
        {...props}
        ref={ref}
      />
    )
  }
)

export const AvatarBase = as<"span">(({ className, ...props }, ref) => (
  <span
    className={classNames(css.AvatarBase, className)}
    {...props}
    ref={ref}
  />
))

export const Username = as<"span">(
  ({ as: AsUsername = "span", className, ...props }, ref) => (
    <AsUsername
      className={classNames(css.Username, className)}
      {...props}
      ref={ref}
    />
  )
)

export const MessageTextBody = as<
  "div",
  css.MessageTextBodyVariants & { notice?: boolean }
>(
  (
    {
      as: asComp = "div",
      className,
      preWrap,
      jumboEmoji,
      emote,
      notice,
      ...props
    },
    ref
  ) => (
    <Text
      as={asComp}
      size="T400"
      priority={notice ? "300" : "400"}
      className={classNames(
        css.MessageTextBody({ preWrap, jumboEmoji, emote }),
        className
      )}
      {...props}
      ref={ref}
    />
  )
)
