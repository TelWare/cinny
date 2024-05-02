import React, { useState } from "react"
import {
  Avatar,
  AvatarFallback,
  Box,
  Icon,
  Icons,
  Modal,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Text,
  as,
  config
} from "folds"
import { Room } from "matrix-js-sdk"
import classNames from "classnames"
import FocusTrap from "focus-trap-react"

import { getMemberAvatarMxc, getMemberDisplayName } from "../../utils/room"
import { getMxIdLocalPart } from "../../utils/matrix"
import * as css from "./RoomViewFollowing.css"
import { useMatrixClient } from "../../hooks/useMatrixClient"
import { useRoomLatestRenderedEvent } from "../../hooks/useRoomLatestRenderedEvent"
import { useRoomEventReaders } from "../../hooks/useRoomEventReaders"
import { EventReaders } from "../../components/event-readers"
import { AvatarBase } from "../../components/message"
import colorMXID from "../../util/colorMXID"
import { Avatar as AvatarAtom } from "../../atoms/avatar/Avatar"

export type RoomViewFollowingProps = {
  room: Room
}
export const RoomViewFollowing = as<"div", RoomViewFollowingProps>(
  ({ className, room, ...props }, ref) => {
    const mx = useMatrixClient()
    const [open, setOpen] = useState(false)
    const latestEvent = useRoomLatestRenderedEvent(room)
    const latestEventReaders = useRoomEventReaders(room, latestEvent?.getId())
    const eventId = latestEvent?.getId()
    const senderId = latestEvent?.getSender() ?? ""

    const readersList = latestEventReaders
      .filter((readerId) => readerId !== mx.getUserId())
      .map((readerId) => {
        const senderAvatarMxc = getMemberAvatarMxc(room, readerId)
        const senderDisplayName =
          getMemberDisplayName(room, readerId) ??
          getMxIdLocalPart(readerId) ??
          readerId
        return { name: senderDisplayName, avatar: senderAvatarMxc }
      })

    return (
      <>
        <div
          className="seenprofile-wrapper"
          style={{ display: "flex" }}
          onClick={readersList?.length > 0 ? () => setOpen(true) : undefined}
        >
          {readersList?.slice(0, 3).map((reader) => {
            return (
              <AvatarBase className="avatar-profile">
                <Avatar
                  // className={css.MessageAvatar}
                  as="button"
                  size="300"
                  data-user-id={senderId}
                >
                  {reader.avatar ? (
                    <AvatarAtom
                      imageSrc={reader.avatar}
                      text={reader.name[0]}
                      bgColor={colorMXID(senderId)}
                      size="extra-small"
                    />
                  ) : (
                    <AvatarFallback
                      style={{
                        background: colorMXID(senderId),
                        color: "white"
                      }}
                    >
                      <Text size="H4">{reader.name[0]}</Text>
                    </AvatarFallback>
                  )}
                </Avatar>
              </AvatarBase>
            )
          })}
          {readersList?.length > 3 && (
            <div style={{ color: "white" }} className="img-wrap">
              +{readersList.length - 3}
            </div>
          )}
        </div>
        {eventId && (
          <Overlay open={open} backdrop={<OverlayBackdrop />}>
            <OverlayCenter>
              <FocusTrap
                focusTrapOptions={{
                  initialFocus: false,
                  onDeactivate: () => setOpen(false),
                  clickOutsideDeactivates: true
                }}
              >
                <Modal variant="Surface" size="300">
                  <EventReaders
                    room={room}
                    eventId={eventId}
                    requestClose={() => setOpen(false)}
                  />
                </Modal>
              </FocusTrap>
            </OverlayCenter>
          </Overlay>
        )}
        {/* <Box
          as={names.length > 0 ? "button" : "div"}
          onClick={names.length > 0 ? () => setOpen(true) : undefined}
          className={classNames(
            css.RoomViewFollowing({ clickable: names.length > 0 }),
            className
          )}
          alignItems="Center"
          justifyContent="End"
          gap="200"
          {...props}
          ref={ref}
        >
          {names.length > 0 && (
            <>
              <Icon
                style={{ opacity: config.opacity.P300 }}
                size="100"
                src={Icons.CheckTwice}
              />
              <Text size="T300" truncate>
                {names.length === 1 && (
                  <>
                    <b>{names[0]}</b>
                    <Text as="span" size="Inherit" priority="300">
                      {" is following the conversation."}
                    </Text>
                  </>
                )}
                {names.length === 2 && (
                  <>
                    <b>{names[0]}</b>
                    <Text as="span" size="Inherit" priority="300">
                      {" and "}
                    </Text>
                    <b>{names[1]}</b>
                    <Text as="span" size="Inherit" priority="300">
                      {" are following the conversation."}
                    </Text>
                  </>
                )}
                {names.length === 3 && (
                  <>
                    <b>{names[0]}</b>
                    <Text as="span" size="Inherit" priority="300">
                      {", "}
                    </Text>
                    <b>{names[1]}</b>
                    <Text as="span" size="Inherit" priority="300">
                      {" and "}
                    </Text>
                    <b>{names[2]}</b>
                    <Text as="span" size="Inherit" priority="300">
                      {" are following the conversation."}
                    </Text>
                  </>
                )}
                {names.length > 3 && (
                  <>
                    <b>{names[0]}</b>
                    <Text as="span" size="Inherit" priority="300">
                      {", "}
                    </Text>
                    <b>{names[1]}</b>
                    <Text as="span" size="Inherit" priority="300">
                      {", "}
                    </Text>
                    <b>{names[2]}</b>
                    <Text as="span" size="Inherit" priority="300">
                      {" and "}
                    </Text>
                    <b>{names.length - 3} others</b>
                    <Text as="span" size="Inherit" priority="300">
                      {" are following the conversation."}
                    </Text>
                  </>
                )}
              </Text>
            </>
          )}
        </Box> */}
      </>
    )
  }
)
