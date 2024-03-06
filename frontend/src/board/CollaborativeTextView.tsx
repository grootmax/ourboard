import { componentScope, h } from "harmaja"
import * as L from "lonna"
import Quill from "quill"
import QuillCursors from "quill-cursors"
import { QuillBinding } from "y-quill"
import { Board, getAlign, getHorizontalAlign, getItemBackground, TextItem } from "../../../common/src/domain"
import { Dispatch } from "../store/board-store"
import { CRDTStore } from "../store/crdt-store"
import { BoardFocus } from "./board-focus"
import { contrastingColor } from "./contrasting-color"
import { getAlignItems } from "./ItemView"
import { ToolController } from "./tool-selection"
import { preventDoubleClick } from "./double-click"

Quill.register("modules/cursors", QuillCursors)

interface CollaborativeTextViewProps {
    item: L.Property<TextItem>
    board: L.Property<Board>
    dispatch: Dispatch
    id: string
    toolController: ToolController
    focus: L.Atom<BoardFocus>
    itemFocus: L.Property<"none" | "selected" | "dragging" | "editing">
    crdtStore: CRDTStore
    isLocked: L.Property<boolean>
}
export function CollaborativeTextView({
    id,
    item,
    board,
    dispatch,
    toolController,
    focus,
    itemFocus,
    isLocked,
    crdtStore,
}: CollaborativeTextViewProps) {
    const fontSize = L.view(item, (i) => `${i.fontSize ? i.fontSize : 1}em`)
    const color = L.view(item, getItemBackground, contrastingColor)

    const quillEditor = L.atom<Quill | null>(null)

    function initQuill(el: HTMLElement) {
        const quill = new Quill(el, {
            modules: {
                cursors: true,
                toolbar: false,
                history: {
                    userOnly: true, // Local undo shouldn't undo changes from remote users
                },
            },
            theme: "snow",
        })

        const crdt = crdtStore.getBoardCrdt(board.get().id)
        const ytext = crdt.getField(id, "text")
        new QuillBinding(ytext, quill, crdt.awareness)
        quillEditor.set(quill)
    }

    const editingThis = L.view(itemFocus, (f) => f === "editing")

    editingThis.forEach((e) => {
        const q = quillEditor.get()
        if (q) {
            if (e) {
                const multipleLines =
                    q
                        .getText()
                        .split("\n")
                        .filter((x) => x).length > 1
                if (!multipleLines) {
                    // For one-liners, select the whole text on double click
                    q.setSelection(0, 1000000)
                }
            } else {
                // Clear text selecting when not editing
                q.setSelection(null as any)
            }
        }
    })

    function handleClick() {
        if (itemFocus.get() === "selected") {
            focus.set({ status: "editing", itemId: id })
        }
    }

    const pointerEvents = L.view(itemFocus, isLocked, (f, l) =>
        f === "editing" || f === "selected" || l ? "auto" : "none",
    )
    const hAlign = L.view(item, getAlign, getHorizontalAlign).applyScope(componentScope())
    hAlign.onChange((align) => {
        quillEditor.get()?.formatText(0, 10000000, "align", align === "left" ? "" : align)
    })

    let touchMoves = 0

    return (
        <div
            className="quill-wrapper text"
            onKeyUp={(e) => {
                e.stopPropagation()
                if (e.key === "Escape") {
                    focus.set({ status: "selected", itemIds: new Set([id]), connectionIds: new Set() })
                }
            }}
            onKeyDown={(e) => {
                e.stopPropagation()
            }}
            onKeyPress={(e) => {
                e.stopPropagation()
            }}
            onDoubleClick={(e) => {
                e.stopPropagation()
                quillEditor.get()?.focus()
            }}
            onTouchStart={(e) => {
                preventDoubleClick(e)
                touchMoves = 0
            }}
            onTouchMove={() => touchMoves++}
            onTouchEnd={() => {
                if (touchMoves === 0) {
                    // This is a way to detect a tap (vs swipe)
                    quillEditor.get()?.focus()
                }
            }}
            onClick={handleClick}
            style={L.combineTemplate({ alignItems: L.view(item, getAlignItems) })}
        >
            <div
                className="quill-editor"
                style={L.combineTemplate({ fontSize, color, pointerEvents })}
                ref={initQuill}
            />
        </div>
    )
}
