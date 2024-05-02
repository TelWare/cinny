import React, { useState } from "react"
import PropTypes from "prop-types"

import { twemojify } from "../../util/twemojify"

import initMatrix from "../../client/initMatrix"
import { openInviteUser } from "../../client/action/navigation"
import * as roomActions from "../../client/action/room"
import { markAsRead } from "../../client/action/notifications"

import { MenuHeader, MenuItem } from "../../atoms/context-menu/ContextMenu"
import RoomNotification from "../room-notification/RoomNotification"

import TickMarkIC from "../../public/res/ic/outlined/tick-mark.svg"
import PinIC from "../../public/res/ic/outlined/pin.svg"
import PinFilledIC from "../../public/res/ic/filled/pin.svg"
import AddUserIC from "../../public/res/ic/outlined/add-user.svg"
import LeaveArrowIC from "../../public/res/ic/outlined/leave-arrow.svg"

import { confirmDialog } from "../confirm-dialog/ConfirmDialog"
import appDispatcher from "../../client/dispatcher"
import cons from "../../client/state/cons"

function RoomOptions({ roomId, afterOptionSelect }) {
  const mx = initMatrix.matrixClient
  const room = mx.getRoom(roomId)
  const isChannel = room.getType() === "Channels"
  const canInvite = room?.canInvite(mx.getUserId())
  const [isPinned, setIsPinned] = useState(
    room.tags.hasOwnProperty("m.favourite")
  )

  const handleMarkAsRead = () => {
    markAsRead(roomId)
    afterOptionSelect()
  }

  const handleInviteClick = () => {
    openInviteUser(roomId)
    afterOptionSelect()
  }

  const handlePinClick = async () => {
    if (isPinned) {
      await mx?.deleteRoomTag(roomId, "m.favourite")
      setIsPinned(false)
      appDispatcher.dispatch({
        type: cons.actions.room.UNPINNED,
        roomId
      })
    } else {
      await mx?.setRoomTag(roomId, "m.favourite")
      setIsPinned(true)
      appDispatcher.dispatch({
        type: cons.actions.room.PINNED,
        roomId
      })
    }

    afterOptionSelect()
  }

  const handleLeaveClick = async () => {
    afterOptionSelect()
    const isConfirmed = await confirmDialog(
      "Leave room",
      `Are you sure that you want to leave "${room.name}" room?`,
      "Leave",
      "danger"
    )
    if (!isConfirmed) return
    roomActions.leave(roomId)
  }

  return (
    <div style={{ maxWidth: "256px" }}>
      <MenuHeader>
        {twemojify(
          `Options for ${initMatrix.matrixClient.getRoom(roomId)?.name}`
        )}
      </MenuHeader>
      <MenuItem iconSrc={TickMarkIC} onClick={handleMarkAsRead}>
        Mark as read
      </MenuItem>
      <MenuItem
        onClick={handlePinClick}
        iconSrc={isPinned ? PinFilledIC : PinIC}
      >
        {isPinned
          ? isChannel
            ? "Unpin Channel"
            : "Unpin Chat"
          : isChannel
          ? "Pin Channel"
          : "Pin Chat"}
      </MenuItem>
      <MenuItem
        iconSrc={AddUserIC}
        onClick={handleInviteClick}
        disabled={!canInvite}
      >
        Invite
      </MenuItem>
      <MenuItem
        iconSrc={LeaveArrowIC}
        variant="danger"
        onClick={handleLeaveClick}
      >
        Leave
      </MenuItem>
      {/* <MenuHeader>Notification</MenuHeader>
      <RoomNotification roomId={roomId} /> */}
    </div>
  )
}

RoomOptions.defaultProps = {
  afterOptionSelect: null
}

RoomOptions.propTypes = {
  roomId: PropTypes.string.isRequired,
  afterOptionSelect: PropTypes.func
}

export default RoomOptions
