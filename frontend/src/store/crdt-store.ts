import { IndexeddbPersistence } from "y-indexeddb"
import { WebsocketProvider } from "y-websocket"
import * as Y from "yjs"
import { Id } from "../../../common/src/domain"
import { ServerConnection, WS_ROOT } from "./server-connection"
import * as L from "lonna"

type BoardCRDT = ReturnType<typeof BoardCRDT>

function BoardCRDT(boardId: Id, online: L.Property<boolean>) {
    const doc = new Y.Doc()

    const persistence = new IndexeddbPersistence(`b/${boardId}`, doc)

    persistence.on("synced", () => {
        console.log("CRDT data from indexedDB is loaded")
    })

    const provider = new WebsocketProvider(`${WS_ROOT}/socket/yjs`, `board/${boardId}`, doc, {
        connect: online.get(),
    })

    online.onChange((c) => (c ? provider.connect() : provider.disconnect()))

    provider.on("status", (event: any) => {
        console.log("YJS Provider status", event.status)
    })

    function getField(itemId: Id, field: string) {
        return doc.getText(`items.${itemId}.${field}`)
    }

    return {
        doc,
        getField,
        awareness: provider.awareness,
    }
}

export type CRDTStore = ReturnType<typeof CRDTStore>
export function CRDTStore(online: L.Property<boolean>) {
    const boards = new Map<Id, BoardCRDT>()
    function getBoardCrdt(boardId: Id): BoardCRDT {
        let doc = boards.get(boardId)
        if (!doc) {
            doc = BoardCRDT(boardId, online)
        }
        return doc
    }
    return {
        getBoardCrdt,
    }
}