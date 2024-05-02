/* eslint-disable react/no-children-prop */
import { Popover, Tooltip } from "antd"
import React, { FC, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { AvatarStyle } from "../../../../Avatar/Avatar.style"
import getNameInitials from "../../../../../utils/helper"
import SeenProfileStyle from "../../../../SeenProfile/SeenProfile.style"
import { SeenMessageProps } from "../../../../../interfaces/SeenMessageProps"
import { Room } from "matrix-js-sdk"
import { useMatrixClient } from "../../../hooks/useMatrixClient"
import { useRoomEventReaders } from "../../../hooks/useRoomEventReaders"
import { getMxIdLocalPart } from "../../../utils/matrix"
import { getMemberDisplayName } from "../../../utils/room"
import { Icon, MenuItem, Modal, Overlay, OverlayBackdrop, OverlayCenter, Text, as } from "folds"
import FocusTrap from "focus-trap-react"
import { EventReaders } from "../../../components/event-readers"

interface SeenProfileprops {
  room: Room
  eventId: string
  setOpen: (arg0: boolean) => void
}



export const SeenProfile: FC<SeenProfileprops> = (props: SeenProfileprops) => {
  const { room, eventId, setOpen } = props
  const mx = useMatrixClient()
  const latestEventReaders = useRoomEventReaders(room, eventId)

  const getName = (userId: string) =>
    getMemberDisplayName(room, userId) ?? getMxIdLocalPart(userId) ?? userId


    const seenByUsersList = latestEventReaders.map((readerId) => {
        const name = getName(readerId);
        const avatarUrl = room.getMember(readerId)?.getAvatarUrl(mx.baseUrl, 100, 100, "crop", undefined, false);
        return { name, avatarUrl };
      });
      
      const readersList = seenByUsersList.map((user) => user.name).join(", ")
  return (
    <SeenProfileStyle>
      <Tooltip
        title={`Seen by ${latestEventReaders.length} people
            ${readersList}`}
        placement="topRight"
      >
        {seenByUsersList.slice(0, 3).map((seenByUser) => {
          return (
            <div className="img-wrap" onClick={()=>setOpen(true)}>
              <AvatarStyle
                style={{
                  width: "100%",
                  height: "100%"
                }}
                icon={<>{getNameInitials(seenByUser.name)}</>}
                size="small"
                shape="square"
                src={seenByUser.avatarUrl}
              />
                {/* <img src={seenByUser?.avatarUrl} alt="auththumb" /> */}
            </div>
          )
        })}
      </Tooltip>
      {seenByUsersList.length > 3 && (
        <div className="img-wrap">+{seenByUsersList.length - 3}</div>
      )}
    </SeenProfileStyle>
  )
}




 const MessageReadReceiptItemIcon = as<
  "button",
  {
    room: Room
    eventId: string
  }
>(({ room, eventId, ...props }, ref) => {
  const [open, setOpen] = useState(false)

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <Overlay open={open} backdrop={<OverlayBackdrop />}>
        <OverlayCenter>
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              onDeactivate: handleClose,
              clickOutsideDeactivates: true
            }}
          >
            <Modal variant="Surface" size="300">
              <EventReaders
                room={room}
                eventId={eventId}
                requestClose={handleClose}
              />
            </Modal>
          </FocusTrap>
        </OverlayCenter>
      </Overlay>
       <SeenProfile setOpen={setOpen} room={room} eventId={eventId} /> 
    </>
  )
})

export default MessageReadReceiptItemIcon