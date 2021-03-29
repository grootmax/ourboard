import { h } from "harmaja"
import * as L from "lonna"
import { BoardCoordinateHelper } from "./board-coordinates"
import { Board, Image, Video } from "../../../common/src/domain"
import { BoardFocus } from "./board-focus"
import { SelectionBorder } from "./SelectionBorder"
import { AssetStore } from "../store/asset-store"
import { itemDragToMove } from "./item-dragmove"
import { itemSelectionHandler } from "./item-selection"
import { Dispatch } from "../store/server-connection"
import { Tool, ToolController } from "./tool-selection"
import { DragBorder } from "./DragBorder"

export const VideoView = ({
    id,
    video,
    assets,
    board,
    isLocked,
    focus,
    toolController,
    coordinateHelper,
    dispatch,
}: {
    board: L.Property<Board>
    id: string
    video: L.Property<Video>
    isLocked: L.Property<boolean>
    focus: L.Atom<BoardFocus>
    toolController: ToolController
    coordinateHelper: BoardCoordinateHelper
    dispatch: Dispatch
    assets: AssetStore
}) => {
    const { selected, onClick } = itemSelectionHandler(
        id,
        "video",
        focus,
        toolController,
        board,
        coordinateHelper,
        dispatch,
    )
    const tool = toolController.tool
    return (
        <span
            className="video"
            onClick={onClick}
            ref={itemDragToMove(id, board, focus, toolController, coordinateHelper, dispatch) as any}
            style={L.view(
                video,
                (p: Video) =>
                    ({
                        top: 0,
                        left: 0,
                        transform: `translate(${p.x}em, ${p.y}em)`,
                        height: p.height + "em",
                        width: p.width + "em",
                        zIndex: p.z,
                        position: "absolute",
                    } as any),
            )}
        >
            <video id="video" controls={true} preload="none">
                <source id="mp4" src={L.view(video, (i) => assets.getAsset(i.assetId, i.src))} type="video/mp4" />
                <p>Your user agent does not support the HTML5 Video element.</p>
            </video>
            {L.view(isLocked, (l) => l && <span className="lock">🔒</span>)}
            {L.view(
                selected,
                tool,
                (s, t) =>
                    s &&
                    t !== "connect" && (
                        <SelectionBorder {...{ id, item: video, coordinateHelper, board, focus, dispatch }} />
                    ),
            )}
            <DragBorder {...{ id, board, toolController, coordinateHelper, focus, dispatch }} />
        </span>
    )
}