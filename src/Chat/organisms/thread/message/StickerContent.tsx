import React from "react"
import { as, toRem } from "folds"
import { MatrixEvent } from "matrix-js-sdk"
import {
  AttachmentBox,
  MessageBrokenContent,
  MessageDeletedContent
} from "../../../components/message"
import { ImageContent } from "./ImageContent"
import { scaleYDimension } from "../../../utils/common"
import { IImageContent } from "../../../types/matrix/common"

type StickerContentProps = {
  mEvent: MatrixEvent
  autoPlay: boolean
}
export const StickerContent = as<"div", StickerContentProps>(
  ({ mEvent, autoPlay, ...props }, ref) => {
    if (mEvent.isRedacted()) return <MessageDeletedContent />
    const content = mEvent.getContent<IImageContent>()

    let mediaMXC
    let mimeType
    let file
    let msgType
    let height
    let mType
    let safeMimeType

    if (content.attachments?.length) {
      mediaMXC = content?.attachments[0]?.url?.content_uri
      mimeType = content?.attachments[0]?.info?.type

      file = content?.attachments[0]?.info
      msgType = content?.attachments
        ? content?.attachments[0]?.info.mtype
        : MsgType.File

      height = scaleYDimension(
        content?.attachments[0]?.info?.w || 152,
        152,
        content?.attachments[0]?.info?.h || 152
      )
      mType = content?.attachments[0]?.info?.mtype
    }

    if (!mediaMXC) {
      return <MessageBrokenContent />
    }

    return (
      <AttachmentBox
        style={{
          height: toRem(height < 48 ? 48 : height),
          width: toRem(152)
        }}
        {...props}
        ref={ref}
      >
        <ImageContent
          autoPlay={autoPlay}
          body={content.body || "Image"}
          info={file}
          mimeType={mimeType}
          url={mediaMXC}
          // encInfo={content.file}
        />
      </AttachmentBox>
    )
  }
)
